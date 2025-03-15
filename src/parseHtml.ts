import { JSDOM, VirtualConsole } from "jsdom";
import { parse as contentTypeParse } from "content-type";
import { getLogger } from "./logger.ts";
import { isParameter } from "typescript";
const logger = getLogger("ParseHtml");
// fatal:false がデフォルト
const tdSjisDoFatal = new TextDecoder("shift-jis", { fatal: true });
const tdUtf8NotFatal = new TextDecoder("utf-8", { fatal: false });
const allowEncodingList = { "utf-8": ["utf-8", "utf8"], "euc-jp": ["euc-jp"], "iso-2022-jp": ["iso-2022-jp"], "shift-jis": ["shift-jis", "shift_jis"] } as const;
type SupportEncoding = keyof typeof allowEncodingList;
const fatalTextDecoder: { type: SupportEncoding, dec: TextDecoder }[] = [
  { type: "utf-8", dec: new TextDecoder("utf-8", { fatal: true }) },
  { type: "euc-jp", dec: new TextDecoder("euc-jp", { fatal: true }) },
  { type: "iso-2022-jp", dec: new TextDecoder("iso-2022-jp", { fatal: true }) },
  { type: "shift-jis", dec: new TextDecoder("shift-jis", { fatal: true }) },
] as const;
const jsdomVirtualConsole = new VirtualConsole();
type plalaErrorPage =
  // ↓ http://www1.plala.or.jp/chargain/ 「■ アクセス権限がありません。Forbidden」
  "manual-hidden" |
  // ↓ http://www1.plala.or.jp/a_ya/ 「■ ファイルが見つかりません。NOT FOUND 誤ったURLを入力された可能性があります。再度ご確認のうえURLをご入力ください。」
  "page-not-found" |
  "try-cgi-faild" |
  "unknown";
type ParseResult = {
  type: "text-decode-failed",
  statusCode: number,
  lastModifired: Date | null,
} | {
  type: "basic-auth",
} | {
  type: "plala-error-page",
  errorType: plalaErrorPage,
} | {
  type: "index-of",
} | {
  type: "normal",
  title: string,
  encoding: SupportEncoding,
  redirectUrl: string | null,
  hasFrameset: boolean,
  lastModifired: Date | null,
}
export class ParseHtml {
  private readonly baseUrl: string;
  private readonly responseCode: number;
  private readonly responseHeader: Record<string, string>;
  private readonly buf: Uint8Array;
  constructor(
    baseUrl: string,
    responseCode: number,
    responseHeader: Record<string, string>,
    buf: Uint8Array,
  ) {
    this.baseUrl = baseUrl;
    this.responseCode = responseCode;
    this.responseHeader = responseHeader;
    this.buf = buf;
  }
  async parse(): Promise<ParseResult> {
    if (this.responseCode == 401) {
      return { type: "basic-auth" };
    } else if (this.responseCode == 403) {
      return { type: "plala-error-page", errorType: "manual-hidden" };
    } else if (this.responseCode == 500) {
      return { type: "plala-error-page", errorType: "try-cgi-faild" };
    }
    const lastModifired = this.getLastModified();
    const { bodyEncodingMaybe, bodyEncoding } = await this.getEncoding();
    if (bodyEncodingMaybe) {
      return {
        type: "text-decode-failed",
        statusCode: this.responseCode,
        lastModifired: lastModifired,
      }
    }
    const htmlText = fatalTextDecoder.find(i => i.type == bodyEncoding)!.dec.decode(this.buf);
    const dom = new JSDOM(htmlText, { virtualConsole: jsdomVirtualConsole }).window.document;
    await new Promise(resolve => { setTimeout(() => { resolve(null) }, 1) }); // これが大事
    const isPlalaErrorPage = this.isPlalaErrorPage(dom);
    if (isPlalaErrorPage) {
      const plalaErrorMessage = this.getPlalaHtmlErrorMessage(dom);
      return {
        type: "plala-error-page",
        errorType: plalaErrorMessage,
      }
    }
    const isIndexOf = this.isIndexOf(dom);
    if (isIndexOf) {
      return {
        type: "index-of",
      }
    }
    const title = this.getHtmlTitle(dom);
    const redirectUrl = this.getRedirectUrl();
    const hasFrameset = this.hasFrameset(dom);
    return {
      type: "normal",
      title: title,
      redirectUrl: redirectUrl,
      hasFrameset,
      encoding: bodyEncoding,
      lastModifired: lastModifired,
    };
  }
  private getLastModified() {
    if ("last-modified" in this.responseHeader) {
      const str = this.responseHeader["last-modified"];
      const date = new Date(str);
      if (!Number.isNaN(date)) {
        return date;
      }
    }
    return null;
  }
  private hasFrameset(dom: Document) {
    const hasFrameset = dom.querySelector("frameset") != null;
    return hasFrameset;
  }
  private getRedirectUrl() {
    if ("location" in this.responseHeader) {
      const redirectUrl = this.responseHeader["location"] ?? null;
      return redirectUrl;
    } else {
      return null;
    }
  }
  private getHtmlTitle(dom: Document) {
    const title = dom.querySelector("title")?.textContent ?? "";
    return title.replaceAll("\n", " ").trim();
  }
  private isIndexOf(dom: Document) {
    return dom.querySelector("body>h1")?.textContent?.startsWith("Index of /") ?? false;
  }
  private isPlalaErrorPage(dom: Document) {
    const isPlalaErrorPage = dom.querySelector(`body>table:nth-child(1) > tbody > tr > td > table:nth-child(1) > tbody > tr > td:nth-child(1) > a > img`)?.getAttribute("src") == "/.error_doc/hd_logo_normal.gif";
    return isPlalaErrorPage;
  }
  /**
   * http://www1.plala.or.jp/a_ya/ の様なぷららのエラーページのタイプを判定する
   */
  private getPlalaHtmlErrorMessage(dom: Document): plalaErrorPage {
    const errorMessage = dom.querySelector(`body[bgcolor="#FFFFFF"]>table[bgcolor="#EEEEEE"]>tbody>tr>td[align="center"]>table>tbody>tr>td`)?.textContent?.trim() ?? "";
    if (errorMessage.includes("■ ファイルが見つかりません。") && errorMessage.includes("Not Found") && errorMessage.includes("誤ったURLを入力された可能性があります。再度ご確認のうえURLをご入力ください。")) {
      return "page-not-found"
    }
    return "unknown";
  }
  private async getEncoding() {
    let bodyEncodingMaybe = true;
    let bodyEncoding: SupportEncoding = "utf-8";
    /*
    // 最初はレスポンスヘッダーやmetaタグから判断しようとしていたが、metaタグが嘘の場合があったのでやめ。
    if (bodyEncodingMaybe == true) {
      const headerEncoding = this.getResponseHeaderEncoding();
      if (headerEncoding != null) {
        bodyEncoding = headerEncoding;
        bodyEncodingMaybe = false;
        logger.info(`${this.baseUrl} -> ${headerEncoding}`);
      }
    }
    if (bodyEncodingMaybe == true) {
      const htmlString = tdUtf8NotFatal.decode(this.buf);
      const encoding = await this.getEncodingTag(htmlString);
      if (encoding != null) {
        bodyEncoding = encoding;
        bodyEncodingMaybe = false;
      }
    }
      */
    if (bodyEncodingMaybe == true) {
      const tryEncoding = this.getTextDecoderTryEncoding(this.buf);
      if (tryEncoding != null) {
        bodyEncoding = tryEncoding;
        bodyEncodingMaybe = false;
      }
    }
    return {
      bodyEncoding,
      bodyEncodingMaybe,
    };
  }
  private getTextDecoderTryEncoding(buf: Uint8Array): SupportEncoding | null {
    for (const dec of fatalTextDecoder) {
      try {
        dec.dec.decode(buf);
        return dec.type;
      } catch (error) { }
    }
    return null;
  }
  private getResponseHeaderEncoding() {
    const ct = this.responseHeader["content-type"];
    if (ct == null) {
      return null;
    }
    const charset = this.parseContentType(ct);
    return charset;
  }
  private async getEncodingTag(htmlString: string) {
    const dom = new JSDOM(htmlString, { virtualConsole: jsdomVirtualConsole }).window.document;
    await new Promise(resolve => { setTimeout(() => { resolve(null) }, 1) }); // これが大事
    const legacyHttpEquit = dom.querySelector(`meta[http-equiv="content-type"]`)?.getAttribute("content") ?? null;
    if (legacyHttpEquit != null) {
      const charset = this.parseContentType(legacyHttpEquit);
      if (charset != null) {
        return charset;
      }
    }
    {
      const html5Charset = dom.querySelector(`meta[charset]`)?.getAttribute("charset") ?? null;
      if (html5Charset != null) {
        const charset = this.getSupportEncodingType(html5Charset);
        if (charset != null) {
          return charset;
        }
      }
    }
    return null;
  }
  /**
   * contentTypeの"text/html; charset=Shift_JIS" からshift-jisの文字列を取る
   * @param contentTypeString 
   * @returns 
   */
  private parseContentType(contentTypeString: string | null): SupportEncoding | null {
    if (contentTypeString == null) {
      return null;
    }
    try {
      const x = contentTypeParse(contentTypeString);
      const charset = x.parameters?.["charset"]?.toLowerCase() ?? null;
      if (charset == null) {
        return null;
      }
      const encodingType = this.getSupportEncodingType(charset);
      if (encodingType != null) {
        return encodingType;
      }
    } catch (error) {
      debugger;
    }
    return null;
  }
  private getSupportEncodingType(encodingString: string) {
    for (const [key, val] of Object.entries(allowEncodingList)) {
      for (const vall of val) {
        if (vall.toLowerCase() == encodingString.toLowerCase()) {
          return key as SupportEncoding;
        }
      }
    }
    return null;
  }
}