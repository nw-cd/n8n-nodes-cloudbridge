# n8n-nodes-cloudbridge

n8n community node for [CloudBridge](https://cloud-bridge.ru) — a SaaS that
transfers and syncs files between 19 cloud storages: Yandex Disk, Google
Drive, VK Cloud (Mail.ru), Dropbox, OneDrive, Telegram channels, MEGA,
pCloud, TeraBox, S3-compatible, WebDAV, FTP/FTPS, Google Photos, Kinescope.

Move files cloud-to-cloud without downloading — straight from your n8n
workflows.

## Installation

```bash
npm install n8n-nodes-cloudbridge
```

Or in n8n: **Settings → Community Nodes → Install** → `n8n-nodes-cloudbridge`.

## Credentials

Create a CloudBridge API key (`cb_live_…`) in your CloudBridge dashboard →
**API** (requires the API access add-on), then add it as a **CloudBridge
API** credential in n8n.

## Operations

| Resource | Operations |
|---|---|
| Cloud | Get Many — list connected storage accounts (id, provider, quota) |
| File | Get Many — list files/folders inside a cloud directory |
| Transfer | Create, Get, Get Many, Cancel — cloud-to-cloud file transfers |
| Remote Upload | Create, Get, Get Many, Cancel — fetch a URL straight into a cloud |
| Share Link | Create, Get Many, Revoke — public download / inbox / archive links |
| Sync | Create, Get, Get Many, Update, Delete, Run Now — scheduled one-way/two-way syncs |
| Usage | Get — current plan and monthly quota consumption |

## Example workflows

- **Nightly backup**: Cron → Sync → Run Now (or let the scheduler handle it)
- **Mirror a folder**: Webhook → Transfer → Create (paths = folder)
- **Inbound file pipeline**: HTTP trigger → Remote Upload → Create →
  Share Link → Create → notify Telegram
- **Quota watchdog**: Cron → Usage → Get → alert when `used_gb` > 80%

## Docs & links

- API key / dashboard: https://cloud-bridge.ru
- MCP server (same API surface for AI agents): https://cloud-bridge.ru/mcp
- Registry: `ru.cloud-bridge/cloudbridge`

## License

MIT
