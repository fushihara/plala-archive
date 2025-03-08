import { createInterface } from "node:readline/promises"
import { dbInstance } from "./src/db";
import { spawn } from "node:child_process";
import { getLogger } from "./src/logger";

/**
 * active_plala_hp_space_list に記録されているアクティブなサイトをそれぞれwget -r して
 * 各サイトの中にあるファイルのURL一覧を作り、 active_plala_hp_space_chile_file_list に記録する
 * 
 * wget は以下のようなURLをキャッチする。多分環境によって大きく違う
 * --2025-03-06 00:34:44--  http://www1.plala.or.jp/alatt/plalaboard/message/622.html 
 */
const logger = getLogger("index.104");
await dbInstance.init();
const skipBaseUrl = ["http://www3.plala.or.jp/rps13_80/"];
const activePlalaHpSpaceBaseUrlList = await dbInstance.getActivePlalaHpSpaceListUrl();
for (const baseUrl of activePlalaHpSpaceBaseUrlList) {
  const msgPrefix = `${String(activePlalaHpSpaceBaseUrlList.indexOf(baseUrl) + 1).padStart(5)}/${activePlalaHpSpaceBaseUrlList.length} ${baseUrl.padEnd(50)} `
  const dataSaved = await dbInstance.isActivePlalaHpSpaceChildFileExist(baseUrl);
  if (dataSaved) {
    logger.info(`${msgPrefix} ALREDY SAVED`);
    continue;
  }else if(skipBaseUrl.includes(baseUrl)){
    logger.info(`${msgPrefix} MANUAL SKIP`);
    continue;
  }
  const res = await listChildUrlList(baseUrl);
  await dbInstance.replaceActivePlalaHpSpaceChildFileList(baseUrl, [...res]);
  logger.info(`${msgPrefix} SAVED. ${res.size.toString().padStart(4)} urls`);
}
async function listChildUrlList(baseUrl: string) {
  const matchedChildUrl = new Set<string>();
  const matchPat = /^--\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}--\s*(?<url>http.+)/
  await new Promise((async (resolve) => {
    const args: string[] = [
      `-r`,
      `-np`,
      `-nd`,
      `--spider`,
      baseUrl
    ];
    const sp = spawn("wget", args);
    sp.once("exit", resolve);
    sp.once("error", resolve);
    for await (const line of createInterface(sp.stderr)) {
      const m = line.match(matchPat);
      if (m) {
        const matchUrl = String(m.groups!["url"]);
        if (matchUrl.startsWith(baseUrl)) {
          matchedChildUrl.add(matchUrl);
        }
      }
    }
  }));
  return matchedChildUrl;
}
