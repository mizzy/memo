# Memo App

Obsidianの代替として開発する個人用メモツールWebアプリケーション。
ObsidianのMac/iPhone間の同期不安定と、iOSアプリの起動の遅さが主な移行動機。

## Tech Stack

| Layer | Tech |
|---|---|
| API | Hono + TypeScript |
| Frontend | React + Vite + TypeScript |
| Editor | Tiptap (ProseMirrorベース) |
| UI | Tailwind CSS + shadcn/ui |
| DB | Cloudflare D1 + Drizzle ORM |
| Storage | Cloudflare R2 (将来の画像添付用) |
| Hosting | Cloudflare Pages (frontend) + Workers (API) |
| Auth | Cloudflare Access (Google OAuth, 個人Gmailに制限) |
| Monorepo | Turborepo |
| Infra | Terraform (Cloudflare provider), stateはR2に保存 |

## Project Structure(予定)

```
memo/
├── apps/
│   ├── api/          # Hono (Cloudflare Workers)
│   └── web/          # React + Vite (Cloudflare Pages)
├── packages/
│   └── shared/       # 型定義の共有
├── infra/            # Terraform (Cloudflare Access, D1, R2 etc.)
├── package.json      # monorepo root
└── turbo.json
```

## Initial Scope

- メモの作成・編集・一覧・検索
- Vault機能 (メモのグループ管理、ObsidianのVaultに相当)
- PWA対応 (iPhoneからホーム画面に追加して利用)

## Design Decisions

- SPA構成 (SSR不要、個人ツールなのでSEO不要)
- Hono RPCでAPIとフロントエンド間の型安全な通信
- Cloudflare Accessでアプリ前段の認証 (アプリ内認証コード不要)
- Terraform stateはCloudflare R2に保存 (S3互換バックエンド)
- R2のstate用バケットはwrangler CLIで手動作成 (bootstrap)
