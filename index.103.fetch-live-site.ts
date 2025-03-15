/**
 * ia_plala_base_url_listとplala_town_space_list から、存在する可能性のあるサイト一覧を作る
 * サイトを順番にhttpGETして、ステータスコードやレスポンスコードを一覧表示するhtmlを作る
 * アクティブなサイトの一覧を active_plala_hp_space_list に記録する
 */
import { writeFile, appendFile } from "fs/promises";
import { comparePlalaHpSpaceUrl } from "./src/compareBaseUrl.ts";
import { dbInstance } from "./src/db.ts";
import { FetchHttp } from "./src/fetchHttp.ts";
import { getLogger } from "./src/logger.ts";
import { ParseHtml } from "./src/parseHtml.ts";
import dateformat from "dateformat";
const logger = getLogger("index.103.fetchLiveSite")
logger.info("アプリ起動");
await dbInstance.init();
const allBaseUrlList = await dbInstance.getBaseUrlList();
const fetchHttp = new FetchHttp(dbInstance);
fetchHttp.enableLog = false;
const baseUrlList = [...allBaseUrlList].toSorted(comparePlalaHpSpaceUrl);
const resultBuilder = getResultBuilder();
const dbInsertDataList: {
  baseUrl: string,
  title: string,
  lastUpdateAt: Date | null,
  status: "success" | "warn" | "error",
}[] = [];
for (const baseUrl of baseUrlList) {
  const index = baseUrlList.indexOf(baseUrl) + 1;
  //logger.info(`${index}/${baseUrlList.length} ${baseUrl}`);
  try {
    const res = await fetchHttp.fetchHttp(
      new Request(baseUrl),
      {
        loadCache: "always-load-if-exist",
        saveCache: "always-save",
        enableRedirect: false,
      }
    );
    const parseHtml = new ParseHtml(
      baseUrl,
      res.responseCode,
      res.responseHeader,
      res.responseByte,
    )
    const parsed = await parseHtml.parse();
    const byteStr = res.responseByte.byteLength.toString().padStart(7) + " Byte";
    const prefix = [
      `${String(index).padStart(5)}/${baseUrlList.length}`,
      `Status:${res.responseCode} ${byteStr} ${baseUrl.padEnd(50)}`,
    ].join(" ");
    if (parsed.type == "plala-error-page") {
      await resultBuilder.addMsgOnly([
        prefix,
        `ぷららエラーページ`,
        `${parsed.errorType}`,
      ].join(" "));
      dbInsertDataList.push({ baseUrl: baseUrl, title: `ぷららエラーページ ${parsed.errorType}`, lastUpdateAt: null, status: "error" });
    } else if (parsed.type == "text-decode-failed") {
      await resultBuilder.addMsg([
        prefix,
        ...(parsed.lastModifired ? [`LastUp:${dateformat(parsed.lastModifired, "yyyy/mm/dd HH:MM")}`] : []),
        "文字コード判定失敗"
      ].join(" "));
      dbInsertDataList.push({ baseUrl: baseUrl, title: "文字コード判定失敗", lastUpdateAt: null, status: "warn" });
    } else if (parsed.type == "basic-auth") {
      await resultBuilder.addMsg([
        prefix,
        "Basic認証設定"
      ].join(" "));
      dbInsertDataList.push({ baseUrl: baseUrl, title: "Basic認証あり", lastUpdateAt: null, status: "warn"  });
    } else if (parsed.type == "index-of") {
      resultBuilder.addMsg([
        prefix,
        "index Of"
      ].join(" "));
      dbInsertDataList.push({ baseUrl: baseUrl, title: "Index of", lastUpdateAt: null, status: "warn"  });
    } else if (parsed.type == "normal") {
      await resultBuilder.addMsg([
        prefix,
        ...(parsed.lastModifired ? [`LastUp:${dateformat(parsed.lastModifired, "yyyy/mm/dd HH:MM")}`] : ["                       "]),
        `${parsed.encoding.padEnd(9)}`,
        ...(parsed.redirectUrl != null ? [`Redirect:[${parsed.redirectUrl}]`] : []),
        ...(parsed.hasFrameset ? [`FrameSetあり`] : []),
        `title:[${parsed.title}]`
      ].join(" "));
      resultBuilder.addCountActive(parsed.lastModifired?.getFullYear() ?? null);
      dbInsertDataList.push({ baseUrl: baseUrl, title: parsed.title, lastUpdateAt: parsed.lastModifired , status: "success" });
    }
  } catch (error) {
    logger.error(`${baseUrl} ${error}`);
    await new Promise(resolve => { setTimeout(() => { resolve(null) }, 1 * 1000) });
  }
}
await dbInstance.replaceActivePlalaHpSpaceList(dbInsertDataList);
await resultBuilder.end();
logger.info(`完了`);
function getResultBuilder() {
  return new (class {
    private readonly saveHtmlName = "index.103.out.html";
    private fileSaveString: string[] = [];
    private count = {
      ///ぷららのエラーページではないページ
      activeSite: 0,
      lastUpdate: {
        "1997": 0,
        "1998": 0,
        "1999": 0,
        "2000": 0,
        "2001": 0,
        "2002": 0,
        "2003": 0,
        "2004": 0,
        "2005": 0,
        "2006": 0,
        "2007": 0,
        "2008": 0,
        "2009": 0,
        "2010": 0,
        "2011": 0,
        "2012": 0,
        "2013": 0,
        "2014": 0,
        "2015": 0,
        "2016": 0,
        "2017": 0,
        "2018": 0,
        "2019": 0,
        "2020": 0,
        "2021": 0,
        "2022": 0,
        "2023": 0,
        "2024": 0,
        "2025": 0,
      }
    }
    constructor() {
    }
    async addMsg(str: string) {
      logger.info(str);
      this.fileSaveString.push(`<div>${this.convertHtmlLink(str)}</div>`);
    }
    async addMsgOnly(str: string) {
      this.fileSaveString.push(`<div>${this.convertHtmlLink(str)}</div>`);
    }
    addCountActive(lastUpdateYear: number | null) {
      this.count.activeSite += 1;
      if (lastUpdateYear != null) {
        if (String(lastUpdateYear) in this.count.lastUpdate) {
          //@ts-expect-error
          this.count.lastUpdate[String(lastUpdateYear)] += 1;
        } else {
          throw new Error(lastUpdateYear.toString());
        }
      }
    }
    async end() {
      const lastUpdateStr = Object.entries(this.count.lastUpdate).map(([k, v]) => {
        return `${k}年:${v}件`;
      }).join("、");
      const saveHtml = `
<!DOCTYPE html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<style>
div{
  font-family:monospace;
  white-space: pre;
}
</style>
<body>
<div>ページ作成:${new Date().toLocaleString()} , 有効ページ数:${this.count.activeSite}</div>
<div>最終更新年: ${lastUpdateStr}</div>
${this.fileSaveString.join("\n")}
<div>ここまで</div>
</body>`;
      await writeFile(this.saveHtmlName, saveHtml);
    }
    private convertHtmlLink(str: string) {
      const urlPattern = /https?:\/\/[^ \]]+/g;
      str = str.replace(urlPattern, (url) => {
        return `<a href="${url}" target="_blank">${url}</a>`;
      });
      return str;
    }
  })();
}