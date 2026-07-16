# HA Alias Manager

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![GitHub release](https://img.shields.io/github/release/andreasbloch/ha-alias-manager.svg)](https://github.com/andreasbloch/ha-alias-manager/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-%23FFDD00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/andreasbloch)

A custom Lovelace card for bulk management of entity aliases and Assist exposure in Home Assistant.

![HA Alias Manager](screenshot.png?raw=true)


## Features

- 📋 **Bulk alias editing** — edit aliases for all entities in a single table view (comma-separated)
- 🎤 **Assist toggle** — enable or disable entities for voice assistants with a single click
- 🔍 **Filtering** — filter by domain, area, Assist status, or free-text search
- 📄 **Pagination** — 50 entities per page with lazy alias loading for performance
- 💾 **Bulk save** — save all changes at once
- 🔄 **Reload** — refresh entity list without reloading the page
- 🌍 **Localization** — 10 languages, auto-detected from your Home Assistant profile

## Why this card?

Home Assistant's default UI requires you to click into each entity individually to add aliases or toggle Assist exposure. With hundreds of entities, this is extremely tedious. This card provides a spreadsheet-like interface to manage everything in one place.

## Installation

### Option A: HACS (Recommended)

**Note:** Currently in the official HACS inclusion process. Until then, please use the **Custom Repository** method below.

1. Open **HACS** in your Home Assistant instance.
2. Click the three-dot menu in the top right corner and select **Custom repositories**.
3. Add `https://github.com/andreasbloch/HA-Alias-Manager` and select **Lovelace** as the category.
4. Search for "HA Alias Manager" and install it.
5. Reload your browser.

HACS installs the card together with the `translations/` folder from the release zip — no extra steps needed.

### Option B: Manual Installation

1. Download `ha-alias-manager.zip` from the [latest release](https://github.com/andreasbloch/ha-alias-manager/releases)
2. Extract it into your Home Assistant `config/www/` directory so that the structure looks like this:
   ```
   config/www/
   ├── ha-alias-manager.js
   └── translations/
       ├── de.json
       ├── en.json
       └── ...
   ```
   The `translations/` folder must sit **next to** `ha-alias-manager.js` — translation files are loaded relative to the card's script URL. If the folder is missing, the card still works and falls back to English.
3. Add the resource in **Settings → Dashboards → Resources**:
   ```
   URL: /local/ha-alias-manager.js
   Type: JavaScript Module
   ```
   The resource **must** be registered as *JavaScript Module* — the card relies on ES module features.
4. Hard-refresh your browser (Ctrl+Shift+R)

## Usage

Add the card to any Lovelace dashboard:

```yaml
type: custom:ha-alias-manager
```

### Card options

| Option | Type | Default | Description |
|---|---|---|---|
| `language` | string | auto | Overrides the automatically detected UI language, e.g. `language: en` |

The card language is resolved in this order:

1. `language` option in the card config
2. Language of your Home Assistant user profile
3. Browser language
4. English (fallback)

Regional codes are normalized to their base language (e.g. `de-DE` → `de`, `pt-BR` → `pt`).

### Supported languages

| Code | Language |
|---|---|
| `en` | English |
| `de` | Deutsch |
| `fr` | Français |
| `es` | Español |
| `it` | Italiano |
| `nl` | Nederlands |
| `pl` | Polski |
| `pt` | Português |
| `cs` | Čeština |
| `sv` | Svenska |

Missing your language? Translation PRs are very welcome — see [Contributing](#contributing).

### Recommended setup

For the best experience, create a dedicated dashboard in **Panel Mode**:

1. **Settings → Dashboards → Add Dashboard**
   - Name: `Alias Manager`
   - Icon: `mdi:microphone`
2. Open the new dashboard → **Edit** → three-dot menu → **Enable Panel Mode**
3. Add the card — it fills the full screen

## How aliases work

Aliases are alternative names for entities used by Home Assistant's voice assistants (Assist). When you add an alias, you can use that phrase in voice commands.

**Example aliases for a living room light:**
```
Living Room Light, Lights, Ceiling Light, Room Light
```

## Technical details

The card uses the Home Assistant WebSocket API via `this._hass.callWS()`:

| Operation | WebSocket command |
|---|---|
| Load entity list | `config/entity_registry/list` |
| Load aliases (per page) | `config/entity_registry/get` |
| Save aliases | `config/entity_registry/update` |
| Toggle Assist | `homeassistant/expose_entity` |

Aliases are lazy-loaded per page (50 at a time) and cached to avoid excessive WebSocket calls.

**Localization:** UI strings live in `translations/<lang>.json` and are fetched once per language relative to the card's module URL (`import.meta.url`), then cached across card instances. An English dictionary is embedded in the card itself as a fallback, so a missing or unreachable translation file never breaks the card — it just falls back to English (with a warning in the browser console).

## Compatibility

- Home Assistant 2025.1.0+
- Any modern browser

## Contributing

Pull requests and issues are welcome! Please open an issue before submitting a PR for major changes.

### Adding a translation

1. Copy `translations/en.json` to `translations/<your-language-code>.json` and translate all values (keep the keys and `{placeholders}` unchanged).
2. Add the language code to the `SUPPORTED_LANGUAGES` array at the top of `ha-alias-manager.js`.
3. Add the language to the table in this README.
4. Open a PR.

## License

MIT License — see [LICENSE](LICENSE) for details.
