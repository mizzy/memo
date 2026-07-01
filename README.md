# Memo

Obsidian の代替として開発する個人用メモツール Web アプリケーション。

Obsidian の Mac/iPhone 間の同期不安定と、iOS アプリの起動の遅さが主な移行動機。PWA として動作するため、iPhone からホーム画面に追加してネイティブアプリに近い体験で利用できる。

## Tech Stack

| Layer | Tech |
|---|---|
| API | Hono + TypeScript |
| Frontend | React + Vite + TypeScript |
| Editor | Tiptap (ProseMirror ベース) |
| UI | Tailwind CSS + shadcn/ui |
| DB | Cloudflare D1 + Drizzle ORM |
| Storage | Cloudflare R2 (画像添付用) |
| Hosting | Cloudflare Pages (frontend) + Workers (API) |
| Auth | Cloudflare Access (Google OAuth) |
| Monorepo | Turborepo |
| Infra | Terraform (Cloudflare provider) |

## Project Structure

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

## Features

- メモの作成・編集・一覧・検索
- Vault 機能 (メモのグループ管理)
- PWA 対応
