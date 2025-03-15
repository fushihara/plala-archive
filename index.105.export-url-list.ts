import { writeFile } from "node:fs/promises";
import { dbInstance } from "./src/db";

dbInstance.init();
const allData = await dbInstance.getArchivePlalaHpSpaceChildFileList();
const allHtmlDataText = allData.map(d => d.child_url).filter(u => u.match(/\.html?$/)).join("\n");
const allDataText = allData.map(d => d.child_url).join("\n");
await writeFile("index.105.export-url-list-result-html-only.txt", allHtmlDataText);
await writeFile("index.105.export-url-list-result-all.txt", allDataText);
console.log(`完了`);
