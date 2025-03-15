import { redirect } from "next/navigation";


export default async function Page() {
  //redirect("/list/has-contents-page-1");
  return (
    <div className="container mx-auto font-mono">
      2025/03/16 公開。まだ作業中 の予定<br />
      ぷららの個人向けスペースのHPのURLをかき集めて、各サイトにwgetをしてファイル一覧を作成<br />
      http://www\d+.plala.or.jp/ の形式しかキャッチアップ出来ませんでした<br />
      https://academic3.plala.or.jp/uragaku/ などのサイトもあったらしい<br />
    </div>
  );
}