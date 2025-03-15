import { dbInstance } from "../../../db";

const PPV = 300;
export type PlalaHpListResult = {
  totalItemCount: number,
  totalPageCount: number,
  nowPageCount: number,
  // PagenationElementのgetUrl() で渡す文字列。 has-contents などの文字を渡す。
  // データ構造もうちょっといい感じにしたい
  urlPrefix: string,
  hpDatas: PlalaHpData[],
};
type PlalaHpData = {
  id: number,
  baseUrl: string,
  title: string,
  status: "success" | "warn" | "error",
  lastUpdateAt: Date | null,
  archiveUrls: ArchiveFileData[],
}
type ArchiveFileData = {
  originalUrl: string,
};
export type StaticParams = {
  type: string, page: number
}
export class PageBuilder {
  private readonly dbInstance: dbInstance;
  constructor(
    dbInstance: dbInstance,
  ) {
    this.dbInstance = dbInstance;
  }
  /**
   * generateStaticParams 用のデータを返す。
   * エラー含まない・含むの全ページ数分だけ配列を返す
   */
  public async getPageStaticData(): Promise<string[]> {
    const hasContents = await this.dbInstance.getActivePlalaHpSpaceList2({
      includeSuccess: true,
      includeWarn: true,
      includeError: false,
      limit: 1,
    }).then(r => Number(r.queryCount));
    const includeError = await this.dbInstance.getActivePlalaHpSpaceList2({
      includeSuccess: true,
      includeWarn: true,
      includeError: true,
      limit: 1,
    }).then(r => Number(r.queryCount));
    const ppc = new PageParamConverter();
    const result: string[] = [];
    Array.from({ length: Math.ceil(hasContents / PPV) }).forEach((_, page) => result.push(ppc.encode("has-contents", page + 1)));
    Array.from({ length: Math.ceil(includeError / PPV) }).forEach((_, page) => result.push(ppc.encode("include-error", page + 1)));
    return result;
  }
  public async getPlalaHpList(param: {
    /** has-contents-page-1 など */
    pageId: string,
  }): Promise<PlalaHpListResult> {
    const ppc = new PageParamConverter();
    const requestPage = ppc.decode(param.pageId);
    const includeError = requestPage.type === "include-error";
    const offset = (requestPage.page - 1) * PPV;
    const result = await this.dbInstance.getActivePlalaHpSpaceList2({
      includeSuccess: true,
      includeWarn: true,
      includeError: includeError,
      limit: PPV,
      offset: offset,
    }).then(async (list) => {
      const r = {
        queryCount: Number(list.queryCount),
        list: list.result.map<PlalaHpData>((i, index) => {
          return {
            id: 1 + index + offset,
            baseUrl: i.base_url,
            title: i.title,
            status: i.status,
            lastUpdateAt: i.last_up ? new Date(i.last_up) : null,
            archiveUrls: []
          } satisfies PlalaHpData;
        })
      };
      for (const s of r.list) {
        await dbInstance.getActivePlalaHpSpaceChildFileListInf(s.baseUrl).then(childrenUrlList => {
          for (const c of childrenUrlList) {
            s.archiveUrls.push({ originalUrl: c });
          }
        })
      }
      return r;
    });
    return {
      totalItemCount: Number(result.queryCount),
      totalPageCount: Math.ceil(Number(result.queryCount) / PPV),
      nowPageCount: requestPage.page,
      hpDatas: result.list,
      urlPrefix: requestPage.type,
    };
  }
}
class PageParamConverter {
  encode(type: "include-error" | "has-contents", page: number) {
    return `${type}-page-${page}`;
  }
  decode(param: string) {
    const [type, pageStr] = param.split("-page-");
    return { type, page: Number(pageStr) };
  }
}
