/**
 * IAの検索APIから落としたアーカイブ一覧をパースする
 * curl "https://web.archive.org/cdx/search/cdx?url=plala.or.jp&matchType=domain&output=json&filter=statuscode:200" -o .list-plala.json
 */
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline/promises"
import { dbInstance } from "./src/db.ts";
const rs = createReadStream(".list-plala.json", { encoding: "utf-8" });
const rl = createInterface(rs);
const urlMap = new Map<string, {
  url: string,
  archived_time_latest: Date,
  archived_time_oldest: Date,
  archived_url_count: number,
}>();
for await (const line of rl) {
  if (!line.startsWith("[\"") || !line.endsWith("],")) {
    continue;
  }
  const line2 = line.substring(0, line.length - 1);
  const [
    urlKey,
    timestampStr, // 20030207055228 の様な形式
    original,
    mimetype,
    statuscode,
    digest,
    length
  ] = JSON.parse(line2);
  const originalUrl = new URL(original).toString();
  const mapData = urlMap.get(originalUrl);
  const date = parseUTCDateFromYYYYMMDDHHmmss(timestampStr);
  if (mapData) {
    urlMap.set(originalUrl, {
      url: originalUrl,
      archived_time_latest: new Date(Math.max(mapData.archived_time_latest.getTime(), date.getTime())),
      archived_time_oldest: new Date(Math.min(mapData.archived_time_latest.getTime(), date.getTime())),
      archived_url_count: mapData.archived_url_count + 1,
    });
  } else {
    urlMap.set(originalUrl, {
      url: originalUrl,
      archived_time_latest: date,
      archived_time_oldest: date,
      archived_url_count: 1
    });
  }
  if (urlMap.size % 10000 == 0) {
    console.log(`${(rs.bytesRead / 1000 / 1000).toFixed(1)} MB : ${timestampStr} ${originalUrl.toString()}`);
  }
}
rl.close();
await dbInstance.init();
await dbInstance.upsertAllIaArchiveList([...urlMap.values()]);
console.log(`全て完了. ${urlMap.size} items`);

function parseUTCDateFromYYYYMMDDHHmmss(dateString: string): Date {
  if (!/^\d{14}$/.test(dateString)) {
    throw new Error("Invalid date format. Expected YYYYMMDDHHmmss.");
  }

  const year = parseInt(dateString.substring(0, 4), 10);
  const month = parseInt(dateString.substring(4, 6), 10) - 1; // 0-11 にするため -1
  const day = parseInt(dateString.substring(6, 8), 10);
  const hours = parseInt(dateString.substring(8, 10), 10);
  const minutes = parseInt(dateString.substring(10, 12), 10);
  const seconds = parseInt(dateString.substring(12, 14), 10);

  // UTC基準のDateオブジェクトを作成
  return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
}
