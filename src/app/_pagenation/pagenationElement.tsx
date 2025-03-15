import { JSX } from "react/jsx-runtime";
import Link2 from "./link2";

type PagenationProp = {
  now: number,
  max: number,
  between: number,

}
export function PagenationElement(prop: PagenationProp & { getUrl: (pageNum: number) => string, }) {
  const elementList: JSX.Element[] = [];
  const getUrl = (pageNum: number) => prop.getUrl(pageNum);
  for (const e of createPagenation(prop)) {
    if (e.type == "back") {
      if (e.link != null) {
        elementList.push(
          <div key={e.key}>
            <Link2 href={getUrl(e.link)} className="flex items-center justify-center px-4 h-10 ms-0 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
              <span className="sr-only">Previous</span>
              <svg className="w-3 h-3 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 1 1 5l4 4" />
              </svg>
            </Link2>
          </div>
        );
      } else {
        elementList.push(
          <div key={e.key}>
            <span className="flex items-center justify-center px-4 h-10 ms-0 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
              <span className="sr-only">Previous</span>
              <svg className="w-3 h-3 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 1 1 5l4 4" />
              </svg>
            </span>
          </div>
        );
      }
    } else if (e.type == "next") {
      if (e.link != null) {
        elementList.push(
          <div key={e.key}>
            <Link2 href={getUrl(e.link)} className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
              <span className="sr-only">Next</span>
              <svg className="w-3 h-3 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
              </svg>
            </Link2>
          </div>
        );
      } else {
        elementList.push(
          <div key={e.key}>
            <span className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
              <span className="sr-only">Next</span>
              <svg className="w-3 h-3 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
              </svg>
            </span>
          </div>
        );
      }
    } else if (e.type == "num") {
      if (e.link == null) {
        if (e.num == prop.now) {
          elementList.push(
            <div key={e.key}>
              <span
                className="z-10 flex items-center justify-center px-4 h-10 leading-tight text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
              >{e.num}</span>
            </div>
          );
        } else {
          elementList.push(
            <div key={e.key}>
              <span
                className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
              >{e.num}</span>
            </div>
          );
        }
      } else {
        elementList.push(
          <div key={e.key}>
            <Link2
              href={getUrl(e.link)}
              className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >{e.num}</Link2>
          </div>
        );
      }
    } else if (e.type == "sp") {
      elementList.push(<div key={e.key}>
        <span
          className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
        >...</span>
      </div>);
    }
  }
  return (
    <div className={`flex gap-1 justify-center`}>
      {elementList}
    </div>
  );
}
function createPagenation(prop: PagenationProp) {
  if (prop.between < 0) {
    throw new Error(`betweenは0以上にして下さい`);
  }
  if (prop.max < 0) {
    throw new Error(`maxは0以上にして下さい`);
  }
  if (prop.now < 0) {
    throw new Error(`nowは0以上にして下さい`);
  }
  if (prop.max < prop.now) {
    throw new Error(`nowの値はmaxと同じか、より小さな値にして下さい. now:${prop.now} , max:${prop.max}`);
  }
  if (prop.max == 0) {
    return [];
  }
  const MIN = 1;
  // 左・中・右の3ブロックの変数を作成
  const blockLeft = MIN;
  let blockMiddle = [
    ...Array.from({ length: prop.between }).map((_, index) => {
      const i = prop.now - prop.between + index;
      return i;
    }),
    prop.now,
    ...Array.from({ length: prop.between }).map((_, index) => {
      const i = prop.now + index + 1;
      return i;
    }),
  ];
  blockMiddle = blockMiddle.filter(i => {
    if (i <= blockLeft) {
      return false;
    }
    if (prop.max <= i) {
      return false;
    }
    return true;
  });
  const blockRight = prop.max;
  type A = { type: "back", key: string, link: number | null };
  type B = { type: "next", key: string, link: number | null };
  type C = { type: "sp", key: string, };
  type D = { type: "num", key: string, link: number | null, num: number }
  // 結合を作成
  const pageIdList: (A | B | C | D)[] = [];
  {
    // 左戻る矢印
    if (prop.now == MIN) {
      pageIdList.push({ type: "back", key: "back", link: null });
    } else {
      pageIdList.push({ type: "back", key: "back", link: prop.now - 1 });
    }
    // 最初のページ
    pageIdList.push({ type: "num", key: `p-${blockLeft}`, link: blockLeft, num: blockLeft });
    let lastPageId = blockLeft;
    // 左と中の間の…を入れるかどうか
    if (0 < blockMiddle.length && lastPageId + 1 != blockMiddle[0]) {
      pageIdList.push({ type: "sp", key: "sp-left" });
    }
    blockMiddle.forEach(m => {
      pageIdList.push({ type: "num", key: `p-${m}`, link: m, num: m });
      lastPageId = m;
    });
    if (0 < blockMiddle.length && lastPageId + 1 != blockRight) {
      // 最後のページ
      pageIdList.push({ type: "sp", key: "sp-right" });
    }
    if (lastPageId != blockRight) {
      pageIdList.push({ type: "num", key: `p-${blockRight}`, link: blockRight, num: blockRight });
      lastPageId = blockRight;
    }
    // 右矢印
    if (prop.now == prop.max) {
      pageIdList.push({ type: "next", key: "next", link: null });
    } else {
      pageIdList.push({ type: "next", key: "next", link: prop.now + 1 });
    }
    pageIdList.forEach(p => {
      if ("link" in p && p.link == prop.now) {
        p.link = null;
      }
    })
  }
  return pageIdList
}