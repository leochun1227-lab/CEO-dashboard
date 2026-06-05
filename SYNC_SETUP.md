# Cloud Sync Setup

This page can now save editor changes locally first, then sync the same JSON to a cloud API.

## Cloudflare Worker + KV

1. Create a Cloudflare KV namespace, for example `REGENT_PORTAL_KV`.
2. Copy `wrangler.example.toml` to `wrangler.toml`.
3. Replace the KV `id` in `wrangler.toml`.
4. Set the editor PIN as a Worker secret:

```powershell
wrangler secret put EDITOR_TOKEN
```

5. Deploy the Worker:

```powershell
wrangler deploy
```

6. Open the portal, turn on editor mode, open `Backup / Import`, then enter:

- `Cloud API URL`: your Worker URL, for example `https://regent-home-portal-api.yourname.workers.dev`
- `Editor PIN`: the same value you saved as `EDITOR_TOKEN`

7. Click `Save Cloud Settings`, then `Sync Now` to seed the cloud copy.

After that, any device can use the same `Cloud API URL` to load the shared portal data. Editors need the PIN to save changes.
