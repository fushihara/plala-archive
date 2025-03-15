import type { Metadata } from "next";
import "./globals.css";
import Link2 from "./_pagenation/link2";

export const metadata: Metadata = {
  title: "ぷららHPスペース アーカイブ",
};
export default function RootLayout({ children, }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="ja">
      <body className={``} >
        <div className="container mx-auto font-mono flex gap-2 p-2">
          <Link2 className="reset" href="/">Top</Link2>
          <Link2 className="reset" href="/list/has-contents-page-1">HPスペース一覧</Link2>
          <Link2 className="reset" href="/list/include-error-page-1">エラーページ含む</Link2>
        </div>
        {children}
        <div>
          全てのデータは<a href="https://www.plala.or.jp/" target="_blank" className="reset">ぷららHPスペース</a>より。
          Github:<a href="https://github.com/fushihara/plala-archive" target="_blank" className="reset">レポジトリ</a>
        </div>
      </body>
    </html>
  );
}