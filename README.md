# James Phillips Portfolio (Local Rebuild)

This is a static rebuild of `https://minimal-323cd5.webflow.io/` so you have a local, editable version independent of Webflow.

## Run locally

You can open `index.html` directly, or run a tiny local server:

- Python: `python -m http.server 8080`
- Then open: `http://localhost:8080`

## File structure

- `index.html` - Homepage
- `styles.css` - Shared styling
- `projects/*.html` - Project pages

## Cheapest hosting options

### Option 1: Cloudflare Pages (recommended)

- Cost: free
- Great domain/DNS support
- Easy custom domain setup

Steps:
1. Put this project in a GitHub repo.
2. In Cloudflare Pages, create a new project from that repo.
3. Build command: leave blank
4. Output directory: `/` (root)
5. Deploy.
6. In Cloudflare DNS for `jamesp.co`:
   - Create CNAME `www` -> `<your-pages-subdomain>.pages.dev`
   - Add redirect from apex (`jamesp.co`) to `https://www.jamesp.co`

### Option 2: GitHub Pages

- Cost: free
- Good if you already use GitHub

Steps:
1. Push repo to GitHub.
2. Enable Pages in repo settings (deploy from branch).
3. Set custom domain to `www.jamesp.co`.
4. In your DNS provider:
   - CNAME `www` -> `<your-github-username>.github.io`
   - Apex forwarding to `https://www.jamesp.co`

## Notes

- This rebuild uses copy from publicly available pages.
- One project page on the source site currently returns `401`, so its details are represented with a placeholder page ready for content.
- Replace `download my resume` links with your real CV URL.
