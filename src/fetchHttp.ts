import { type dbInstance } from "./db.ts";
import { getLogger } from "./logger.ts";
const logger = getLogger("fetchHttp");
export class FetchHttp {
  public enableLog: boolean = true;
  private readonly dbInstance: dbInstance;
  constructor(
    dbInstance: dbInstance
  ) {
    this.dbInstance = dbInstance;
  }
  async fetchHttp(
    request: Request,
    option: {
      saveCache: "always-save" | "disable-save" | "only-2xx-save",
      loadCache: "no-load" | "only-2xx-load" | "always-load-if-exist",
      primaryKey?: string,
      /// デフォルトはtrue
      enableRedirect?: boolean,
    }
  ) {
    let _primaryKey = option.primaryKey ?? request.url.toString()
    if (this.enableLog) {
      logger.info(`${request.method} ${request.url}`);
    }
    if (option.loadCache != "no-load") {
      const dbData = await this.dbInstance.getPrimaryKey(_primaryKey)
      if (dbData != null && option.loadCache == "always-load-if-exist") {
        return new FetchHttpResponse({
          enableSave: false,
          isCache: true,
          responseCode: dbData.response_code,
          responseHeader: JSON.parse(dbData.response_header),
          responseByte: dbData.response_binary
        });
      } else if (dbData != null && option.loadCache == "only-2xx-load") {
        if (200 <= dbData.response_code && dbData.response_code <= 299) {
          return new FetchHttpResponse({
            isCache: true,
            enableSave: false,
            responseCode: dbData.response_code,
            responseHeader: JSON.parse(dbData.response_header),
            responseByte: dbData.response_binary
          });
        }
      }
    }
    const response = await fetch(request, {
      redirect: option.enableRedirect == false ? "manual" : "follow",
    });
    let isSave = false;
    const responseBody = await response.arrayBuffer().then(b => new Uint8Array(b));
    if (option.saveCache != "disable-save") {
      if (option.saveCache == "always-save") {
        isSave = true;
      } else if (option.saveCache == "only-2xx-save") {
        if (200 <= response.status && response.status <= 299) {
          isSave = true;
        }
      }
      if (isSave) {
        await this.dbInstance.saveResponse(
          _primaryKey,
          request.url,
          request.method as "GET" | "POST",
          Object.fromEntries(request.headers.entries()),
          response.status,
          Object.fromEntries(response.headers.entries()),
          Buffer.from(responseBody),
        );
      }
    }
    return new FetchHttpResponse({
      enableSave: isSave == false,
      isCache: false,
      responseCode: response.status,
      responseHeader: Object.fromEntries(request.headers.entries()),
      responseByte: responseBody
    });
  }
}
export async function fetchHttp(
  dbInstance: dbInstance,
  request: Request,
  option: {
    saveCache: "always-save" | "disable-save" | "only-2xx-save",
    loadCache: "no-load" | "only-2xx-load" | "always-load-if-exist",
    primaryKey?: string,
    disableRedirect?: boolean,
  }
) {
  const result = await new FetchHttp(dbInstance).fetchHttp(request, option);
  return result;
}
class FetchHttpResponse {
  readonly enableSave: boolean;
  readonly isCache: boolean;
  readonly ok: boolean;
  readonly responseCode: number;
  readonly responseHeader: Record<string, string>;
  readonly responseByte: Uint8Array;
  private static td = new TextDecoder();
  private responseTextLoaded: boolean = false;
  private _responseText: string = "";
  constructor(
    opt: {
      enableSave: boolean,
      isCache: boolean,
      responseCode: number,
      responseHeader: Record<string, string>,
      responseByte: Uint8Array,
    }
  ) {
    this.isCache = opt.isCache;
    this.enableSave = opt.enableSave;
    this.ok = 200 <= opt.responseCode && opt.responseCode <= 299;
    this.responseCode = opt.responseCode;
    this.responseHeader = opt.responseHeader;
    this.responseByte = opt.responseByte;
  }
  get responseText() {
    if (this.responseTextLoaded) {
      return this._responseText;
    } else {
      const r = FetchHttpResponse.td.decode(this.responseByte)
      this._responseText = r;
      this.responseTextLoaded = true;
      return r;
    }
  }
  async save() { }
}