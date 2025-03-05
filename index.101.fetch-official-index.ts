/**
 * 過去のぷららHP一覧ページをIAからfetchしてDBに保存。
 * 文字コードはsjisなので解析時注意
 */
import { dbInstance } from "./src/db";
import { fetchHttp } from "./src/fetchHttp";

const indexList = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
const genreList = ["100", "200", "300", "400", "500", "600", "700", "800", "900", "1000", "1100", "1200", "1300", "1400", "1500", "1600", "1700"];
await dbInstance.init();
for (const i of indexList) {
  await fetchData(`http://www1.plala.or.jp/town/PH_menu_index.${i}.htm`, `ia-list-char-${i}`);
}
for (const i of genreList) {
  await fetchData(`http://www1.plala.or.jp/town/PH_menu_genre.${i}.htm`, `ia-list-genre-${i.padStart(4, "0")}`);
}
console.log(`完了`);
async function fetchData(
  originalUrl: string,
  savePrimaryKeyPrefix: string
) {
  const requestUrl = new URL("https://web.archive.org/cdx/search/cdx?output=json&filter=statuscode:200");
  requestUrl.searchParams.append("url", originalUrl);
  const archiveList = await fetch(requestUrl).then(res => res.json()).then(res => {
    return Array.from(res).map((v: any) => {
      return {
        rawUrlString: String(v[2]),// ポート番号が入ったり入らなかったりしてる
        timestampStr: String(v[1])
      }
    }).filter(v => v.timestampStr.match(/\d+/))
  });
  for (const archiveData of archiveList) {
    const primaryKey = `${savePrimaryKeyPrefix}-${archiveData.timestampStr}`;
    while (true) {
      try {
        await fetchHttp(
          dbInstance,
          new Request(
            `https://web.archive.org/web/${archiveData.timestampStr}im_/${archiveData.rawUrlString}`,
          ),
          {
            loadCache: "always-load-if-exist",
            saveCache: "only-2xx-save",
            primaryKey: primaryKey,
          }
        )
        break;
      } catch (error) {
        console.warn(`fetch失敗 ${error}`);
        await new Promise(resolve => { setTimeout(() => { resolve(null) }, 5 * 1000) });
      }
    }
    console.log(`保存: ${primaryKey}`)
  }
}