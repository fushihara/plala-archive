import { dbInstance } from "../../../db";
import { ClientTable } from "./_clientTable";
import { PageBuilder } from "./_pageBuilder";
let count = 0;
await dbInstance.init();
export default async function Page({ params, searchParams }: {
  params: Promise<{ listId: string }> // url の /hoge/[kage]/ のkageの部分。
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> // url の page?hoge=kage のhogekageの部分
}) {
  const pageId = (await params).listId;
  const ins = new PageBuilder(dbInstance);
  const listItem = await ins.getPlalaHpList({ pageId: pageId });
  return <div className="container mx-auto font-mono">
    <ClientTable data={listItem}></ClientTable>
  </div>;
}
export async function generateStaticParams() {
  await dbInstance.init();
  const ins = new PageBuilder(dbInstance);
  const result = await ins.getPageStaticData().then(r => r.map(i => {
    return { listId: i };
  }));
  return result;
}
