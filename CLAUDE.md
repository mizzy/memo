# Memo App

Obsidian の代替として開発する個人用メモツール Web アプリケーション。
Obsidian の Mac/iPhone 間の同期不安定と、iOS アプリの起動の遅さが主な移行動機。

## Tech Stack

| Layer | Tech |
|---|---|
| API | Hono + TypeScript |
| Frontend | React + Vite + TypeScript |
| Editor | Tiptap (ProseMirror ベース) |
| UI | Tailwind CSS + shadcn/ui |
| DB | Cloudflare D1 + Drizzle ORM |
| Storage | Cloudflare R2 (将来の画像添付用) |
| Hosting | Cloudflare Pages (frontend) + Workers (API) |
| Auth | Cloudflare Access (Google OAuth, 個人 Gmail に制限) |
| Monorepo | Turborepo |
| Infra | Terraform (Cloudflare provider), state は R2 に保存 |

## Project Structure (予定)

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
- Vault 機能 (メモのグループ管理、Obsidian の Vault に相当)
- PWA 対応 (iPhone からホーム画面に追加して利用)

## Design Decisions

- SPA 構成 (SSR 不要、個人ツールなので SEO 不要)
- Hono RPC で API とフロントエンド間の型安全な通信
- Cloudflare Access でアプリ前段の認証 (アプリ内認証コード不要)
- Terraform state は Cloudflare R2 に保存 (S3 互換バックエンド)
- R2 の state 用バケットは wrangler CLI で手動作成 (bootstrap)
