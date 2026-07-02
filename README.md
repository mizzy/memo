# Memo

Obsidianの代替として開発する個人用メモツールWebアプリケーション。

ObsidianのMac/iPhone間の同期不安定と、iOSアプリの起動の遅さが主な移行動機。PWAとして動作するため、iPhoneからホーム画面に追加してネイティブアプリに近い体験で利用できる。

## Tech Stack

| Layer | Tech |
|---|---|
| API | Hono + TypeScript |
| Frontend | React + Vite + TypeScript |
| Editor | Tiptap (ProseMirrorベース) |
| UI | Tailwind CSS + shadcn/ui |
| DB | Cloudflare D1 + Drizzle ORM |
| Storage | Cloudflare R2 (画像添付用) |
| Hosting | Cloudflare Workers (単一Workerで静的アセット+APIを配信) |
| Auth | Cloudflare Access (Google OAuth) |
| Monorepo | Turborepo |
| Infra | Terraform (Cloudflare provider) |

## Project Structure

```
memo/
├── apps/
│   ├── api/          # Hono (Cloudflare Workers、webのdistも配信)
│   └── web/          # React + Vite (SPA)
├── packages/
│   └── shared/       # 型定義の共有
├── infra/            # Terraform (Cloudflare Access, D1, R2 etc.)
├── package.json      # monorepo root
└── turbo.json
```

## Features

- メモの作成・編集・一覧・検索
- Vault機能 (メモのグループ管理)
- PWA対応
