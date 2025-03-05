import { comparePlalaHpSpaceUrl } from "./src/compareBaseUrl";
import { dbInstance } from "./src/db";
import { FetchHttp } from "./src/fetchHttp";
import { getLogger } from "./src/logger";
/**
 * ia_plala_base_url_listとplala_town_space_list から、存在する可能性のあるサイト一覧を作り
 * 順番にhttpgetしてキャッシュに残す。
 */
const logger = getLogger("index.103.fetchLiveSite")
await dbInstance.init();
const allBaseUrlList = await dbInstance.getBaseUrlList();
const fetchHttp = new FetchHttp(dbInstance);
fetchHttp.enableLog = false;
for (const baseUrl of [...allBaseUrlList].toSorted(comparePlalaHpSpaceUrl)) {
  try {
    const res = await fetchHttp.fetchHttp(
      new Request(baseUrl),
      {
        loadCache: "always-load-if-exist",
        saveCache: "always-save",
        enableRedirect: false,
      }
    );
    if (res.responseCode == 200) {
      logger.info(`${baseUrl} -> ${res.responseCode}`);
    } else if (res.responseCode == 401) { // basic認証がかかっている
      logger.info(`${baseUrl} -> ${res.responseCode}`);
    } else if (res.responseCode == 404) {
      logger.info(`${baseUrl} -> ${res.responseCode}`);
    } else if (res.responseCode == 403) { // 非公開設定にしている
      logger.info(`${baseUrl} -> ${res.responseCode}`);
    } else if (res.responseCode == 500) { // 提供終了したcgiを表示しようとしている
      logger.info(`${baseUrl} -> ${res.responseCode}`);
    } else {
      logger.info(`${baseUrl} -> ${res.responseCode} , ${res.responseHeader["location"]}`);
    }
    continue;
  } catch (error) {
    await new Promise(resolve => { setTimeout(() => { resolve(null) }, 1 * 1000) });
  }
}
logger.info(`完了`);
