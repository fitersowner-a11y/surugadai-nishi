# 駿河台西町会サイト ― Claude Code 引き継ぎ資料

このドキュメントは、claude.ai（Web版）で進めてきた「駿河台西町会サイト」の
構築・デプロイ作業を Claude Code に引き継ぐためのものです。
このファイルをプロジェクトフォルダに置き、Claude Code に読ませてください。

---

## 1. プロジェクト概要

千代田区・駿河台西町会の公式サイト。3ヶ月ごとに発行する
「町会からのお知らせ」を掲載する。

- **デザイン**：白地 × 紺（#1a2347）+ 金（#a8894e）の和モダン
- **シンボル**：町会の家紋「太田桔梗紋」を全面採用
- **ホスティング**：Cloudflare Pages（GitHub連携・自動デプロイ）
- **データ管理方式**：B-2方式（notices.json を直接編集 → GitHub反映）
- **ビルド不要の静的サイト**（フレームワークなし）

---

## 2. ファイル構成

```
（リポジトリのルート）
├── index.html       … サイト本体（HTML+CSS一体）。基本触らない
├── app.js           … 動作スクリプト。お知らせ描画・管理画面・JSON書き出し
├── notices.json     … お知らせデータ。更新時はこれを編集
├── assets/
│   └── kamon.png    … 家紋画像（紺色版）
├── pdf/             … お知らせPDFの置き場所
│   ├── oshirase-2026-05.pdf  （VOL.38）
│   ├── oshirase-2026-02.pdf  （VOL.37）
│   ├── oshirase-2025-11.pdf  （VOL.36）
│   └── oshirase-2025-08.pdf  （VOL.35）
└── README.md        … 運用手順書（町会向け）
```

※ claude.ai 版での成果物一式は ZIP で受領済み。
　Claude Code で作業する場合は、その中身をプロジェクトフォルダに展開して使う。

---

## 3. 技術仕様

### サイト構成（index.html 内）
- ヘッダー（家紋ロゴ + ナビ + 「⚙ 管理」リンク）
- ヒーロー（家紋 + 「駿河台西町会」のみ。キャッチコピーは無し ※ユーザー要望）
- 最新号ブロック（紺背景、notices.json から動的描画）
- 季節のお知らせ（カード3件、動的描画）
- 町会について（家紋の額装ビジュアル + 紹介文 + 統計）
- 年間行事カレンダー（春夏秋冬、現在の季節をハイライト）
- 過去のお知らせアーカイブ（全件、動的描画）
- 入会CTA（紺背景）
- お問い合わせ（連絡先カード3件）
- フッター

### お知らせデータ（notices.json）
形式は `{ "notices": [ {...}, {...} ] }`。各お知らせのフィールド：

| フィールド | 内容 | 例 |
|---|---|---|
| id | 一意のID（重複不可） | "n38" |
| vol | 号数（数値） | 38 |
| issued | 発行年月 | "2026年 4月吉日" |
| title | タイトル | "町会からのお知らせ 2026年 5月〜7月号" |
| period | 対象期間（表示用） | "2026年 5月 〜 7月 号" |
| range | 期間の小表示 | "2026.04 — 2026.07" |
| topics | 掲載項目（配列） | ["例大祭の開催", ...] |
| pdf | PDFパス（空なら準備中表示） | "pdf/xxx.pdf" |
| pages | ページ数表示 | "A4・2ページ" |
| tags | タグ（配列） | ["例大祭", "赤十字"] |
| latest | 最新号フラグ | true（1件のみtrue） |

### 管理画面（app.js 内）
- `#admin` でアクセス、またはヘッダー「⚙ 管理」リンク
- 簡易パスワード認証：現在 `surugadai`（app.js 内に平文）
- 機能：お知らせの追加・編集・削除（プレビュー）、notices.json 書き出し
- 管理画面での変更はプレビューのみ。確定にはJSON書き出し→GitHub反映が必要

---

## 4. 現在の状況と「詰まっているポイント」★最重要

GitHub + Cloudflare Pages へのデプロイ作業中で、**ビルドが失敗している**。

### GitHubリポジトリ
- リポジトリ：`fitersowner-a11y/surugadai-nishi`
- ブランチ：`main`

### 発生していた問題（経緯）
1. 最初、ファイルが `surugadai-site/` フォルダ階層の中に入っていた
   → index.html がルートに無く不正。**解決済み**（ファイルをルート直下に修正）
2. Cloudflare のビルドが「Cloning git repository」段階で失敗
   - エラー：`Failed: error occurred while fetching repository`
   - **原因の見立て：GitHubリポジトリにファイルが未コミット（空のまま）**
   - 直近のスクリーンショットでは、GitHubのアップロード画面が
     「Commit changes ボタンを押す直前」の状態だった

### 次にやるべきこと（claude.ai 版での最後の指示）
1. GitHub のアップロード画面で「**Commit changes**」ボタンを押し、
   ファイルを実際にリポジトリへ保存する
2. リポジトリのトップ画面に index.html 等が表示されることを確認
3. Cloudflare のビルド詳細画面で「**Retry build**」を押す
4. それでも失敗する場合は Cloudflare Pages プロジェクトを削除し、
   Connect to Git からやり直す

### ビルド設定（確認事項）
Cloudflare Pages のビルド設定が以下になっているか要確認：
- Framework preset：`None`
- Build command：空欄
- Build output directory：`/`

---

## 5. 既知の未解決課題（デプロイ成功後に対応）

### 課題A：PDFファイル名 → 【解決済み】
- PDFファイルはすべて英数字名に統一済み：
  - pdf/oshirase-2026-05.pdf （VOL.38 最新号）
  - pdf/oshirase-2026-02.pdf （VOL.37）
  - pdf/oshirase-2025-11.pdf （VOL.36）
  - pdf/oshirase-2025-08.pdf （VOL.35）
- notices.json の pdf フィールドも上記に一致済み
- VOL.34（2025年5-7月号）のみ PDF未受領のため "pdf":"" （準備中表示）
- 今後の新号も英数字名（oshirase-YYYY-MM.pdf）で統一すること

### 課題B：管理画面パスワードの露出
- Publicリポジトリのため、app.js 内の `surugadai` が誰でも閲覧可能
- ユーザーは「対策をどうするか」未決定のままデプロイ作業に移行した
- 選択肢：
  1. Cloudflare Access で `#admin` 相当を保護（最も確実・無料枠あり）
  2. プロトタイプ確認用と割り切り、本番運用前に対処
- 補足：管理画面でできるのはプレビュー改変とJSON書き出しのみ。
  本番データ（notices.json）の直接書き換えは不可なので実害は限定的

---

## 6. ユーザー（龍太郎さん）について

- GitHub / Cloudflare Pages / GitHub Actions の運用経験あり
  （ashitaka-magazine 等の既存プロジェクトで利用中）
- 開発環境：Windows + PowerShell + Claude Code
- デザインの好み：モダン・エディトリアル系。和の意匠は家紋採用のみで、
  装飾過多は好まない。キャッチコピー的なコピーライティングは不要との要望あり

---

## 7. Claude Code での再開手順（推奨）

1. このプロジェクトフォルダを Claude Code で開く
2. ローカルに git リポジトリを clone する：
   `git clone https://github.com/fitersowner-a11y/surugadai-nishi.git`
3. claude.ai 版で作った index.html / app.js / notices.json / assets/ / pdf/
   を配置（未コミットなら add → commit → push）
4. 「4. 現在の状況」の手順で Cloudflare のビルドを通す
5. デプロイ成功後、「5. 既知の未解決課題」A・B に対応

git コマンドで進められるため、ブラウザでのドラッグ＆ドロップより確実。
`git push` すれば Cloudflare Pages が自動で再ビルドする。
