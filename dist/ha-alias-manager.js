const CARD_VERSION = '1.2.2';
const MODULE_URL = import.meta.url;
const SUPPORTED_LANGUAGES = ['en', 'de', 'fr', 'es', 'it', 'nl', 'pl', 'pt', 'cs', 'sv'];

// Embedded English fallback – keeps the card fully functional even if the
// translations/ folder is missing (manual install) or a fetch fails.
const FALLBACK_EN = {
  title: 'Alias Manager',
  reload: 'Reload',
  reloadTitle: 'Reload entities',
  save: 'Save',
  search: 'Search...',
  allDomains: 'All domains',
  allAreas: 'All areas',
  allAssist: 'All',
  assistOn: 'Assist enabled',
  assistOff: 'Assist disabled',
  loadingEntities: 'Loading entities...',
  loading: 'Loading...',
  loadingAliases: 'loading...',
  entitiesLoaded: '{count} entities loaded.',
  noEntities: 'No entities found.',
  error: 'Error: {message}',
  colEntity: 'Entity',
  colDomain: 'Domain',
  colAliases: 'Aliases',
  colArea: 'Area',
  colAssist: 'Assist',
  aliasPlaceholder: 'alias1, alias2',
  pageOf: '{start}\u2013{end} of {total}',
  saved: '{count} saved',
  savedErrors: '{count} saved, {errors} errors',
  assistToggle: 'Toggle Assist',
  selectedCount: '{count} selected',
  bulkAssistOn: 'Assist ON',
  bulkAssistOff: 'Assist OFF',
  clearSelection: 'Clear selection',
  selectAllTitle: 'Select all filtered entities',
  selectRow: 'Select entity'
};

class AliasManagerCard extends HTMLElement {
  static _i18nCache = {};

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._changes = {};
    this._assistChanges = {};
    this._entities = [];
    this._filtered = [];
    this._page = 0;
    this._pageSize = 50;
    this._aliasCache = {};
    this._selected = new Set();
    this._lang = 'en';
    this._dict = FALLBACK_EN;
  }

  setConfig(config) {
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._loaded) {
      this._loaded = true;
      this._init();
    }
  }

  async _init() {
    const lang = this.resolveLang();
    if (lang !== this._lang || this._dict === FALLBACK_EN) {
      this._lang = lang;
      await this._loadTranslations(lang);
      this.render();
    }
    this.loadEntities();
  }

  resolveLang() {
    let raw = this._config?.language
      || this._hass?.locale?.language
      || this._hass?.language
      || (typeof navigator !== 'undefined' ? navigator.language : 'en')
      || 'en';
    raw = String(raw).toLowerCase();
    if (SUPPORTED_LANGUAGES.includes(raw)) return raw;
    const base = raw.split('-')[0];
    if (SUPPORTED_LANGUAGES.includes(base)) return base;
    return 'en';
  }

  async _loadTranslations(lang) {
    if (lang === 'en') { this._dict = FALLBACK_EN; return; }
    if (AliasManagerCard._i18nCache[lang]) {
      this._dict = AliasManagerCard._i18nCache[lang];
      return;
    }
    try {
      const url = new URL(`./translations/${lang}.json?v=${CARD_VERSION}`, MODULE_URL);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      AliasManagerCard._i18nCache[lang] = data;
      this._dict = data;
    } catch (e) {
      console.warn(`ha-alias-manager: could not load translations/${lang}.json, falling back to English.`, e);
      this._dict = FALLBACK_EN;
    }
  }

  t(key, params) {
    let str = this._dict[key] !== undefined ? this._dict[key] : (FALLBACK_EN[key] || key);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      }
    }
    return str;
  }

  getCardSize() { return 10; }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: var(--primary-font-family, sans-serif); }
        .card { background: var(--card-background-color, white); border-radius: 12px; padding: 16px; }
        h2 { margin: 0 0 12px; font-size: 18px; font-weight: 500; color: var(--primary-text-color); display: flex; align-items: center; gap: 8px; justify-content: space-between; flex-wrap: wrap; }
        .filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
        input, select { font-size: 13px; padding: 6px 10px; border-radius: 8px; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, white); color: var(--primary-text-color); }
        .filters input { flex: 1; min-width: 150px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
        thead th { text-align: left; padding: 8px; font-size: 12px; font-weight: 500; color: var(--secondary-text-color); border-bottom: 1px solid var(--divider-color, #eee); background: var(--secondary-background-color, #f5f5f5); white-space: nowrap; overflow: hidden; }
        th:nth-child(1) { width: 28px; }
        th:nth-child(2) { width: 30%; }
        th:nth-child(3) { width: 90px; }
        th:nth-child(4) { width: auto; }
        th:nth-child(5) { width: 80px; }
        th:nth-child(6) { width: 55px; text-align: center; }
        tbody tr { border-bottom: 1px solid var(--divider-color, #eee); }
        tbody tr:hover { background: var(--secondary-background-color, #f9f9f9); }
        td { padding: 6px 8px; vertical-align: middle; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--primary-text-color); }
        td.aliases-cell { white-space: normal; padding: 4px 12px 4px 8px; overflow: visible; }
        .friendly-name { font-size: 13px; }
        .entity-id { font-size: 11px; color: var(--secondary-text-color); font-family: monospace; }
        .alias-input { width: calc(100% - 4px); font-size: 12px; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, white); color: var(--primary-text-color); }
        .alias-input.modified { border-color: orange; background: rgba(255,165,0,0.08); }
        .badge { display: inline-block; font-size: 11px; padding: 2px 6px; border-radius: 6px; background: var(--secondary-background-color, #eee); color: var(--secondary-text-color); }
        .toggle { width: 34px; height: 20px; border-radius: 10px; border: none; cursor: pointer; position: relative; }
        .toggle.on { background: var(--success-color, #4CAF50); }
        .toggle.off { background: var(--disabled-color, #ccc); }
        .toggle::after { content: ''; position: absolute; width: 14px; height: 14px; border-radius: 50%; background: white; top: 3px; transition: left 0.15s; }
        .toggle.on::after { left: 17px; }
        .toggle.off::after { left: 3px; }
        .save-btn { font-size: 13px; padding: 7px 14px; border-radius: 8px; border: none; background: var(--primary-color, #03a9f4); color: white; cursor: pointer; font-weight: 500; }
        .save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .reload-btn { font-size: 13px; padding: 7px 12px; border-radius: 8px; border: 1px solid var(--divider-color, #ccc); background: transparent; color: var(--primary-text-color); cursor: pointer; }
        .status { font-size: 12px; color: var(--secondary-text-color); padding: 4px 0; margin-bottom: 8px; }
        .empty { text-align: center; padding: 2rem; color: var(--secondary-text-color); }
        .paging { display: flex; align-items: center; gap: 8px; justify-content: center; padding: 12px 0 4px; flex-wrap: wrap; }
        .paging button { font-size: 13px; padding: 5px 12px; border-radius: 8px; border: 1px solid var(--divider-color, #ccc); background: transparent; color: var(--primary-text-color); cursor: pointer; }
        .paging button:disabled { opacity: 0.4; cursor: not-allowed; }
        .paging button.active { background: var(--primary-color, #03a9f4); color: white; border-color: var(--primary-color, #03a9f4); }
        .paging span { font-size: 12px; color: var(--secondary-text-color); }
        .loading-aliases { font-size: 11px; color: var(--secondary-text-color); font-style: italic; }
        .bulk-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 6px 10px; margin-bottom: 8px; border-radius: 8px; background: var(--secondary-background-color, #f5f5f5); font-size: 13px; color: var(--primary-text-color); }
        .bulk-bar:empty { display: none; }
        .bulk-bar button { font-size: 12px; padding: 5px 10px; border-radius: 8px; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, white); color: var(--primary-text-color); cursor: pointer; }
        .bulk-bar button.bulk-on { border-color: var(--success-color, #4CAF50); color: var(--success-color, #4CAF50); }
        .bulk-bar button.bulk-off { border-color: var(--error-color, #f44336); color: var(--error-color, #f44336); }
        input[type="checkbox"] { cursor: pointer; }
      </style>
      <div class="card">
        <h2>
          <span>${this.t('title')}</span>
          <button class="reload-btn" id="reloadBtn" title="${this.t('reloadTitle')}">${this.t('reload')}</button>
          <button class="save-btn" id="saveBtn" disabled>${this.t('save')} (<span id="changeCount">0</span>)</button>
        </h2>
        <div class="filters">
          <input type="text" id="searchFilter" placeholder="${this.t('search')}" />
          <select id="domainFilter"><option value="">${this.t('allDomains')}</option></select>
          <select id="areaFilter"><option value="">${this.t('allAreas')}</option></select>
          <select id="assistFilter">
            <option value="">${this.t('allAssist')}</option>
            <option value="on">${this.t('assistOn')}</option>
            <option value="off">${this.t('assistOff')}</option>
          </select>
        </div>
        <div class="status" id="statusBar"></div>
        <div class="bulk-bar" id="bulkBar"></div>
        <div id="tableWrapper"><div class="empty">${this.t('loadingEntities')}</div></div>
        <div class="paging" id="pagingBar"></div>
      </div>`;

    this.shadowRoot.getElementById('searchFilter').addEventListener('input', () => { this._page = 0; this.applyFilters(); });
    this.shadowRoot.getElementById('domainFilter').addEventListener('change', () => { this._page = 0; this.applyFilters(); });
    this.shadowRoot.getElementById('areaFilter').addEventListener('change', () => { this._page = 0; this.applyFilters(); });
    this.shadowRoot.getElementById('assistFilter').addEventListener('change', () => { this._page = 0; this.applyFilters(); });
    this.shadowRoot.getElementById('saveBtn').addEventListener('click', () => this.saveChanges());
    this.shadowRoot.getElementById('reloadBtn').addEventListener('click', () => this.reloadEntities());
  }

  async loadEntities() {
    if (!this._hass) return;
    try {
      const [states, registry] = await Promise.all([
        this._hass.callApi('GET', 'states'),
        this._hass.callWS({ type: 'config/entity_registry/list' }).catch(() => [])
      ]);

      const regMap = {};
      (registry || []).forEach(e => { regMap[e.entity_id] = e; });

      this._entities = states.map(s => {
        const reg = regMap[s.entity_id] || {};
        return {
          entity_id: s.entity_id,
          friendly_name: s.attributes.friendly_name || s.entity_id,
          domain: s.entity_id.split('.')[0],
          area: reg.area_id || '',
          aliases: null,
          assist: reg.options?.conversation?.should_expose !== false
        };
      }).sort((a, b) => a.domain.localeCompare(b.domain) || a.friendly_name.localeCompare(b.friendly_name));

      const domains = [...new Set(this._entities.map(e => e.domain))].sort();
      const areas = [...new Set(this._entities.map(e => e.area).filter(Boolean))].sort();

      const domSel = this.shadowRoot.getElementById('domainFilter');
      domSel.innerHTML = `<option value="">${this.t('allDomains')}</option>` + domains.map(d => `<option value="${d}">${d}</option>`).join('');

      const areaSel = this.shadowRoot.getElementById('areaFilter');
      areaSel.innerHTML = `<option value="">${this.t('allAreas')}</option>` + areas.map(a => `<option value="${a}">${a}</option>`).join('');

      this._changes = {};
      this._assistChanges = {};
      this._page = 0;
      this.applyFilters();
      this.updateStatus(this.t('entitiesLoaded', { count: this._entities.length }));
    } catch(e) {
      this.shadowRoot.getElementById('tableWrapper').innerHTML = `<div class="empty">${this.t('error', { message: this.esc(e.message) })}</div>`;
    }
  }

  applyFilters() {
    const search = (this.shadowRoot.getElementById('searchFilter').value || '').toLowerCase();
    const domain = this.shadowRoot.getElementById('domainFilter').value;
    const area = this.shadowRoot.getElementById('areaFilter').value;
    const assist = this.shadowRoot.getElementById('assistFilter').value;

    this._filtered = this._entities.filter(e => {
      if (search && !e.friendly_name.toLowerCase().includes(search) && !e.entity_id.toLowerCase().includes(search)) return false;
      if (domain && e.domain !== domain) return false;
      if (area && e.area !== area) return false;
      const curAssist = this._assistChanges[e.entity_id] !== undefined ? this._assistChanges[e.entity_id] : e.assist;
      if (assist === 'on' && !curAssist) return false;
      if (assist === 'off' && curAssist) return false;
      return true;
    });
    this.renderTable();
    this.renderPaging();
    this.loadAliasesForPage();
  }

  getPageEntities() {
    const start = this._page * this._pageSize;
    return this._filtered.slice(start, start + this._pageSize);
  }

  async loadAliasesForPage() {
    const pageEntities = this.getPageEntities();
    const toLoad = pageEntities.filter(e => e.aliases === null && !this._aliasCache[e.entity_id]);

    if (toLoad.length === 0) {
      pageEntities.forEach(e => {
        if (this._aliasCache[e.entity_id] !== undefined) e.aliases = this._aliasCache[e.entity_id];
      });
      this.renderTable();
      return;
    }

    await Promise.all(toLoad.map(async e => {
      try {
        const detail = await this._hass.callWS({ type: 'config/entity_registry/get', entity_id: e.entity_id });
        const aliases = (detail.aliases || []).filter(a => a !== null).join(', ');
        e.aliases = aliases;
        this._aliasCache[e.entity_id] = aliases;
      } catch(err) {
        e.aliases = '';
        this._aliasCache[e.entity_id] = '';
      }
    }));
    this.renderTable();
  }

  renderTable() {
    const pageEntities = this.getPageEntities();
    if (pageEntities.length === 0) {
      this.shadowRoot.getElementById('tableWrapper').innerHTML = `<div class="empty">${this.t('noEntities')}</div>`;
      return;
    }

    const rows = pageEntities.map(e => {
      const curAlias = this._changes[e.entity_id] !== undefined ? this._changes[e.entity_id] : (e.aliases || '');
      const curAssist = this._assistChanges[e.entity_id] !== undefined ? this._assistChanges[e.entity_id] : e.assist;
      const modified = this._changes[e.entity_id] !== undefined;
      const loading = e.aliases === null;
      return `<tr>
        <td><input type="checkbox" class="row-select" data-id="${this.esc(e.entity_id)}" ${this._selected.has(e.entity_id) ? 'checked' : ''} aria-label="${this.t('selectRow')}" /></td>
        <td title="${this.esc(e.entity_id)}">
          <div class="friendly-name">${this.esc(e.friendly_name)}</div>
          <div class="entity-id">${this.esc(e.entity_id)}</div>
        </td>
        <td><span class="badge">${e.domain}</span></td>
        <td class="aliases-cell">
          ${loading
            ? `<span class="loading-aliases">${this.t('loadingAliases')}</span>`
            : `<input class="alias-input ${modified ? 'modified' : ''}" data-id="${this.esc(e.entity_id)}" value="${this.esc(curAlias)}" placeholder="${this.t('aliasPlaceholder')}" />`
          }
        </td>
        <td style="overflow:hidden;text-overflow:ellipsis;max-width:80px;" title="${this.esc(e.area)}"><span class="badge" style="max-width:100%;overflow:hidden;text-overflow:ellipsis;display:inline-block;vertical-align:middle;">${this.esc(e.area) || '\u2013'}</span></td>
        <td style="text-align:center">
          <button class="toggle ${curAssist ? 'on' : 'off'}" data-id="${e.entity_id}" aria-label="${this.t('assistToggle')}"></button>
        </td>
      </tr>`;
    }).join('');

    this.shadowRoot.getElementById('tableWrapper').innerHTML = `
      <table>
        <thead><tr>
          <th><input type="checkbox" id="selectAll" title="${this.t('selectAllTitle')}" /></th><th>${this.t('colEntity')}</th><th>${this.t('colDomain')}</th>
          <th>${this.t('colAliases')}</th><th>${this.t('colArea')}</th>
          <th style="text-align:center">${this.t('colAssist')}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;

    this.shadowRoot.querySelectorAll('.alias-input').forEach(input => {
      input.addEventListener('input', () => {
        const id = input.dataset.id;
        const entity = this._entities.find(e => e.entity_id === id);
        const orig = entity ? (entity.aliases || '') : '';
        if (input.value !== orig) {
          this._changes[id] = input.value;
          input.classList.add('modified');
        } else {
          delete this._changes[id];
          input.classList.remove('modified');
        }
        this.updateChangeCount();
      });
    });

    this.shadowRoot.querySelectorAll('.toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const entity = this._entities.find(e => e.entity_id === id);
        const current = this._assistChanges[id] !== undefined ? this._assistChanges[id] : entity.assist;
        const newVal = !current;
        if (newVal !== entity.assist) {
          this._assistChanges[id] = newVal;
        } else {
          delete this._assistChanges[id];
        }
        btn.className = `toggle ${newVal ? 'on' : 'off'}`;
        this.updateChangeCount();
      });
    });

    this.shadowRoot.querySelectorAll('.row-select').forEach(cb => {
      cb.addEventListener('change', () => {
        const id = cb.dataset.id;
        if (cb.checked) this._selected.add(id);
        else this._selected.delete(id);
        this.syncSelectAllState();
        this.updateBulkBar();
      });
    });

    const selectAll = this.shadowRoot.getElementById('selectAll');
    if (selectAll) {
      selectAll.addEventListener('change', () => {
        const allSelected = this._filtered.length > 0 && this._filtered.every(e => this._selected.has(e.entity_id));
        if (allSelected) {
          this._filtered.forEach(e => this._selected.delete(e.entity_id));
        } else {
          this._filtered.forEach(e => this._selected.add(e.entity_id));
        }
        this.renderTable();
        this.updateBulkBar();
      });
    }

    this.syncSelectAllState();
    this.updateBulkBar();
  }

  syncSelectAllState() {
    const selectAll = this.shadowRoot.getElementById('selectAll');
    if (!selectAll) return;
    const selectedInFilter = this._filtered.filter(e => this._selected.has(e.entity_id)).length;
    selectAll.checked = this._filtered.length > 0 && selectedInFilter === this._filtered.length;
    selectAll.indeterminate = selectedInFilter > 0 && selectedInFilter < this._filtered.length;
  }

  updateBulkBar() {
    const bar = this.shadowRoot.getElementById('bulkBar');
    if (!bar) return;
    const count = this._selected.size;
    if (count === 0) { bar.innerHTML = ''; return; }

    bar.innerHTML = `
      <span>${this.t('selectedCount', { count })}</span>
      <button class="bulk-on" id="bulkOnBtn">${this.t('bulkAssistOn')}</button>
      <button class="bulk-off" id="bulkOffBtn">${this.t('bulkAssistOff')}</button>
      <button id="bulkClearBtn">${this.t('clearSelection')}</button>`;

    bar.querySelector('#bulkOnBtn').addEventListener('click', () => this.applyBulkAssist(true));
    bar.querySelector('#bulkOffBtn').addEventListener('click', () => this.applyBulkAssist(false));
    bar.querySelector('#bulkClearBtn').addEventListener('click', () => {
      this._selected.clear();
      this.renderTable();
      this.updateBulkBar();
    });
  }

  applyBulkAssist(newVal) {
    const entityMap = {};
    this._entities.forEach(e => { entityMap[e.entity_id] = e; });

    this._selected.forEach(id => {
      const entity = entityMap[id];
      if (!entity) return;
      if (newVal !== entity.assist) {
        this._assistChanges[id] = newVal;
      } else {
        delete this._assistChanges[id];
      }
    });

    this.renderTable();
    this.updateBulkBar();
    this.updateChangeCount();
  }

  renderPaging() {
    const total = this._filtered.length;
    const totalPages = Math.ceil(total / this._pageSize);
    const bar = this.shadowRoot.getElementById('pagingBar');

    if (totalPages <= 1) { bar.innerHTML = ''; return; }

    const start = this._page * this._pageSize + 1;
    const end = Math.min((this._page + 1) * this._pageSize, total);

    let pages = '';
    for (let i = 0; i < totalPages; i++) {
      if (totalPages > 10 && Math.abs(i - this._page) > 2 && i !== 0 && i !== totalPages - 1) {
        if (i === 1 || i === totalPages - 2) pages += `<span>...</span>`;
        continue;
      }
      pages += `<button class="${i === this._page ? 'active' : ''}" data-page="${i}">${i + 1}</button>`;
    }

    bar.innerHTML = `
      <button id="prevBtn" ${this._page === 0 ? 'disabled' : ''}>&#8249;</button>
      ${pages}
      <button id="nextBtn" ${this._page >= totalPages - 1 ? 'disabled' : ''}>&#8250;</button>
      <span>${this.t('pageOf', { start, end, total })}</span>`;

    bar.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => { this._page = parseInt(btn.dataset.page); this.renderTable(); this.renderPaging(); this.loadAliasesForPage(); });
    });
    bar.querySelector('#prevBtn')?.addEventListener('click', () => { if (this._page > 0) { this._page--; this.renderTable(); this.renderPaging(); this.loadAliasesForPage(); } });
    bar.querySelector('#nextBtn')?.addEventListener('click', () => { if (this._page < totalPages - 1) { this._page++; this.renderTable(); this.renderPaging(); this.loadAliasesForPage(); } });
  }

  reloadEntities() {
    this._loaded = false;
    this._aliasCache = {};
    this._changes = {};
    this._assistChanges = {};
    this._selected = new Set();
    this._page = 0;
    this.updateBulkBar();
    this.shadowRoot.getElementById('tableWrapper').innerHTML = `<div class="empty">${this.t('loadingEntities')}</div>`;
    this.updateStatus(this.t('loading'));
    this._loaded = true;
    this.loadEntities();
  }

  updateChangeCount() {
    const total = Object.keys(this._changes).length + Object.keys(this._assistChanges).length;
    this.shadowRoot.getElementById('changeCount').textContent = total;
    this.shadowRoot.getElementById('saveBtn').disabled = total === 0;
  }

  async saveChanges() {
    let saved = 0, errors = 0;

    for (const [id, aliasVal] of Object.entries(this._changes)) {
      const aliases = aliasVal.split(',').map(a => a.trim()).filter(Boolean);
      try {
        await this._hass.callWS({ type: 'config/entity_registry/update', entity_id: id, aliases });
        const entity = this._entities.find(e => e.entity_id === id);
        if (entity) { entity.aliases = aliasVal; this._aliasCache[id] = aliasVal; }
        saved++;
      } catch(e) { errors++; }
    }

    const assistIds = Object.entries(this._assistChanges);
    if (assistIds.length > 0) {
      const toExpose = assistIds.filter(([,v]) => v).map(([id]) => id);
      const toHide = assistIds.filter(([,v]) => !v).map(([id]) => id);
      try {
        if (toExpose.length > 0) {
          await this._hass.callWS({ type: 'homeassistant/expose_entity', assistants: ['conversation'], entity_ids: toExpose, should_expose: true });
          toExpose.forEach(id => { const e = this._entities.find(e => e.entity_id === id); if (e) e.assist = true; });
          saved += toExpose.length;
        }
        if (toHide.length > 0) {
          await this._hass.callWS({ type: 'homeassistant/expose_entity', assistants: ['conversation'], entity_ids: toHide, should_expose: false });
          toHide.forEach(id => { const e = this._entities.find(e => e.entity_id === id); if (e) e.assist = false; });
          saved += toHide.length;
        }
      } catch(e) { errors++; }
    }

    this._changes = {};
    this._assistChanges = {};
    this.updateChangeCount();
    this.updateStatus(errors > 0
      ? this.t('savedErrors', { count: saved, errors })
      : this.t('saved', { count: saved }) + '.');
    this.applyFilters();
  }

  updateStatus(msg) {
    this.shadowRoot.getElementById('statusBar').textContent = msg;
  }

  esc(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
}

customElements.define('ha-alias-manager', AliasManagerCard);

// Register card in HACS/Lovelace card picker
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'ha-alias-manager',
  name: 'HA Alias Manager',
  description: 'Bulk manage entity aliases and Assist exposure',
  preview: false,
  documentationURL: 'https://github.com/andreasbloch/ha-alias-manager',
});

console.info(`%c HA-ALIAS-MANAGER %c v${CARD_VERSION} `, 'color: white; background: #03a9f4; font-weight: 700;', 'color: #03a9f4; background: white; font-weight: 700;');
