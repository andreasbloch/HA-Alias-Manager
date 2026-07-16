# Changelog

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
