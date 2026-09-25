# Helen's Arrangements

Static single-page executor checklist served at `/helen/`. It has no build step and no backend.

The page has a four-digit client-side privacy screen. This prevents casual access but is not equivalent to server-side authentication: static source files remain inspectable. Use Cloudflare Access or another host-level authentication layer if strong access control is required.

## Local development

From the repository root, run any static server, for example `python3 -m http.server 8000`, then open `http://localhost:8000/helen/`.

## Deployment

The Portfolio repository is already a static site. Commit and push the `helen/` directory to the branch used by the existing Cloudflare Pages project. The page will be available at `/helen/` on the configured domain. No Cloudflare Worker is required.

## Data and persistence

- `data.js` contains the schema-versioned default sections, facts and tasks.
- `app.js` expands that dataset into full task records and stores the state in `localStorage` under `helen-arrangements-v1`.
- Every edit saves immediately. Data is local to the browser/profile and does not sync across devices.
- Use **Backup & export → Export backup** regularly. **Import backup** validates the schema and offers a backup before replacement.
- **Reset local data** removes current application state and recreates it from `data.js`.

To change the default checklist, edit the structured sections in `data.js`. Existing browsers keep their saved copy until local data is reset.

## Future sync

The interface reads and writes one state object through `load()` and `save()` in `app.js`. Those functions are the seam for a future Cloudflare D1/KV/API adapter; the UI and task schema can remain unchanged.
