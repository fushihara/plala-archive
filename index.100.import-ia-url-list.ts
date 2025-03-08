/**
 * ia_plala_base_url_list にデータ書き込み
 * IAから落としたplalaのURL一覧からbaseUrlの一覧をDBに登録する
 */
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline/promises"
import { dbInstance } from "./src/db";
const rs = createReadStream(".list-plala.json", { encoding: "utf-8" });
const rl = createInterface(rs);
const urlSet = new Set<string>();
for await (const line of rl) {
  if (!line.startsWith("[\"") || !line.endsWith("],")) {
    continue;
  }
  const line2 = line.substring(0, line.length - 1);
  const [
    urlKey,
    timestamp,
    original,
    mimetype,
    statuscode,
    digest,
    length
  ] = JSON.parse(line2);
  const originalUrlObj = new URL(original);
  /// urlは http://www15.plala.or.jp/yudeman10/ のような形式だけ
  originalUrlObj.pathname = originalUrlObj.pathname.replace(/^(\/[^\/]+\/).+/, "$1")
  originalUrlObj.search = "";
  originalUrlObj.protocol = "http:";
  originalUrlObj.hash = "";
  if (
    !originalUrlObj.host.match(/^www\d+\.plala\.or\.jp$/) ||
    originalUrlObj.pathname.startsWith("//") ||
    originalUrlObj.pathname.startsWith("/cgi-bin") || 
    originalUrlObj.pathname.startsWith("/.error_doc") || 
    !originalUrlObj.pathname.match(/^\/[^/]+\/$/)
  ) {
    //console.warn(`SKIP ${originalUrlObj}`);
    continue;
  }
  if (!urlSet.has(originalUrlObj.toString())) {
    urlSet.add(originalUrlObj.toString());
    console.log(`${(rs.bytesRead / 1000 / 1000).toFixed(1)} MB : ${originalUrlObj.toString()}`);
  }
}
rl.close();
await dbInstance.init();
await dbInstance.replaceIaPlalaBaseUrl(urlSet);
console.log(`全て完了`);
