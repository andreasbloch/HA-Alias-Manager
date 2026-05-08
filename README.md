# HA Alias Manager

A custom Lovelace card for bulk management of entity aliases and Assist exposure in Home Assistant.

![HA Alias Manager](screenshot.png)

## Features

- 📋 **Bulk alias editing** — edit aliases for all entities in a single table view
- 🎤 **Assist toggle** — enable or disable entities for voice assistants with a single click
- 🔍 **Filtering** — filter by domain, area, Assist status, or free-text search
- 📄 **Pagination** — 50 entities per page with lazy alias loading for performance
- 💾 **Bulk save** — save all changes at once
- 🔄 **Reload** — refresh entity list without reloading the page

## Why this card?

Home Assistant's default UI requires you to click into each entity individually to add aliases or toggle Assist exposure. With hundreds of entities, this becomes very tedious. This card provides a spreadsheet-like interface to manage everything in one place.

## Installation

### Manual

1. Download `ha-alias-manager.js`
2. Copy it to your Home Assistant `config/www/` directory:
   ```bash
   cp ha-alias-manager.js /config/www/ha-alias-manager.js
   ```
3. Add the resource to your Lovelace configuration:

   **Via UI:** Settings → Dashboards → Resources → Add Resource
   ```
   URL: /local/ha-alias-manager.js
   Type: JavaScript Module
   ```

   **Via YAML** (`configuration.yaml`):
   ```yaml
   lovelace:
     resources:
       - url: /local/ha-alias-manager.js
         type: module
   ```

4. Restart Home Assistant or hard-refresh your browser (Ctrl+Shift+R)

### HACS (coming soon)

HACS support is planned for a future release.

## Usage

Add the card to any Lovelace dashboard:

```yaml
type: custom:ha-alias-manager
```

For best results, use **Panel Mode** on a dedicated dashboard:

1. Create a new dashboard (Settings → Dashboards → Add Dashboard)
2. Enable Panel Mode (Edit Dashboard → Edit View → Panel Mode)
3. Add the card — it will fill the entire screen

## Card configuration

The card currently requires no configuration. Simply add it to your dashboard.

```yaml
type: custom:ha-alias-manager
```

## How aliases work

Aliases are alternative names for entities used by Home Assistant's voice assistants (Assist, Google Assistant, Alexa). When you add an alias like "living room light" to an entity, you can use that phrase in voice commands.

**Tip:** Add multiple aliases per entity for different ways you might refer to it:
```
Wohnzimmer Licht, Deckenlampe, Licht, Wohnzimmerlicht
```

## Technical details

The card uses the Home Assistant WebSocket API directly via `this._hass.callWS()`:

- **Load entities:** `config/entity_registry/list` (basic info) + `config/entity_registry/get` (aliases, lazy-loaded per page)
- **Save aliases:** `config/entity_registry/update`
- **Toggle Assist:** `homeassistant/expose_entity` with `assistants: ['conversation']`

Aliases are lazy-loaded per page (50 at a time) to avoid overloading the WebSocket API with 1000+ requests at startup.

## Compatibility

Tested with Home Assistant 2025.x and 2026.x.

Requires Home Assistant with:
- WebSocket API enabled (default)
- Lovelace UI

## Contributing

Pull requests and issues are welcome! Please open an issue before submitting a PR for major changes.

## License

MIT License — see [LICENSE](LICENSE) for details.
