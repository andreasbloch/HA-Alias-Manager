# Changelog

## [1.3.0] - 2026-07-17

### Added

- **Export**: download all aliases and Assist exposure states as a JSON file — for backups
  before replacing devices or migrating to a new Home Assistant instance
- **Import**: load a previously exported JSON file. Differences against the current registry
  are staged as pending changes (nothing is written until *Save* is pressed); unknown
  entities are counted and skipped, and a summary report is shown
- **Load all aliases**: export/import fetch all aliases in parallel chunks of 25 with a
  progress indicator (seconds instead of minutes on large installations)
- **New filter "Exposed without alias"**: finds entities that are exposed to Assist but have
  no alias yet — the ones most likely to be misunderstood by voice assistants
- **Exposure counter**: the status line now shows how many entities are exposed to Assist —
  useful for keeping LLM-based assistants' context small
- 9 new translation keys in all 10 languages

### Changed

- The saved-confirmation now includes the entity/exposure summary

## [1.2.2] - 2026-07-17

### Fixed

- **Broken HACS installation since v1.1.1**: the `zip_release` distribution registered the
  zip archive as the Lovelace resource ("Custom element doesn't exist"). Distribution now
  uses the standard `dist/` layout — HACS downloads `dist/ha-alias-manager.js` and the
  `dist/translations/` folder directly from the repository tree and registers the correct
  `.js` resource automatically.
- Removed the release-zip workflow; releases must not carry assets (HACS prefers release
  assets over the repository tree for tagged installs).
- Manual install: copy the contents of `dist/` (js **and** `translations/`) into `config/www/`.

## [1.2.1] - 2026-07-17 [YANKED]

- Broken release (zip asset shadowed the repository tree). Use 1.2.2 instead.

## [1.2.0] - 2026-07-16

### Added

- **Bulk Assist toggle**: the row checkboxes are now functional
  - Selection is kept across page and filter changes, so entities from different filters can be combined
  - Header checkbox selects/deselects **all filtered** entities (across all pages), with indeterminate state on partial selection
  - Bulk action bar appears when at least one entity is selected: *Assist ON*, *Assist OFF*, *Clear selection*
  - Bulk actions are staged like single edits — nothing is written until *Save* is pressed, and entities already in the target state produce no change
- 6 new translation keys in all 10 languages (`selectedCount`, `bulkAssistOn`, `bulkAssistOff`, `clearSelection`, `selectAllTitle`, `selectRow`)

### Changed

- Entity IDs in row checkboxes are now HTML-escaped consistently
- Reload clears the current selection

## [1.1.1] - 2026-07-16

### Added

- Localization support with external translation files (`translations/<lang>.json`)
- Supported languages: English, German, French, Spanish, Italian, Dutch, Polish, Portuguese, Czech, Swedish
- Automatic language detection from the Home Assistant user profile (`hass.locale.language`)
- Optional `language` card config option to override the detected language:
  ```yaml
  type: custom:ha-alias-manager
  language: en
  ```
- Embedded English fallback: the card stays fully functional if a translation file is missing or cannot be loaded
- Version banner in the browser console

### Changed

- **HACS distribution switched to `zip_release`**: releases now ship a `ha-alias-manager.zip` asset (built automatically by GitHub Actions) containing the card and all translation files. Manual installs must copy both `ha-alias-manager.js` and the `translations/` folder into the same directory.

## [1.1.0] - 2026-07-16

Added

Basic Localization support (English and German)
Automatic language detection from the Home Assistant user profile (hass.locale.language)
Optional language card config option to override the detected language:


yaml  type: custom:ha-alias-manager
  language: en


English fallback for unknown languages; regional codes (e.g. de-DE) are normalized to their base language


## [1.0.0] - 2026-05-08

### Initial release

- Bulk alias editing for all Home Assistant entities
- Assist exposure toggle per entity
- Filtering by domain, area, Assist status, and free-text search
- Pagination with 50 entities per page
- Lazy alias loading via WebSocket API
- Bulk save for all changes
- Reload button to refresh entity list
