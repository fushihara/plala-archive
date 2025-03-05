/**
 * IAからぷらら公式のHP一覧ページを読み込んで、htmlをパースしてHPの一覧を抜き出して
 * plala_town_space_list に保存
 */
import { JSDOM } from "jsdom";
import { dbInstance } from "./src/db";

await dbInstance.init();
const dbPrimaryKeyList = await dbInstance.getPrimaryKeyList("ia-list-genre-").then(l => l.toSorted());
const sjisDecode = new TextDecoder("sjis");
const spaceList: {
  sourceIaPkey: string,
  baseUrl: string,
  title: string,
  description: string,
}[] = [];
for (const dbPrimaryKey of dbPrimaryKeyList) {
  const cache = await dbInstance.getPrimaryKey(dbPrimaryKey);
  const htmlString = sjisDecode.decode(cache.response_binary);
  try {
    const siteList = await parseHtml(htmlString);
    siteList.forEach(site => {
      spaceList.push({
        sourceIaPkey: dbPrimaryKey,
        baseUrl: site.url,
        title: site.title,
        description: site.description,
      });
    })
    console.log(`${dbPrimaryKey} - ${siteList.length} 件`)
  } catch (error) {
    // https://web.archive.org/web/20001205040800im_/http://www1.plala.or.jp:80/town/PH_menu_index.A.htm
    console.warn(`${dbPrimaryKey}`);
  }
}
await dbInstance.replacePlalaTownSpaceList(spaceList);
console.log(`完了. ${spaceList.length} 件 `);
debugger;

async function parseHtml(htmlString: string) {
  const dom = new JSDOM(htmlString);
  await new Promise(resolve => { setTimeout(() => { resolve(null) }, 1) }); // これが大事
  const result: {
    url: string,
    title: string,
    description: string,
  }[] = []
  {
    const tableDom = [...(dom.window.document.querySelector(`body`)?.children ?? [])].filter(e => e.nodeName == "DT" || e.nodeName == "DD");
    if (tableDom.length % 2 != 0) {
      throw new Error(tableDom.length.toString())
    }
    while (0 < tableDom.length) {
      const dt = tableDom.shift()!;
      const dd = tableDom.shift()!;
      const url = (() => {
        const aTagList = [...dt.querySelectorAll("a")];
        if (aTagList.length != 1) {
          throw new Error();
        }
        const res = aTagList[0].href;
        if (!new URL(res).host.endsWith(".plala.or.jp")) {
          throw new Error()
        }
        return res;
      })();
      const title = (() => {
        const iTagList = [...dt.querySelectorAll("i")];
        if (iTagList.length != 1) {
          throw new Error();
        }
        return iTagList[0].textContent!.trim();
      })();
      const description = (() => {
        return dd.textContent!.trim();
      })();
      result.push({ url, title, description });
    }
    if (0 < result.length) {
      return result;
    }
  }
  {
    const tableDom = [...(dom.window.document.querySelector(`table[cellpadding="15"]>tbody>tr>td>dl`)?.children ?? [])].filter(e => e.nodeName == "DT" || e.nodeName == "DD");
    if (tableDom.length % 2 != 0) {
      throw new Error(tableDom.length.toString())
    }
    while (0 < tableDom.length) {
      const dt = tableDom.shift()!;
      const dd = tableDom.shift()!;
      const url = (() => {
        const aTagList = [...dt.querySelectorAll("a")];
        if (aTagList.length != 1) {
          throw new Error();
        }
        const res = aTagList[0].href;
        if (!new URL(res).host.endsWith(".plala.or.jp")) {
          throw new Error()
        }
        return res;
      })();
      const title = (() => {
        const iTagList = [...dt.querySelectorAll("i")];
        if (iTagList.length != 1) {
          throw new Error();
        }
        return iTagList[0].textContent!.trim();
      })();
      const description = (() => {
        return dd.textContent!.trim();
      })();
      result.push({ url, title, description });
    }
    if (0 < result.length) {
      return result;
    }
  }
  //debugger;
  throw new Error();
}
