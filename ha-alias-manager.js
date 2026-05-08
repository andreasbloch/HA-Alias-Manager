class AliasManagerCard extends HTMLElement {
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
  }

  setConfig(config) {
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._loaded) {
      this._loaded = true;
      this.loadEntities();
    }
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
        td.aliases-cell { white-space: normal; }
        .friendly-name { font-size: 13px; }
        .entity-id { font-size: 11px; color: var(--secondary-text-color); font-family: monospace; }
        .alias-input { width: 100%; font-size: 12px; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, white); color: var(--primary-text-color); }
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
      </style>
      <div class="card">
        <h2>
          <span>Alias Manager</span>
          <button class="reload-btn" id="reloadBtn" title="Neu laden">Neu laden</button>
          <button class="save-btn" id="saveBtn" disabled>Speichern (<span id="changeCount">0</span>)</button>
        </h2>
        <div class="filters">
          <input type="text" id="searchFilter" placeholder="Suchen..." />
          <select id="domainFilter"><option value="">Alle Domains</option></select>
          <select id="areaFilter"><option value="">Alle Bereiche</option></select>
          <select id="assistFilter">
            <option value="">Alle</option>
            <option value="on">Assist aktiv</option>
            <option value="off">Assist inaktiv</option>
          </select>
        </div>
        <div class="status" id="statusBar"></div>
        <div id="tableWrapper"><div class="empty">Lade Entitäten...</div></div>
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
      domSel.innerHTML = '<option value="">Alle Domains</option>' + domains.map(d => `<option value="${d}">${d}</option>`).join('');

      const areaSel = this.shadowRoot.getElementById('areaFilter');
      areaSel.innerHTML = '<option value="">Alle Bereiche</option>' + areas.map(a => `<option value="${a}">${a}</option>`).join('');

      this._changes = {};
      this._assistChanges = {};
      this._page = 0;
      this.applyFilters();
      this.updateStatus(`${this._entities.length} Entitäten geladen.`);
    } catch(e) {
      this.shadowRoot.getElementById('tableWrapper').innerHTML = `<div class="empty">Fehler: ${e.message}</div>`;
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
      this.shadowRoot.getElementById('tableWrapper').innerHTML = '<div class="empty">Keine Entitäten gefunden.</div>';
      return;
    }

    const rows = pageEntities.map(e => {
      const curAlias = this._changes[e.entity_id] !== undefined ? this._changes[e.entity_id] : (e.aliases || '');
      const curAssist = this._assistChanges[e.entity_id] !== undefined ? this._assistChanges[e.entity_id] : e.assist;
      const modified = this._changes[e.entity_id] !== undefined;
      const loading = e.aliases === null;
      return `<tr>
        <td><input type="checkbox" data-id="${e.entity_id}" /></td>
        <td title="${this.esc(e.entity_id)}">
          <div class="friendly-name">${this.esc(e.friendly_name)}</div>
          <div class="entity-id">${this.esc(e.entity_id)}</div>
        </td>
        <td><span class="badge">${e.domain}</span></td>
        <td class="aliases-cell">
          ${loading
            ? `<span class="loading-aliases">lädt...</span>`
            : `<input class="alias-input ${modified ? 'modified' : ''}" data-id="${this.esc(e.entity_id)}" value="${this.esc(curAlias)}" placeholder="alias1, alias2" />`
          }
        </td>
        <td><span class="badge">${e.area || '–'}</span></td>
        <td style="text-align:center">
          <button class="toggle ${curAssist ? 'on' : 'off'}" data-id="${e.entity_id}" aria-label="Assist toggle"></button>
        </td>
      </tr>`;
    }).join('');

    this.shadowRoot.getElementById('tableWrapper').innerHTML = `
      <table>
        <thead><tr>
          <th></th><th>Entität</th><th>Domain</th>
          <th>Aliases</th><th>Bereich</th>
          <th style="text-align:center">Assist</th>
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
      <span>${start}–${end} von ${total}</span>`;

    bar.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => { this._page = parseInt(btn.dataset.page); this.renderTable(); this.renderPaging(); this.loadAliasesForPage(); });
    });
    bar.getElementById && bar.getElementById('prevBtn');
    bar.querySelector('#prevBtn')?.addEventListener('click', () => { if (this._page > 0) { this._page--; this.renderTable(); this.renderPaging(); this.loadAliasesForPage(); } });
    bar.querySelector('#nextBtn')?.addEventListener('click', () => { if (this._page < totalPages - 1) { this._page++; this.renderTable(); this.renderPaging(); this.loadAliasesForPage(); } });
  }

  reloadEntities() {
    this._loaded = false;
    this._aliasCache = {};
    this._changes = {};
    this._assistChanges = {};
    this._page = 0;
    this.shadowRoot.getElementById("tableWrapper").innerHTML = "<div class=\"empty\">Lade Entitäten...</div>";
    this.updateStatus("Lade...");
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
    this.updateStatus(`${saved} gespeichert${errors > 0 ? `, ${errors} Fehler` : ''}.`);
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
