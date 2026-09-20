This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Content

`data/tree.json` is the single source of truth for every view:

- `/` — profile header plus a tab per top-level section, with the BFS/DFS
  tree as the last tab. Tabs are deep-linkable: `/#projects`, `/#tree`, …
- `/cv` — the same data laid out as a CV sheet. "print / save pdf" prints it
  with the toolbar hidden and A4 margins applied. Empty sections are skipped.

Editing the data:

- **Add a tab** — add a top-level `category` node. Tabs follow the file order.
- **Add a link** — any node may carry `"link": "https://…"`. It renders in the
  tree's detail panel, on the cards and on the CV, and always opens in a new tab.
- **Profile picture** — `public/profile.jpg` (the path in the root node's
  `photo` field), square and around 512px. Replace the file to change it; if it
  is ever missing the avatar falls back to initials rather than breaking.
- **Intro** — the root node's `bio`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
