# HA Alias Manager

Bulk manage entity aliases and Assist (voice assistant) exposure in Home Assistant.

## Features

- 📋 Edit aliases for all entities in a single table view (comma-separated)
- 🎤 Toggle Assist exposure per entity with a single click
- 🔍 Filter by domain, area, Assist status, or search
- 📄 Pagination — 50 entities per page with lazy alias loading
- 💾 Bulk save all changes at once
- 🔄 Reload button to refresh entity list
- 🌍 Localized in 10 languages (en, de, fr, es, it, nl, pl, pt, cs, sv), auto-detected from your HA profile

## Usage

```yaml
type: custom:ha-alias-manager
```

Optional: override the detected language with `language: en`.

For best results, use **Panel Mode** on a dedicated dashboard.
