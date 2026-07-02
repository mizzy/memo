# フォルダ機能 + Vaultスイッチャー 設計

日付: 2026-07-02
モック: `design/folders-compare.html` (デスクトップ), `design/folders-mobile.html` (モバイル)

## Goal

- Vault内に任意深さのフォルダ階層を導入し、メモをフォルダに分類できるようにする
- Vault一覧のサイドバー常駐をやめ、Obsidianと同様に「常に1つのVaultを開き、スイッチャーで切り替える」UIにする

## 決定事項と経緯

| 論点 | 決定 | 理由 |
|---|---|---|
| フォルダの深さ | 任意 (`parent_id`による木構造) | Obsidianでの使い方に合わせる |
| ペイン構成 | 3ペイン維持 (ツリー/メモ一覧/エディタ) | 一覧のプレビュー・日付表示を残す。エクスプローラ型 (ツリーにメモも表示) は不採用 |
| Vaultの扱い | 概念として維持、UIはスイッチャーで1つだけ開く | フォルダと役割が被るため一覧表示は廃止。作業空間の分離としてのVaultは残す |
| ツリーの表示対象 | フォルダのみ (メモは中ペイン) | 同上 |

## データモデル

```
folders
  id         text PK
  vault_id   text NOT NULL REFERENCES vaults(id)
  parent_id  text NULL REFERENCES folders(id)  -- NULLならVault直下
  name       text NOT NULL
  created_at text NOT NULL
  updated_at text NOT NULL

memos (変更)
  + folder_id text NULL REFERENCES folders(id)  -- NULLなら未分類 (Vault直下)
  vault_id は維持 (未分類メモの帰属先、Vault内検索のスコープ)
```

マイグレーション: `folders`テーブル作成 + `memos`に`folder_id`列追加 (既存メモはNULL=未分類のままでよい)。

### 不変条件

- `memos.folder_id`が指すフォルダの`vault_id`は`memos.vault_id`と一致する
- フォルダの`parent_id`は同一Vault内、かつ自身の子孫であってはならない (サイクル禁止)
- 上記はAPI層で検証する (D1にトリガーは持ち込まない)

## API

- `GET /api/folders?vaultId=` — Vault内の全フォルダをフラット配列で返す (`id, vaultId, parentId, name, memoCount`)。ツリー構築とサブツリー集計はクライアント側で行う
- `POST /api/folders` — `{vaultId, parentId?, name}`
- `PUT /api/folders/:id` — `{name?, parentId?}` 移動時はサイクル・Vault一致を検証
- `DELETE /api/folders/:id` — 空フォルダ (子フォルダ・メモなし) のみ削除可。空でなければ409
- `GET /api/memos?vaultId=&folderId=` — `folderId`指定時はそのフォルダ直下のメモのみ。`folderId=root`でVault直下 (未分類)。`q`検索は従来通りVault全体
- `POST /api/memos` — `folderId?`を追加
- `PUT /api/memos/:id` — `folderId?`を追加 (メモのフォルダ移動)

## UI

### デスクトップ (3ペイン)

- 左レール上部: Vaultスイッチャーカード (現Vault名 + ⇄)。クリックでVault一覧メニュー (件数付き、＋新しいVault)
- レール本体: 現Vaultのフォルダツリー。▾/▸で開閉、フォルダ名クリックで選択。件数表示はサブツリー合計。「(未分類 n)」を最下部に表示
- ツリー操作: フォルダ追加 (ホバーで＋、または右クリックメニューは将来)、リネーム (ダブルクリック)、削除 (空のみ)
- 中ペイン: 選択フォルダ直下のメモ一覧 + パンくず (Vault名は含めない)。検索はVault全体
- エディタ: メタ行にフォルダパス表示。パスクリックでフォルダ移動ピッカー
- 展開状態・最後に開いたVault/フォルダはlocalStorageに保存

### モバイル

- ホーム = 現Vaultのフォルダツリー (ヘッダ右にVaultスイッチャー)
- フォルダタップ → メモ一覧 (‹戻る、FABは現フォルダに新規)
- メモタップ → エディタ (‹フォルダ名で戻る)

## エッジケース

- フォルダ移動でのサイクル: APIが422を返す。UI側もピッカーで自身と子孫を選択不可にする
- Vault切り替え時: 選択フォルダ・メモをリセットし、そのVaultの前回状態をlocalStorageから復元
- フォルダ削除: 空のみ許可なので孤児は発生しない
- 未分類: フォルダではない仮想的な選択状態としてUIで表現 (`folderId=root`)
- 深い階層のインデント: 上限なし。レール幅を超える場合は横スクロールではなくテキスト省略

## スコープ外 (将来)

- ドラッグ&ドロップでの移動
- フォルダの一括削除 (中身ごと)
- メモ一覧のサブツリー表示 (直下のみが対象)
