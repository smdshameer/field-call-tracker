/**
 * Field Call Tracker - Core Application State & Storage
 */

const STORAGE_KEY = 'NAGAPATTINAM_FIELD_CALLS_V1';
const SETTINGS_KEY = 'NAGAPATTINAM_TRACKER_SETTINGS_V1';

const defaultSettings = {
  ratePerKm: 5,
  basePincode: '609703',
  theme: 'light'
};

class AppStore {
  constructor() {
    this.calls = [];
    this.settings = { ...defaultSettings };
    this.listeners = [];
    this.init();
  }

  getUserPartitionKey() {
    return STORAGE_KEY;
  }

  getUserSettingsKey() {
    return SETTINGS_KEY;
  }

  init() {
    this.loadUserData();
    this.setupCloudSync();
  }

  loadUserData() {
    const partitionKey = STORAGE_KEY;

    // 1. Load User Settings
    const savedSettings = localStorage.getItem(SETTINGS_KEY) || localStorage.getItem('fieldCallTracker_settings_v1');
    if (savedSettings) {
      try {
        this.settings = { ...defaultSettings, ...JSON.parse(savedSettings) };
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }

    // Apply Theme
    document.documentElement.setAttribute('data-theme', this.settings.theme || 'light');

    // 2. Explicitly Reset or Wiped Workspace -> 0 Calls
    const isExplicitlyReset = localStorage.getItem('FIELD_TRACKER_WAS_RESET') === 'true';
    if (isExplicitlyReset) {
      this.calls = [];
      localStorage.setItem(STORAGE_KEY, '[]');
      this.notify();
      if (typeof window.updateGlobalKpiCards === 'function') {
        window.updateGlobalKpiCards([], this.settings);
      }
      return;
    }

    // 3. Load Saved Calls from Central Storage
    const centralCallsStr = localStorage.getItem(STORAGE_KEY);
    if (centralCallsStr !== null && centralCallsStr.trim() !== '') {
      try {
        const parsed = JSON.parse(centralCallsStr);
        if (Array.isArray(parsed)) {
          this.calls = parsed;
          if (this.calls.length === 0) {
            this.notify();
            if (typeof window.updateGlobalKpiCards === 'function') {
              window.updateGlobalKpiCards([], this.settings);
            }
            return;
          }
        }
      } catch (e) {
        console.error('Error loading centralized calls:', e);
      }
    } else {
      console.log('[APP] First-time initialization with 53 baseline calls...');
      const initialData = window.INITIAL_FIELD_CALLS || [];
      this.calls = JSON.parse(JSON.stringify(initialData));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.calls));
    }

    // Auto-enrich calls with district, block, and IP Address if missing
    this.enrichCalls();

    // Auto-clean any duplicate calls
    this.cleanDuplicateCalls();

    // Persist to unified storage
    this.saveCalls();
  }

  setupCloudSync() {
    // 1. BroadcastChannel for instant cross-tab / cross-window sync
    if ('BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('kssmart_field_sync');
        this.broadcastChannel.onmessage = (msg) => {
          if (msg.data && msg.data.type === 'CALLS_MUTATED') {
            this.fetchCloudCalls(true);
          }
        };
      } catch (e) {}
    }

    // 2. Refresh on window focus and tab visibility change
    window.addEventListener('focus', () => this.fetchCloudCalls(false));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.fetchCloudCalls(false);
      }
    });

    // 3. Regular background cloud sync heartbeat (every 5 seconds)
    if (this._cloudSyncInterval) clearInterval(this._cloudSyncInterval);
    this._cloudSyncInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        this.fetchCloudCalls(false);
      }
    }, 5000);

    // 4. Initial cloud pull (seed cloud if empty)
    setTimeout(() => this.fetchCloudCalls(true), 300);
  }

  async fetchCloudCalls(force = false) {
    if (this._isSyncingCloud) return;
    this._isSyncingCloud = true;

    try {
      const res = await fetch('/api/calls?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;

      const data = await res.json();
      if (!data || typeof data !== 'object') return;

      const cloudTimestamp = data.timestamp || 0;
      const localTimestamp = parseInt(localStorage.getItem('KSSMART_LAST_SYNC_TS') || '0');

      // 1. Cloud was explicitly wiped to 0 calls
      if (data.wasReset === true) {
        if (this.calls.length > 0 || localStorage.getItem('FIELD_TRACKER_WAS_RESET') !== 'true') {
          console.log('[CLOUD SYNC] Cloud was wiped. Syncing 0-state to this device.');
          localStorage.setItem('FIELD_TRACKER_WAS_RESET', 'true');
          this.calls = [];
          localStorage.setItem(STORAGE_KEY, '[]');
          localStorage.setItem('KSSMART_LAST_SYNC_TS', String(cloudTimestamp));
          this.notify();
          if (typeof window.updateGlobalKpiCards === 'function') {
            window.updateGlobalKpiCards([], this.settings);
          }
        }
        return;
      }

      // 2. Cloud has call data → download if cloud is newer or local is empty
      if (Array.isArray(data.calls) && data.calls.length > 0) {
        localStorage.removeItem('FIELD_TRACKER_WAS_RESET');
        if (cloudTimestamp >= localTimestamp || this.calls.length === 0 || force) {
          const serverStr = JSON.stringify(data.calls);
          const localStr = JSON.stringify(this.calls);
          if (serverStr !== localStr) {
            console.log('[CLOUD SYNC] Downloading ' + data.calls.length + ' calls from cloud (cloud ts=' + cloudTimestamp + ', local ts=' + localTimestamp + ')');
            this.calls = data.calls;
            this.enrichCalls();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.calls));
            localStorage.setItem('KSSMART_LAST_SYNC_TS', String(cloudTimestamp));
            this.notify();
            if (typeof window.updateGlobalKpiCards === 'function') {
              window.updateGlobalKpiCards(this.calls, this.settings);
            }
          }
        }
        return;
      }

      // 3. Cloud is empty/null (cold start on a different edge node) → push local data to seed cloud
      if (this.calls.length > 0 && localStorage.getItem('FIELD_TRACKER_WAS_RESET') !== 'true') {
        console.log('[CLOUD SYNC] Cloud is empty. Seeding cloud with ' + this.calls.length + ' local calls.');
        this._pushToCloudNow(false);
      }
    } catch (e) {
      console.warn('[CLOUD SYNC] Sync notice:', e.message);
    } finally {
      this._isSyncingCloud = false;
    }
  }

  async pushToCloud(isExplicitReset = false) {
    // Debounce: coalesce rapid saves into a single cloud push after 500ms
    if (this._pushDebounce) clearTimeout(this._pushDebounce);
    this._pushDebounce = setTimeout(() => this._pushToCloudNow(isExplicitReset), 500);
  }

  async _pushToCloudNow(isExplicitReset = false) {
    try {
      const wasReset = isExplicitReset || (this.calls.length === 0 && localStorage.getItem('FIELD_TRACKER_WAS_RESET') === 'true');
      const timestamp = Date.now();
      const payload = {
        calls: this.calls,
        wasReset: wasReset,
        timestamp: timestamp
      };
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        localStorage.setItem('KSSMART_LAST_SYNC_TS', String(timestamp));
        if (this.broadcastChannel) {
          this.broadcastChannel.postMessage({ type: 'CALLS_MUTATED', wasReset: wasReset, timestamp: timestamp });
        }
      }
    } catch (e) {
      console.warn('[CLOUD SYNC] Push deferred:', e.message);
    }
  }

  updateCloudSyncBadge(status) {}

  saveCalls() {
    const dataStr = JSON.stringify(this.calls);
    try {
      localStorage.setItem(STORAGE_KEY, dataStr);
      this.createAutoBackup();
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }
    this.notify();
    // Auto-push every local save to cloud for cross-device sync
    this.pushToCloud(false);
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
    this.loadUserData();
    this.notify();
    if (typeof window.updateGlobalKpiCards === 'function') {
      window.updateGlobalKpiCards(this.calls, this.settings);
    }
  }

  saveCalls() {
    const partitionKey = this.getUserPartitionKey();
    const dataStr = JSON.stringify(this.calls);

    try {
      localStorage.setItem(partitionKey, dataStr);
      localStorage.setItem(STORAGE_KEY, dataStr);
      this.createAutoBackup();
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }

    this.notify();
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

  resetAllData(mode) {
    const partitionKey = this.getUserPartitionKey();
    if (mode === 'EMPTY') {
      this.calls = [];
    } else {
      const initialData = window.INITIAL_FIELD_CALLS || [];
      this.calls = JSON.parse(JSON.stringify(initialData));
    }
    this.saveCalls();
    this.notify();
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

  // Alias used by ipPingEngine.js
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

    localStorage.removeItem('FIELD_TRACKER_WAS_RESET');
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

  addBulkCalls(rawCallsArray) {
    if (!Array.isArray(rawCallsArray) || rawCallsArray.length === 0) return 0;
    localStorage.removeItem('FIELD_TRACKER_WAS_RESET');
    let addedCount = 0;
    rawCallsArray.forEach(rawCall => {
      const udiseStr = String(rawCall.udise || '').trim();
      const rawIssue = String(rawCall.issue || '').trim();
      const ticketMatch = rawIssue.match(/#CCC-\d+/i);
      const ticketId = ticketMatch ? ticketMatch[0].toUpperCase() : null;

      const isDuplicate = this.calls.some(c => {
        const cUdise = String(c.udise || '').trim();
        if (cUdise !== udiseStr) return false;

        // 1. Exact ticket ID match (#CCC-XXXX)
        if (ticketId && String(c.issue || '').toUpperCase().includes(ticketId)) return true;

        // 2. Exact issue & school match
        if (String(c.issue || '').trim().toLowerCase() === rawIssue.toLowerCase()) {
          return true;
        }

        return false;
      });

      if (!isDuplicate) {
        const nextId = this.calls.length > 0 ? Math.max(...this.calls.map(c => Number(c.id) || 0)) + 1 : 1;
        const dist = rawCall.isManualInput ? parseFloat(rawCall.distanceKm) : null;
        const conveyanceCost = (!isNaN(dist) && dist !== null && dist >= 0) ? dist * (this.settings.ratePerKm || 5) : null;
        
        const fullCall = {
          id: nextId,
          udise: rawCall.udise || '',
          block: rawCall.block || 'Nagapattinam',
          district: rawCall.district || 'Nagapattinam',
          schoolName: rawCall.schoolName || '',
          issue: rawCall.issue || 'CCC Portal Complaint Registered',
          category: rawCall.category || 'CCC PORTAL COMPLAINT',
          contactNo: rawCall.contactNo || '',
          zone611001: rawCall.zone611001 || 'NO',
          ticketRaisedOn: rawCall.ticketRaisedOn || new Date().toISOString().split('T')[0],
          ageDays: 1,
          status: 'Not Started',
          distanceKm: dist,
          conveyanceCost: conveyanceCost,
          dateClosed: '',
          actionTaken: '',
          materialsUsed: '',
          ownCashSpent: 0,
          ownCashReason: '',
          visitedBy: rawCall.visitedBy || '',
          isPortalSynced: true,
          isNewToday: true
        };
        this.calls.unshift(fullCall);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      this.saveCalls();
    }
    return addedCount;
  }

  deleteCall(id) {
    this.calls = this.calls.filter(c => String(c.id) !== String(id) && (isNaN(Number(id)) || Number(c.id) !== Number(id)));
    if (this.calls.length === 0) {
      localStorage.setItem('FIELD_TRACKER_WAS_RESET', 'true');
    }
    this.saveCalls();
  }

  deleteAllCalls() {
    localStorage.setItem('FIELD_TRACKER_WAS_RESET', 'true');
    this.calls = [];
    localStorage.setItem(STORAGE_KEY, '[]');
    localStorage.setItem('KSSMART_LAST_SYNC_TS', String(Date.now()));
    this.notify();
    this._pushToCloudNow(true);
    if (typeof window.updateGlobalKpiCards === 'function') {
      window.updateGlobalKpiCards([], this.settings);
    }
  }

  resetToInitial() {
    localStorage.removeItem('FIELD_TRACKER_WAS_RESET');
    const initialData = window.INITIAL_FIELD_CALLS || [];
    this.calls = JSON.parse(JSON.stringify(initialData));
    this.enrichCalls();
    this.cleanDuplicateCalls();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.calls));
    localStorage.setItem('KSSMART_LAST_SYNC_TS', String(Date.now()));
    this.notify();
    this._pushToCloudNow(false);
    if (typeof window.updateGlobalKpiCards === 'function') {
      window.updateGlobalKpiCards(this.calls, this.settings);
    }
  }
}

// Global App Instance
window.appStore = new AppStore();
