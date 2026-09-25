# Handoff — Portfolio site

Context for picking this project up in a fresh session. Last updated after
PR #6 merged (`main` at `bb4b720`).

## What this is

A personal portfolio site for Youssef Ahmed. Next.js 16 App Router, Tailwind v4,
built as a **static export** (`output: "export"`, `trailingSlash: true`). The app
lives in `site/`, **not** at the repo root — every npm command runs from `site/`.

```bash
cd site
npm install
npm run dev        # http://localhost:3000
npm run build      # static site written to site/out/
npm run lint
```

## The one thing to understand first

`site/data/tree.json` is the **single source of truth** for all content. It is a
tree: a root node (name, bio, photo, contact links) whose children are the
top-level categories — Experience, Projects, Education, Hobbies. Each category's
children are entries; an entry's children are its bullet points.

Everything on the page is rendered from that file:

- `app/lib/tree.ts` — types (`TreeNode`, `ContactLink`, `HobbyImage`) and helpers
  (`isPlain`, `linkText`, `initials`). Also exports `categories`.
- `app/components/Profile.tsx` — the whole front page: header, tab bar, panels.
  Tabs are deep-linkable via the URL fragment (`/#projects`, `/#hobbies`, `/#tree`).
- `app/components/Hobbies.tsx` — icon row + photo slideshow (Hobbies tab only).
- `app/components/HobbyIcon.tsx` — hand-drawn inline SVG line icons.
- `app/components/Tree.tsx` — the d3 BFS/DFS tree visualisation ("The tree" tab).
- `app/components/Avatar.tsx` — profile photo, falls back to initials if missing.

**To add content, edit `data/tree.json`. You rarely need to touch a component.**

## Current state

All four hobbies (Fishing, Cooking, Skiing, Hiking) have 5 photos each. The CV
button serves the real PDF. Education lists CS courses. Everything is on `main`.

### How to add things

**A hobby photo** — resize to 1400px on the long edge, drop in
`site/public/hobbies/`, then add an entry to that hobby's `images` array in
`tree.json`. The resize recipe used so far (Pillow):

```python
from PIL import Image, ImageOps
im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
im.thumbnail((1400, 1400), Image.LANCZOS)
im.save(dst, "JPEG", quality=82, optimize=True, progressive=True)
```

Naming convention is `<hobby>-<n>.jpg`. Each image entry is
`{ "src": "/hobbies/…", "alt": "…" }`. Portrait and landscape both work — the
slideshow fits the photo whole and fills the rest of the frame with a blurred
copy of itself, so nothing gets cropped.

**A new hobby** — add the node with an `icon` name, and add a matching SVG path
set to the `paths` map in `HobbyIcon.tsx`. Unknown icon names fall back to a circle.

**A course, bullet, or job detail** — add a child node with `"type": "detail"`
to the relevant entry. It renders as an indented bullet automatically.

**A new tab** — add a top-level category node. Tabs follow file order.

**A contact link** — add to the root node's `contacts`. The header shows the
`label` (short, e.g. "GitHub"), not the URL, and the row is set not to wrap —
keep labels short or it will overflow on narrow screens.

**The CV** — replace `site/public/cv.pdf`. The header button points at it directly.
There is no generated CV page any more; it was deleted in favour of the real file.

## Open items

1. **Deployment is not set up.** No CI, no GitHub Actions, no Vercel/Netlify
   config anywhere in the repo. The site only runs when built locally. This was
   the last thing under discussion. Two paths:
   - **Vercel** (recommended, no code changes): import the repo, **set Root
     Directory to `site`**, deploy. Auto-deploys on push to `main`.
   - **GitHub Pages**: needs a build-and-publish workflow *and* `basePath:
     "/Portfolio"` + `assetPrefix` in `next.config.ts`, because a project page
     serves from `/Portfolio/` while every asset path in the app is absolute
     (`/profile.jpg`, `/hobbies/*.jpg`, `/cv.pdf`) and would 404 otherwise.
     Renaming the repo to `Youssef0192.github.io` avoids the basePath change.

2. **Two pre-existing lint errors in `Tree.tsx`** (plus one warning) — all
   `react-hooks/set-state-in-effect` at lines 74 and 170, and a
   `no-unused-expressions` warning at 216. They predate recent work and do not
   fail `npm run build`. If you add code, leave the count at 3 problems; if it
   grows, the new one is yours.

## Gotchas

- **`site/AGENTS.md` is auto-generated** by `next dev` and warns that this Next
  version differs from training data. It gets re-added to the working tree if
  removed — commit it with your work rather than fighting it.
- **No image optimisation.** Static export has no image loader, so photos are
  plain `<img>` with an eslint-disable comment. Don't switch to `next/image`
  without adding `images: { unoptimized: true }`.
- **Asset paths are absolute from the domain root.** See the GitHub Pages note above.
- **Verify visually, not just by building.** Chromium is at
  `/opt/pw-browsers/chromium`; serve `site/out/` with
  `python3 -m http.server <port> --directory out` and drive it with Playwright.
  Several layout bugs this project hit (the blurred backdrop bleeding into the
  slideshow footer, the header links wrapping, an unreadable ski icon) were only
  visible in a screenshot — the build was green for all of them.
- **Check mobile.** 320px and 375px both matter; the header link row and the
  slideshow frame are tuned for them.

## Conventions

- Branch: work on `claude/<name>`, PR into `main`. If the branch's PR is already
  merged, restart from `main` rather than stacking on merged history.
- Commit messages: imperative subject, body explaining *why*. Existing history is
  the reference.
- `data/tree.json` is hand-formatted — compact one-line objects for short nodes.
  Don't reformat it wholesale with `json.dumps`; it produces a huge noisy diff.
