"use client"
import { useState, type ReactNode } from "react";
import { type PlalaHpListResult } from "./_pageBuilder";
import { JSX } from "react/jsx-runtime";
import { PagenationElement } from "../../_pagenation/pagenationElement";
import dateformat from "dateformat";
export function ClientTable(
  params: { data: PlalaHpListResult, children?: ReactNode, },
) {
  const tbody = params.data.hpDatas.map(getTableBody);
  return (
    <div className="font-mono">
      <div className="container mx-auto">
        <PagenationElement now={params.data.nowPageCount} max={params.data.totalPageCount} between={3} getUrl={n => `/list/${params.data.urlPrefix}-page-${n}`}></PagenationElement>
      </div>
      <table className="border-collapse bg-white text-sm font-light text-gray-900 ">
        <thead className="text-md sticky top-0 bg-gray-100 font-medium">
          <tr>
            <th scope="col" className="whitespace-nowrap border border-black px-1 text-right"></th>
            <th scope="col" className="whitespace-nowrap border border-black px-1 text-right">ID</th>
            <th scope="col" className="whitespace-nowrap border border-black px-1 text-left">URL</th>
            <th scope="col" className="whitespace-nowrap border border-black px-1 text-left">file(s)</th>
            <th scope="col" className="whitespace-nowrap border border-black px-1 text-left">サイト名</th>
          </tr>
        </thead>
        <tbody>
          {tbody}
        </tbody>
      </table>
      <div className="container mx-auto">
        <PagenationElement now={params.data.nowPageCount} max={params.data.totalPageCount} between={3} getUrl={n => `/list/${params.data.urlPrefix}-page-${n}`}></PagenationElement>
      </div>
    </div>
  );
}
function getTableBody(d: PlalaHpListResult["hpDatas"][number]) {
  const [isChildrenOpen, setIsChildrenOpen] = useState(false);
  let title = "タイトル無し";
  let titleIsGray = true;
  if (d.title.trim() != "") {
    title = d.title.trim();
    titleIsGray = false;
  }
  let trBackgroundColor = "";// warn と errorを表示
  let trTitle = "";
  switch (d.status) {
    case "warn":
      trBackgroundColor = "bg-yellow-100";
      trTitle = "ページがIndex ofやbasic認証、文字化けなどの判定になった。\nぷららのエラーページではない";
      break;
    case "error":
      trBackgroundColor = "bg-red-100";
      trTitle = "ぷららのエラーページを受信した";
      break;
  }
  let childrenButton: JSX.Element;
  if (d.archiveUrls.length == 0) {
    childrenButton = <button className="reset" disabled>▼</button>;
  } else if (isChildrenOpen) {
    childrenButton = <button className="reset" onClick={() => setIsChildrenOpen(false)}>△</button>;
  } else {
    childrenButton = <button className="reset" onClick={() => setIsChildrenOpen(true)}>▼</button>;
  }
  const result: JSX.Element[] = [];
  result.push(
    <tr className="transition duration-300 ease-in-out hover:bg-gray-100" key={d.id}>
      <td className="border border-black px-1 py-1 text-right">{childrenButton}</td>
      <td className={"border border-black px-1 py-1 text-right " + trBackgroundColor} title={trTitle}>{d.id}</td>
      <td className="border border-black px-1 py-1 text-left"><a href={d.baseUrl} target="_blank" className="reset">{d.baseUrl}</a></td>
      <td className="border border-black px-1 py-1 text-right">{d.archiveUrls.length}</td>
      <td className={"border border-black px-1 py-1 text-left " + (titleIsGray ? "text-gray-400" : "")}>{title}</td>
    </tr>
  );
  if (isChildrenOpen) {
    result.push(
      <tr
        className="transition duration-300 ease-in-out hover:bg-gray-100"
        key={`${d.id}-children`}
      >
        <td className={"border border-black px-1 py-1 text-left"} colSpan={5}
        >{ChildUrlList(d.archiveUrls)}</td>
      </tr>
    );
  }
  return result;
}
function ChildUrlList(archiveUrls: PlalaHpListResult["hpDatas"][number]["archiveUrls"]) {
  if (archiveUrls.length == 0) {
    return <div>子URLなし</div>
  }
  const tbody: JSX.Element[] = [];
  for (const a of archiveUrls) {
    let iaTimestampStr: JSX.Element | string = "";
    let iaTimestampClass = "";
    if (a.iaArchiveDateMs == null) {
      iaTimestampStr = "IAに保存なし";
      iaTimestampClass = "text-gray-400"
    } else {
      const iaUrl = `https://web.archive.org/web/${dateformat(new Date(), "yyyymmddHHMMss")}/${a.originalUrl}`;
      iaTimestampStr = <a href={iaUrl} className="reset">{dateformat(new Date(a.iaArchiveDateMs), "yyyy/mm/dd HH:MM:ss")}</a>;
    }
    tbody.push(
      <tr
        className="transition duration-300 ease-in-out hover:bg-gray-100"
        key={a.originalUrl}
      >
        <td className={"border border-black px-1 py-1 text-left"}
        ><a href={a.originalUrl} className="reset" target="_blank">{a.originalUrl}</a></td>
        <td className={"border border-black px-1 py-1 text-left " + iaTimestampClass}
        >{iaTimestampStr}</td>
      </tr>
    );
  }
  return (
    <table className="border-collapse bg-white text-sm font-light text-gray-900 ">
      <thead className="text-md sticky top-0 bg-gray-100 font-medium">
        <tr>
          <th scope="col" className="whitespace-nowrap border border-black px-1 text-right">IA保存日時</th>
          <th scope="col" className="whitespace-nowrap border border-black px-1 text-right">URL</th>
        </tr>
      </thead>
      <tbody>
        {tbody}
      </tbody>
    </table>
  );
}