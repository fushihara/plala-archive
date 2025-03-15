# DBのテーブル
## active_plala_hp_space_child_file_list,active_plala_hp_space_child_file_list_inf
child_url に http://example.com/a////////b.html の様な無効なURLが紛れているサイトがある。
この場合 http://example.com/a/b.html が正解で、それもDBに入っている。
wgetの結果なのでdbに入っちゃってるので、取り出す時にpathに // スラッシュが2個連続しているurlは除く事とする。
正しいURLも入っているので大差ないはず。
sqlでざっと数えた該当サイトは以下の通り。件数が多い順。
http://www12.plala.or.jp/HOUJI/ 601586件
http://www17.plala.or.jp/ichi-ban/ 454752件
http://www9.plala.or.jp/lab-kage/ 146046件
http://www17.plala.or.jp/ducko/ 2981件
http://www9.plala.or.jp/tugumarukoma51/ 409件
http://www12.plala.or.jp/fukuhoukan/ 151件
http://www1.plala.or.jp/achako/ 109件
http://www13.plala.or.jp/fuji-s-s/ 88件
以下略

支障が出るレベルの混入は実質的にtop3のサイト程度。

## active_plala_hp_space_list
各HPのベースURL、タイトル、最終更新日時(http headerより)の一覧。
ベースURLが主キーになっている。
`index.103.fetch-live-site.ts`にて書き込み。
`plala_town_space_list`と`ia_plala_base_url_list` から作成しているので、これが現時点で最も精度の高い一覧。
statusがerrorのものは完全に無視していい。
データ一覧は`index.103.fetch-live-site.ts`でソートして収納してある。

## http_request_result
## ia_plala_base_url_list
とにかくぷららHPスペースのベースURLの一覧。
`index.100.import-ia-url-list.ts`でinsertされている。
`list-plala.json` から作成している。

## plala_town_space_list
各サイトのURLごとに、タイトル・説明文を記録。
`index.102.list-town-index.ts`の処理の最後でテーブルの中身をすべて消して一気に入れ直している。
`index.101.fetch-official-index.ts`で取得した過去にあったぷららの公式のHP一覧ページより作成

# エントリーポイント
## index.100.import-ia-url-list.ts
`list-plala.json`からぷららのベースURLの一覧を作成し、`ia_plala_base_url_list`に書き込みする。

## index.101.fetch-official-index.ts
過去にあったぷらら公式のHPスペース一覧をスクレイピングし、 http_request_result にキャッシュを保存する。
一度実行完了したら、もう実行する必要は無い。

HPスペースのカテゴリごと、IDの頭文字ごとのスペース一覧ページのURLをそれぞれ作る。
それぞれのURLをIAのSearchApiを使って、IAにある全てのアーカイブのURLを取得し、そのURLにアクセスして http_request_result にキャッシュを保存するようにする。

## index.103.fetch-live-site.ts
HPスペース一覧のhtmlを作成し、`index.103.out.html`として保存する。github gist用のつもりで作った。
`plala_town_space_list`と`ia_plala_base_url_list`からベースURLの一覧を作成し、`active_plala_hp_space_list`に記録する

## index.104.wget-file-list.ts
`active_plala_hp_space_list` からwgetする

# 特別なサイト？
http://www6.plala.or.jp/private-hp/
侍魂のサイト。古きよりテキストサイト。何故かindexOf配下になってる

# 実行コマンド
環境はtypescriptがネイティブ対応したnode v23

- `node --env-file=.env  src\server.ts`
  - `http://localhost:56438/plala-archive` を開く
- `npx next build`
