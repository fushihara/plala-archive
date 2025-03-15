// node --max-old-space-size=16384 index.104.wget-file-list.ts
import { createInterface } from "node:readline/promises"
import { dbInstance } from "./src/db.ts";
import { spawn } from "node:child_process";
import { getLogger } from "./src/logger.ts";
/**
 * active_plala_hp_space_list に記録されているアクティブなサイトをそれぞれwget -r して
 * 各サイトの中にあるファイルのURL一覧を作り、 active_plala_hp_space_chile_file_list に記録する
 * 
 * wget は以下のようなURLをキャッチする。多分環境によって大きく違う
 * --2025-03-06 00:34:44--  http://www1.plala.or.jp/alatt/plalaboard/message/622.html 
 */
const logger = getLogger("index.104");
logger.info(`プログラム開始`);
await dbInstance.init();
const skipBaseUrl = ["http://www3.plala.or.jp/rps13_80/", "http://www13.plala.or.jp/km-lab/", "http://www2.plala.or.jp/doria-do/", "http://www2.plala.or.jp/maido-yoshioka/"];
const activePlalaHpSpaceBaseUrlList = await dbInstance.getActivePlalaHpSpaceListUrl();
for (const baseUrl of activePlalaHpSpaceBaseUrlList) {
  const msgPrefix = `${String(activePlalaHpSpaceBaseUrlList.indexOf(baseUrl) + 1).padStart(5)}/${activePlalaHpSpaceBaseUrlList.length} ${baseUrl.padEnd(50)} `
  const dataSaved = await dbInstance.isActivePlalaHpSpaceChildFileExistInf(baseUrl);
  if (dataSaved) {
    logger.info(`${msgPrefix} ALREDY SAVED`);
    continue;
  } else if (skipBaseUrl.includes(baseUrl)) {
    logger.info(`${msgPrefix} MANUAL SKIP`);
    continue;
  }
  const startTimeMs = Date.now();
  const res = await listChildUrlList(baseUrl);
  await dbInstance.replaceActivePlalaHpSpaceChildFileListInf(baseUrl, [...res.matchedChildUrl]);
  const durSec = ((Date.now() - startTimeMs) / 1000).toFixed(1).padStart(6);
  logger.info(`${msgPrefix} SAVED. ${res.matchedChildUrl.size.toString().padStart(4)} urls, ${durSec} s, ${res.isTimeout ? "🌟タイムアウトしました" : ""}`);
}
logger.info(`プログラム完了`);
async function listChildUrlList(baseUrl: string) {
  const matchedChildUrl = new Set<string>();
  let isTimeout = false;
  let nextShowTime = Date.now() + 10 * 60 * 1000;
  const matchPat = /^--\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}--\s*(?<url>http.+)/
  await new Promise((async (resolve) => {
    const args: string[] = [
      `--recursive`,
      `--page-requisites`,
      `-np`,
      `-nd`,
      `--spider`,
      `--level=inf`,
      baseUrl
    ];
    const timeoutMs = Date.now() + (3600 * 1000);
    const sp = spawn("wget", args);
    sp.once("exit", resolve);
    sp.once("error", resolve);
    for await (const line of createInterface(sp.stderr)) {
      if (timeoutMs < Date.now()) {
        isTimeout = true;
        break;
      } else if (nextShowTime < Date.now()) {
        const [u1, u2, u3, u4, u5] = [...matchedChildUrl].toReversed()
        logger.debug(`${baseUrl} の取得中. ${matchedChildUrl.size} 件取得済. ${u1} , ${u2} , ${u3} , ${u4} , ${u5}`);
        nextShowTime = Date.now() + 10 * 60 * 1000;
      }
      const m = line.match(matchPat);
      if (m) {
        const matchUrl = String(m.groups!["url"]);
        if (matchUrl.startsWith(baseUrl)) {
          matchedChildUrl.add(matchUrl);
        }
      }
    }
    try {
      sp.kill();
    } catch (error) { }
  }));
  return { isTimeout, matchedChildUrl };
}
