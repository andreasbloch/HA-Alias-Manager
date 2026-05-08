# HA Alias Manager — Bulk manage entity aliases and Assist exposure

## The problem

If you use Home Assistant's voice assistant (Assist) with a large number of entities, you know the pain: to add an alias or toggle Assist exposure, you have to navigate to each entity individually, click the settings icon, and make your changes one by one. With 200, 500, or 1800+ entities, this is extremely time-consuming.

I built a custom Lovelace card that solves this with a spreadsheet-like interface.

---

## What it does

**HA Alias Manager** gives you a full table view of all your entities where you can:

- Edit aliases directly in the table (comma-separated)
- Toggle Assist exposure with a single click
- Filter by domain, area, Assist status, or free-text search
- Save all changes at once with the bulk save button
- Reload the entity list without refreshing the page

![Screenshot showing the HA Alias Manager with a table of entities, alias input fields, and Assist toggles]

---

## How it works

The card uses the Home Assistant WebSocket API directly via `this._hass.callWS()`:

- Entity list: `config/entity_registry/list` for basic data
- Aliases: `config/entity_registry/get` per entity (lazy-loaded, 50 per page)
- Save aliases: `config/entity_registry/update`
- Toggle Assist: `homeassistant/expose_entity` with `assistants: ['conversation']`

Aliases are lazy-loaded per page (50 at a time) to avoid flooding the WebSocket with thousands of requests at startup. The card caches already-loaded pages so navigating back is instant.

---

## Installation

1. Download `ha-alias-manager.js` from GitHub
2. Copy to `config/www/ha-alias-manager.js`
3. Add resource in Settings → Dashboards → Resources:
   ```
   URL: /local/ha-alias-manager.js
   Type: JavaScript Module
   ```
4. Hard-refresh browser (Ctrl+Shift+R)
5. Add card to dashboard:
   ```yaml
   type: custom:ha-alias-manager
   ```

**Tip:** Create a dedicated dashboard in Panel Mode for the best experience — the card fills the full screen and works great as a management tool.

---

## GitHub

[https://github.com/andreasbloch/ha-alias-manager](https://github.com/andreasbloch/ha-alias-manager)

---

## Background / motivation

I'm building a smart home voice assistant setup using Home Assistant with a custom AI pipeline:

- Wake word detection (Hey Jarvis, local on ESP32)
- Voxtral STT (Mistral Cloud API)
- Mistral ministral-8b as conversation agent (with J.A.R.V.I.S. personality)
- ElevenLabs TTS (Benjamin voice, German)
- HA MCP Server for device control

With 1800+ entities in my setup, managing aliases through the default UI was simply not feasible. I needed to carefully curate which entities are exposed to the AI and add meaningful aliases so the voice assistant can understand natural language commands in German.

The HA Alias Manager saved me hours of clicking.

---

## Known limitations

- HACS support not yet available (planned)
- No bulk Assist toggle for multiple selected entities (planned)
- Pagination is fixed at 50 per page (configurable option planned)

---

## Feedback welcome

This is my first published Lovelace card. Any feedback, bug reports, or pull requests are very welcome!

Tested on Home Assistant 2025.x and 2026.x.
