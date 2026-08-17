/**
 * Field Call Tracker - Core Application State & Storage (Centralized Cloud Database Architecture)
 */

const STORAGE_KEY = 'NAGAPATTINAM_FIELD_CALLS_V1';
const SETTINGS_KEY = 'NAGAPATTINAM_TRACKER_SETTINGS_V1';
const DB_VERSION_KEY = 'KSSMART_CENTRAL_DB_VERSION';
const CACHE_CALLS_KEY = 'KSSMART_CENTRAL_CACHED_CALLS';

const defaultSettings = {
  ratePerKm: 5,
  basePincode: '609703',
  theme: 'light'
};

class AppStore {
  constructor() {
    this.calls = [];
    this.version = parseInt(localStorage.getItem(DB_VERSION_KEY) || '0');
    this.settings = { ...defaultSettings };
    this.listeners = [];
    this._isSyncing = false;
    this.init();
  }

  getUserPartitionKey() {
    return STORAGE_KEY;
  }

  getUserSettingsKey() {
    return SETTINGS_KEY;
  }

  init() {
    // 1. Load User Settings
    const savedSettings = localStorage.getItem(SETTINGS_KEY) || localStorage.getItem('fieldCallTracker_settings_v1');
    if (savedSettings) {
      try {
        this.settings = { ...defaultSettings, ...JSON.parse(savedSettings) };
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
    document.documentElement.setAttribute('data-theme', this.settings.theme || 'light');

    // 2. Load cached calls for instant display while connecting to Central DB
    try {
      const cached = localStorage.getItem(CACHE_CALLS_KEY) || localStorage.getItem(STORAGE_KEY);
      if (cached !== null && cached.trim() !== '') {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          this.calls = parsed;
          this.enrichCalls();
        }
      }
    } catch (e) {}

    // 3. Initial UI Paint with cached calls (or empty if wiped)
    this.notify();

    // 4. Setup Centralized Real-time Sync
    this.setupCloudSync();
  }

  setupCloudSync() {
    // Cross-tab broadcast channel
    if ('BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('kssmart_central_sync_v2');
        this.broadcastChannel.onmessage = (msg) => {
          if (msg.data && msg.data.type === 'SYNC') {
            this.fetchCloudCalls(true);
          }
        };
      } catch (e) {}
    }

    // High-priority mobile wakeup triggers (instant sync on app open, tab switch, unlock)
    window.addEventListener('focus', () => this.fetchCloudCalls(true));
    window.addEventListener('pageshow', () => this.fetchCloudCalls(true));
    window.addEventListener('online', () => this.fetchCloudCalls(true));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.fetchCloudCalls(true);
      }
    });

    // Touch/scroll wakeup for mobile: when user taps or scrolls, check cloud if >1.5s since last check
    let lastTouchSync = 0;
    const touchWakeup = () => {
      const now = Date.now();
      if (now - lastTouchSync > 1500) {
        lastTouchSync = now;
        this.fetchCloudCalls(false);
      }
    };
    window.addEventListener('pointerdown', touchWakeup, { passive: true });
    window.addEventListener('scroll', touchWakeup, { passive: true });

    // Rapid Central DB Heartbeat (every 2 seconds)
    if (this._syncInterval) clearInterval(this._syncInterval);
    this._syncInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        this.fetchCloudCalls(false);
      }
    }, 2000);

    // Initial immediate fetch from Central Cloud Database
    this.fetchCloudCalls(true);
  }

  async fetchCloudCalls(force = false) {
    if (this._isSyncing) return;
    this._isSyncing = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2800);

    try {
      const url = force ? `/api/calls?t=${Date.now()}` : `/api/calls?v=${this.version}&t=${Date.now()}`;
      const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) return;

      const data = await res.json();
      if (!data || typeof data !== 'object') return;

      // If server returned modified: false, client is already in sync with Central DB
      if (data.modified === false && !force) return;

      // New data available from Central Database!
      const serverVersion = data.version || 1;
      const serverCalls = Array.isArray(data.calls) ? data.calls : [];

      console.log(`[CENTRAL DB] Synced v${serverVersion} with ${serverCalls.length} calls`);

      this.version = serverVersion;
      this.calls = serverCalls;
      this.enrichCalls();

      // Persist to local storage cache
      localStorage.setItem(DB_VERSION_KEY, String(this.version));
      localStorage.setItem(CACHE_CALLS_KEY, JSON.stringify(this.calls));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.calls));

      // Notify all UI views to update immediately
      this.notify();
    } catch (e) {
      clearTimeout(timeoutId);
    } finally {
      this._isSyncing = false;
    }
  }

  async saveCalls() {
    this.enrichCalls();
    this.notify();
    return this._pushToCloudNow();
  }

  async _pushToCloudNow() {
    try {
      const payload = {
        calls: this.calls,
        timestamp: Date.now()
      };
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.version) {
          this.version = data.version;
          localStorage.setItem(DB_VERSION_KEY, String(this.version));
          localStorage.setItem(CACHE_CALLS_KEY, JSON.stringify(this.calls));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.calls));
        }
        if (this.broadcastChannel) {
          this.broadcastChannel.postMessage({ type: 'SYNC', version: this.version });
        }
      }
    } catch (e) {
      console.warn('[Central DB Push error]', e);
    }
  }

  enrichCalls() {
    const user = (window.authStore && window.authStore.currentUser) || null;
    const defaultDistrict = (user && user.district) ? user.district : 'Nagapattinam';
    const userRate = (user && user.conveyanceRate && !isNaN(parseFloat(user.conveyanceRate)) && parseFloat(user.conveyanceRate) > 0)
      ? parseFloat(user.conveyanceRate)
      : ((this.settings && this.settings.ratePerKm) ? parseFloat(this.settings.ratePerKm) : 5);

    this.calls.forEach((c) => {
      if (!c.district) {
        c.district = defaultDistrict;
      }
      if (!c.block) {
        if (window.INITIAL_FIELD_CALLS) {
          const match = window.INITIAL_FIELD_CALLS.find(initC => String(initC.udise) === String(c.udise));
          if (match && match.block) c.block = match.block;
        }
        if (!c.block && window.udiseGeoEngine) {
          c.block = window.udiseGeoEngine.getBlock(c.udise);
        }
        if (!c.block) c.block = defaultDistrict;
      }
      if (!c.ipAddress && window.IPPingEngine) {
        c.ipAddress = window.IPPingEngine.getLabIP(c.udise, c.district);
      }

      // Auto-migrate conveyance cost on existing saved calls
      if (c.distanceKm !== null && c.distanceKm !== undefined && c.distanceKm !== '') {
        const cleanDist = parseFloat(String(c.distanceKm).replace(/[^0-9.]/g, ''));
        if (!isNaN(cleanDist) && cleanDist >= 0) {
          c.distanceKm = cleanDist;
          if (c.conveyanceCost === null || c.conveyanceCost === undefined || isNaN(parseFloat(c.conveyanceCost))) {
            c.conveyanceCost = Math.round(cleanDist * userRate);
          }
        }
      }
    });
  }

  switchUser(user) {
    this.notify();
    if (typeof window.updateGlobalKpiCards === 'function') {
      window.updateGlobalKpiCards(this.calls, this.settings);
    }
  }

  createAutoBackup() {
    try {
      if (!this.calls || !Array.isArray(this.calls) || this.calls.length === 0) return;
      const user = (window.authStore && window.authStore.currentUser) || null;
      const userTag = user ? (user.empId || user.contactNo || user.id) : 'general';
      const backupKey = `KSSMART_BACKUP_${userTag}`;
      const payload = {
        timestamp: Date.now(),
        dateSaved: new Date().toISOString(),
        user: user ? { name: user.name, empId: user.empId, district: user.district } : null,
        count: this.calls.length,
        calls: this.calls
      };
      localStorage.setItem(backupKey, JSON.stringify(payload));
    } catch (e) {}
  }

  saveSettings() {
    const settingsKey = this.getUserSettingsKey();
    const jsonStr = JSON.stringify(this.settings);
    localStorage.setItem(settingsKey, jsonStr);
    localStorage.setItem(SETTINGS_KEY, jsonStr);
    document.documentElement.setAttribute('data-theme', this.settings.theme);
    this.notify();
  }

  toggleTheme() {
    this.settings.theme = this.settings.theme === 'light' ? 'dark' : 'light';
    this.saveSettings();
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(fn => {
      try { fn(this.calls, this.settings); } catch(e) { console.error('Listener error:', e); }
    });
    // Explicit global notification hooks for zero-delay UI sync across Mobile & Desktop
    try {
      if (typeof window.updateGlobalKpiCards === 'function') {
        window.updateGlobalKpiCards(this.calls, this.settings);
      }
    } catch(e) {}
    try {
      if (window.dashboard && typeof window.dashboard.updateDashboard === 'function') {
        window.dashboard.updateDashboard(this.calls, this.settings);
      }
    } catch(e) {}
    try {
      if (window.tracker && typeof window.tracker.render === 'function') {
        window.tracker.render();
      }
    } catch(e) {}
    try {
      if (window.routePlanner && typeof window.routePlanner.populateAvailableCalls === 'function') {
        window.routePlanner.populateAvailableCalls();
      }
    } catch(e) {}
    try {
      if (typeof window.generateAndPopulateDailyReport === 'function') {
        window.generateAndPopulateDailyReport();
      }
    } catch(e) {}
    try {
      if (typeof window.renderSingleCallCards === 'function') {
        window.renderSingleCallCards();
      }
    } catch(e) {}
  }

  notifySubscribers() {
    this.notify();
  }

  // Record Mutation Methods
  getCallById(id) {
    if (id === undefined || id === null) return null;
    return this.calls ? (this.calls.find(c => String(c.id) === String(id) || (Number(id) > 0 && Number(c.id) === Number(id))) || null) : null;
  }

  updateCall(id, updatedFields) {
    const idx = this.calls.findIndex(c => String(c.id) === String(id));
    if (idx !== -1) {
      const currentCall = this.calls[idx];
      
      // Auto-calculate conveyance cost ONLY when distance is manually provided by engineer
      if ('distanceKm' in updatedFields) {
        const parseNum = (val) => {
          if (val === null || val === undefined || val === '') return null;
          const cleaned = String(val).replace(/[^0-9.]/g, '');
          if (cleaned === '') return null;
          const num = parseFloat(cleaned);
          return isNaN(num) ? null : num;
        };

        const dist = parseNum(updatedFields.distanceKm);
        const userRate = (window.authStore && window.authStore.currentUser && window.authStore.currentUser.conveyanceRate) ? parseFloat(window.authStore.currentUser.conveyanceRate) : null;
        const rate = (userRate && !isNaN(userRate) && userRate > 0) ? userRate : ((this.settings && this.settings.ratePerKm) ? parseFloat(this.settings.ratePerKm) : 5);

        if (dist !== null && dist >= 0) {
          updatedFields.distanceKm = dist;
          updatedFields.conveyanceCost = Math.round(dist * rate);
          updatedFields.isManualInput = true;
        } else {
          updatedFields.distanceKm = null;
          updatedFields.conveyanceCost = null;
          updatedFields.isManualInput = false;
        }
      }

      // Auto-set Date Closed when status is set to Completed (case-insensitive)
      const norm = (s) => (s || '').trim().toLowerCase();
      if (updatedFields.status !== undefined && updatedFields.status !== null) {
        if (norm(updatedFields.status) === 'completed') {
          if (!updatedFields.dateClosed) {
            updatedFields.dateClosed = currentCall.dateClosed || new Date().toISOString().split('T')[0];
          }
        } else if (norm(currentCall.status) === 'completed' && norm(updatedFields.status) !== 'completed') {
          updatedFields.dateClosed = '';
        }
      }

      // Handle ownCashSpent numeric parsing
      if ('ownCashSpent' in updatedFields) {
        const cash = parseFloat(updatedFields.ownCashSpent);
        updatedFields.ownCashSpent = (!isNaN(cash) && cash >= 0) ? cash : 0;
      }

      this.calls[idx] = { ...currentCall, ...updatedFields };
      this.saveCalls();
      return true;
    }
    return false;
  }

  addCall(newCallData) {
    const nextId = this.calls.length > 0 ? Math.max(...this.calls.map(c => Number(c.id) || 0)) + 1 : 1;
    
    // Auto-calculate age from raised date or use explicitly provided ageDays
    let ageDays = (newCallData.ageDays !== undefined && newCallData.ageDays !== null) ? parseInt(newCallData.ageDays) : 0;
    if (isNaN(ageDays) || ageDays < 0) ageDays = 0;

    if (newCallData.ticketRaisedOn) {
      const raisedDate = new Date(newCallData.ticketRaisedOn);
      if (!isNaN(raisedDate.getTime())) {
        const today = new Date();
        const diffTime = Math.abs(today - raisedDate);
        const calculatedAge = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (calculatedAge > 0) ageDays = calculatedAge;
      }
    }

    const isManual = newCallData.isManualInput === true;
    const dist = isManual ? parseFloat(newCallData.distanceKm) : null;
    const conveyanceCost = (isManual && !isNaN(dist) && dist >= 0) ? dist * (this.settings.ratePerKm || 5) : null;
    const ownCash = parseFloat(newCallData.ownCashSpent);

    const fullCall = {
      id: nextId,
      udise: newCallData.udise || '',
      block: newCallData.block || 'Nagapattinam',
      schoolName: newCallData.schoolName || '',
      issue: newCallData.issue || '',
      category: newCallData.category || 'TICKETING TOOL TICKET',
      aiName: newCallData.aiName || '',
      contactNo: newCallData.contactNo || '',
      zone611001: newCallData.zone611001 || 'NO',
      ticketRaisedOn: newCallData.ticketRaisedOn || new Date().toISOString().split('T')[0],
      ageDays: ageDays,
      status: newCallData.status || 'Not Started',
      distanceKm: dist,
      conveyanceCost: conveyanceCost,
      isManualInput: isManual,
      dateClosed: newCallData.status === 'Completed' ? new Date().toISOString().split('T')[0] : '',
      reasonIncomplete: newCallData.reasonIncomplete || '',
      actionTaken: newCallData.actionTaken || '',
      materialsUsed: newCallData.materialsUsed || '',
      ownCashSpent: (!isNaN(ownCash) && ownCash >= 0) ? ownCash : 0,
      ownCashReason: newCallData.ownCashReason || '',
      hmName: newCallData.hmName || '',
      hmSignedSheet: newCallData.hmSignedSheet || '',
      visitedBy: newCallData.visitedBy || ''
    };

    this.calls.unshift(fullCall);
    this.saveCalls();
    return fullCall;
  }

  cleanDuplicateCalls() {
    const seenMap = new Map();
    const cleanList = [];

    this.calls.forEach(c => {
      const udiseStr = String(c.udise || '').trim();
      const issueCore = String(c.issue || '').toLowerCase().replace(/#ccc-\d+/g, '').trim();
      const key = `${udiseStr}_${String(c.schoolName || '')}_${issueCore}`;

      if (udiseStr && udiseStr !== '33190000000') {
        if (!seenMap.has(key)) {
          seenMap.set(key, true);
          cleanList.push(c);
        }
      } else {
        cleanList.push(c);
      }
    });

    this.calls = cleanList;
  }

  deleteCall(id) {
    this.calls = this.calls.filter(c => String(c.id) !== String(id) && (isNaN(Number(id)) || Number(c.id) !== Number(id)));
    this.saveCalls();
  }

  async deleteAllCalls() {
    this.calls = [];
    localStorage.setItem(CACHE_CALLS_KEY, '[]');
    localStorage.setItem(STORAGE_KEY, '[]');
    this.notify();
    await this._pushToCloudNow();
    if (typeof window.updateGlobalKpiCards === 'function') {
      window.updateGlobalKpiCards([], this.settings);
    }
  }

  async resetToInitial() {
    const initialData = window.INITIAL_FIELD_CALLS || [];
    this.calls = JSON.parse(JSON.stringify(initialData));
    this.enrichCalls();
    this.cleanDuplicateCalls();
    localStorage.setItem(CACHE_CALLS_KEY, JSON.stringify(this.calls));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.calls));
    this.notify();
    await this._pushToCloudNow();
    if (typeof window.updateGlobalKpiCards === 'function') {
      window.updateGlobalKpiCards(this.calls, this.settings);
    }
  }
}

// Global App Instance
window.appStore = new AppStore();
