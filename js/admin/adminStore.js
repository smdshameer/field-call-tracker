/**
 * KS Smart Solutions - Statewide Admin Store (adminStore.js)
 * Tamil Nadu School ICT / Smart Classroom / Hi-Tech Lab Field Operations
 * COMPLETE: Full CRUD for Engineers & Schools, Credential Bridge, Bulk Import, Performance Analytics
 */

(function(window) {
  'use strict';

  // Standard 38 Districts of Tamil Nadu
  const TN_DISTRICTS = [
    'NAGAPATTINAM', 'MAYILADUTHURAI', 'THIRUVARUR', 'THANJAVUR', 'CUDDALORE',
    'ARIYALUR', 'PERAMBALUR', 'TIRUCHIRAPPALLI', 'KARUR', 'PUDUKKOTTAI', 'MADURAI',
    'DINDIGUL', 'THENI', 'RAMANATHAPURAM', 'SIVAGANGA', 'VIRUDHUNAGAR',
    'TIRUNELVELI', 'TENKASI', 'THOOTHUKUDI', 'KANYAKUMARI', 'SALEM',
    'NAMAKKAL', 'DHARMAPURI', 'KRISHNAGIRI', 'ERODE', 'TIRUPPUR',
    'COIMBATORE', 'NILGIRIS', 'VELLORE', 'RANIPET', 'TIRUPATTUR',
    'TIRUVANNAMALAI', 'VILLUPURAM', 'KALLAKURICHI', 'KANCHIPURAM', 'CHENGALPATTU',
    'TIRUVALLUR', 'CHENNAI'
  ];

  // School categories
  const SCHOOL_CATEGORIES = ['PUPS', 'PUMS', 'GHS', 'GHSS', 'HSS', 'GBHSS', 'GOVT ADW MS', 'GOVT ADW HSS', 'MODEL SCHOOL'];

  // Baseline Hardware Item Specifications
  const HARDWARE_CATALOG_DEFS = {
    HITECH_LAB: [
      { id: 'cpu', name: 'Acer Desktop CPU', unitQty: 10, unit: 'Nos', brand: 'Acer Veriton', desc: 'Intel i5/i3 Student Terminals' },
      { id: 'monitor', name: 'Acer Monitor (TFT/LED)', unitQty: 10, unit: 'Nos', brand: 'Acer', desc: '18.5" / 19.5" Student Displays' },
      { id: 'keyboard', name: 'Acer USB Keyboard', unitQty: 10, unit: 'Nos', brand: 'Acer', desc: 'Standard Membrane Keyboards' },
      { id: 'mouse', name: 'Acer USB Optical Mouse', unitQty: 10, unit: 'Nos', brand: 'Acer', desc: 'USB Optical Mouse with pads' },
      { id: 'webcam', name: 'Web Camera (HD)', unitQty: 10, unit: 'Nos', brand: 'Quantum/Intex', desc: 'Student Webcams' },
      { id: 'splitter', name: 'Headphone Audio Splitter', unitQty: 10, unit: 'Nos', brand: 'Generic', desc: '3.5mm Dual Audio Splitters' },
      { id: 'ups_5kva', name: '5 KVA Online UPS', unitQty: 1, unit: 'No', brand: 'Numeric/Eaton', desc: 'Central Power Backup System' },
      { id: 'iso_transformer', name: '5 KVA Isolation Transformer', unitQty: 1, unit: 'No', brand: 'Powertech', desc: 'Power Conditioning & Surge Shield' },
      { id: 'batteries_12v', name: 'UPS Batteries (12V)', unitQty: 14, unit: 'Nos', brand: 'Exide/Amaron', desc: '12V 26AH/42AH Battery Bank' },
      { id: 'ip_camera', name: 'CP Plus IP Surveillance Camera', unitQty: 1, unit: 'No', brand: 'CP Plus', desc: 'Lab Security Dome/Bullet IP Camera' },
      { id: 'switch_24p', name: '24-Port D-Link Switch', unitQty: 1, unit: 'No', brand: 'D-Link', desc: 'Rack-Mounted Network Distribution' },
      { id: 'router_meraki', name: 'Cisco Meraki Security Router', unitQty: 1, unit: 'No', brand: 'Cisco Meraki', desc: 'Cloud-Managed Security Gateway' },
      { id: 'projector', name: 'Short-Throw Projector', unitQty: 1, unit: 'No', brand: 'BenQ/Epson', desc: 'Interactive High-Lumen Projector' },
      { id: 'projector_screen', name: 'Projector Display Screen', unitQty: 1, unit: 'No', brand: 'Liberty', desc: 'Motorized/Manual Display Screen' },
      { id: 'projector_remote', name: 'Projector Remote Control', unitQty: 1, unit: 'No', brand: 'OEM', desc: 'IR Controller for Projector' },
      { id: 'speakers', name: 'Zebronics Multimedia Speakers', unitQty: 1, unit: 'No', brand: 'Zebronics', desc: 'Amplified Teacher Audio System' }
    ],
    SMART_CLASSROOM: [
      { id: 'smart_board', name: 'Smart Board (Interactive Flat Panel)', unitQty: 1, unit: 'No', brand: 'Newline/LG', desc: '65"/75" Touch Interactive Display' },
      { id: 'cpu_single', name: 'Acer Desktop CPU', unitQty: 1, unit: 'No', brand: 'Acer Veriton', desc: 'Host Computing Unit' },
      { id: 'monitor_single', name: 'Acer Monitor (TFT/LED)', unitQty: 1, unit: 'No', brand: 'Acer', desc: 'Teacher Console Display' },
      { id: 'ups_1kva', name: '1 KVA Line-Interactive UPS', unitQty: 1, unit: 'No', brand: 'Numeric/Microtek', desc: 'Primary Power Backup' },
      { id: 'batteries_ups_3', name: 'UPS Batteries for 1KVA', unitQty: 3, unit: 'Nos', brand: 'Exide/Amaron', desc: '12V Battery Pack (3 Nos)' },
      { id: 'kb_mouse_set', name: 'Keyboard & Mouse Set', unitQty: 1, unit: 'Set', brand: 'Acer', desc: 'USB Keyboard & Mouse' }
    ]
  };

  class AdminStore {
    constructor() {
      this.storageKey = 'KS_FIELD_TRACKER_ADMIN_STORE_V2';
      this.tnDistricts = TN_DISTRICTS;
      this.schoolCategories = SCHOOL_CATEGORIES;
      this.hardwareDefs = HARDWARE_CATALOG_DEFS;
      
      this.state = {
        isAdminMode: false,
        adminPasscode: '8899',
        activeAdminName: 'State Project Directorate Admin',
        engineers: [],
        districtAllocations: {},
        schoolsMaster: [],
        schoolAssets: {},
        defectLogs: [],
        auditLogs: []
      };

      this.init();
    }

    init() {
      this.loadLocal();
      if (!Array.isArray(this.state.engineers) || this.state.engineers.length === 0) {
        this.seedInitialEngineers();
      }
      if (!Array.isArray(this.state.schoolsMaster) || this.state.schoolsMaster.length === 0) {
        this.seedInitialSchools();
      }
      if (!Array.isArray(this.state.defectLogs)) {
        this.state.defectLogs = [];
      }
      if (!Array.isArray(this.state.auditLogs)) {
        this.state.auditLogs = [];
      }
      if (!this.state.districtAllocations || typeof this.state.districtAllocations !== 'object') {
        this.rebuildDistrictMap();
      }
    }

    loadLocal() {
      try {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            this.state = Object.assign({}, this.state, parsed);
          }
        }
      } catch (err) {
        console.warn('[AdminStore] Failed to load local state:', err);
      }
    }

    saveLocal() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      } catch (err) {
        console.warn('[AdminStore] Failed to save local state:', err);
      }
    }

    // ─── AUDIT LOG ────────────────────────────────────────
    addAuditLog(action, details) {
      if (!Array.isArray(this.state.auditLogs)) this.state.auditLogs = [];
      this.state.auditLogs.unshift({
        id: 'AUD_' + Date.now(),
        action: action,
        details: details || '',
        timestamp: new Date().toISOString(),
        performedBy: this.state.activeAdminName || 'Admin'
      });
      // Keep last 500
      if (this.state.auditLogs.length > 500) this.state.auditLogs.length = 500;
    }

    // ─── SEED DATA ────────────────────────────────────────
    seedInitialEngineers() {
      this.state.engineers = [
        {
          empId: '569',
          name: 'Mohamed Shameer',
          phone: '9840000001',
          email: 'shameer.field@kssmart.co',
          baseLocation: 'Nagapattinam',
          assignedDistricts: ['NAGAPATTINAM', 'MAYILADUTHURAI'],
          pin: '5690',
          role: 'district_lead',
          status: 'Active'
        },
        {
          empId: '570',
          name: 'Elavarasan',
          phone: '9840000002',
          email: 'elavarasan@kssmart.co',
          baseLocation: 'Ariyalur',
          assignedDistricts: ['ARIYALUR', 'PERAMBALUR'],
          pin: '5700',
          role: 'field_engineer',
          status: 'Active'
        },
        {
          empId: '571',
          name: 'Vignesh',
          phone: '9840000003',
          email: 'vignesh@kssmart.co',
          baseLocation: 'Thanjavur',
          assignedDistricts: ['THANJAVUR', 'PUDUKKOTTAI'],
          pin: '5710',
          role: 'field_engineer',
          status: 'Active'
        },
        {
          empId: '572',
          name: 'Ramesh',
          phone: '9840000004',
          email: 'ramesh@kssmart.co',
          baseLocation: 'Thiruvarur',
          assignedDistricts: ['THIRUVARUR', 'TIRUCHIRAPPALLI'],
          pin: '5720',
          role: 'field_engineer',
          status: 'Active'
        }
      ];

      this.rebuildDistrictMap();
      this.saveLocal();
    }

    seedInitialSchools() {
      this.state.schoolsMaster = [
        {
          udise: '33190400501',
          schoolName: 'PUMS VILUNTHAMAVADI WEST',
          category: 'PUMS',
          district: 'NAGAPATTINAM',
          block: 'Keezhaiyur',
          aiName: 'K. Senthil Nathan',
          aiPhone: '6384147212',
          aiAlsoHandlesUdises: ['33190400502'],
          labCount: 1,
          labType: 'Hi-Tech Lab'
        },
        {
          udise: '33190102201',
          schoolName: 'PUMS THERKKU POIGAINALLUR',
          category: 'PUMS',
          district: 'NAGAPATTINAM',
          block: 'Nagapattinam',
          aiName: 'M. Rajalakshmi',
          aiPhone: '6382800142',
          aiAlsoHandlesUdises: [],
          labCount: 1,
          labType: 'Hi-Tech Lab'
        },
        {
          udise: '33190300901',
          schoolName: 'PUMS KURUMANANGUDI',
          category: 'PUMS',
          district: 'NAGAPATTINAM',
          block: 'Kelvelur',
          aiName: 'P. Anandhan',
          aiPhone: '8608350855',
          aiAlsoHandlesUdises: ['33190301102'],
          labCount: 1,
          labType: 'Hi-Tech Lab'
        },
        {
          udise: '33190201501',
          schoolName: 'GHSS THIRUMARUGAL (MODEL)',
          category: 'GHSS',
          district: 'NAGAPATTINAM',
          block: 'Thirumarugal',
          aiName: 'S. Balamurugan',
          aiPhone: '9443658210',
          aiAlsoHandlesUdises: [],
          labCount: 5,
          labType: 'Hi-Tech Lab'
        },
        {
          udise: '33190500101',
          schoolName: 'GHSS VEDARANYAM (CAMPUS)',
          category: 'GHSS',
          district: 'NAGAPATTINAM',
          block: 'Vedaranyam',
          aiName: 'V. Murugesan',
          aiPhone: '9842109844',
          aiAlsoHandlesUdises: [],
          labCount: 9,
          labType: 'Hi-Tech Lab'
        }
      ];

      this.saveLocal();
    }

    // ─── DISTRICT MAP ─────────────────────────────────────
    rebuildDistrictMap() {
      this.state.districtAllocations = {};
      const engineers = this.state.engineers || [];
      engineers.forEach(eng => {
        if (Array.isArray(eng.assignedDistricts)) {
          eng.assignedDistricts.forEach(d => {
            this.state.districtAllocations[d.toUpperCase().trim()] = eng.empId;
          });
        }
      });
    }

    getEngineerForDistrict(districtName) {
      if (!districtName) return null;
      const dKey = districtName.toUpperCase().trim();
      const empId = this.state.districtAllocations ? this.state.districtAllocations[dKey] : null;
      if (empId && Array.isArray(this.state.engineers)) {
        return this.state.engineers.find(e => e.empId === empId) || null;
      }
      return null;
    }

    // ─── ENGINEER CRUD ────────────────────────────────────

    addEngineer(data) {
      if (!data.name || !data.empId) return { success: false, message: 'Name and Employee ID are required.' };
      
      // Check for duplicate empId
      const exists = (this.state.engineers || []).find(e => e.empId === data.empId.toString().trim());
      if (exists) return { success: false, message: `Employee ID ${data.empId} already exists (${exists.name}).` };

      const newEng = {
        empId: data.empId.toString().trim(),
        name: data.name.trim(),
        phone: (data.phone || '').trim(),
        email: (data.email || '').trim(),
        baseLocation: (data.baseLocation || '').trim(),
        assignedDistricts: Array.isArray(data.assignedDistricts) ? data.assignedDistricts.map(d => d.toUpperCase().trim()) : [],
        pin: (data.pin || data.empId.toString().trim() + '0').substring(0, 4),
        role: data.role || 'field_engineer',
        status: 'Active'
      };

      this.state.engineers.push(newEng);
      this.rebuildDistrictMap();

      // Sync to authStore
      this._syncEngineerToAuth(newEng, data.password || newEng.pin);

      this.addAuditLog('ADD_ENGINEER', `Added engineer: ${newEng.name} (#${newEng.empId})`);
      this.saveLocal();
      return { success: true, message: `Engineer ${newEng.name} added successfully!` };
    }

    updateEngineer(empId, updates) {
      const eng = (this.state.engineers || []).find(e => e.empId === empId);
      if (!eng) return { success: false, message: 'Engineer not found.' };

      if (updates.name) eng.name = updates.name.trim();
      if (updates.phone) eng.phone = updates.phone.trim();
      if (updates.email) eng.email = updates.email.trim();
      if (updates.baseLocation) eng.baseLocation = updates.baseLocation.trim();
      if (updates.role) eng.role = updates.role;
      if (updates.status) eng.status = updates.status;

      // Sync name/email changes to authStore
      this._syncEngineerProfileToAuth(eng);

      this.addAuditLog('UPDATE_ENGINEER', `Updated engineer: ${eng.name} (#${eng.empId})`);
      this.saveLocal();
      return { success: true, message: `Engineer ${eng.name} updated successfully!` };
    }

    deleteEngineer(empId) {
      const idx = (this.state.engineers || []).findIndex(e => e.empId === empId);
      if (idx === -1) return { success: false, message: 'Engineer not found.' };

      const eng = this.state.engineers[idx];
      eng.status = 'Inactive';
      this.addAuditLog('DEACTIVATE_ENGINEER', `Deactivated engineer: ${eng.name} (#${eng.empId})`);
      this.rebuildDistrictMap();
      this.saveLocal();
      return { success: true, message: `Engineer ${eng.name} has been deactivated.` };
    }

    assignDistrictsToEngineer(empId, districtsArray) {
      const eng = (this.state.engineers || []).find(e => e.empId === empId);
      if (!eng) return { success: false, message: 'Engineer not found' };

      eng.assignedDistricts = (districtsArray || []).map(d => d.toUpperCase().trim());
      this.rebuildDistrictMap();
      this.addAuditLog('ASSIGN_DISTRICTS', `Assigned districts [${eng.assignedDistricts.join(', ')}] to ${eng.name}`);
      this.saveLocal();
      return { success: true, message: `Districts assigned to ${eng.name} successfully!` };
    }

    // Alias so adminViews.js can call either name
    assignDistricts(empId, districtsArray) {
      return this.assignDistrictsToEngineer(empId, districtsArray);
    }

    // ─── CREDENTIAL RESET WITH AUTH BRIDGE ────────────────
    resetEngineerPin(empId, newPin) {
      const eng = (this.state.engineers || []).find(e => e.empId === empId);
      if (!eng) return { success: false, message: 'Engineer not found' };
      
      const cleanPin = (newPin || '1234').toString().trim();
      eng.pin = cleanPin;

      // BRIDGE: Sync to authStore so login actually works
      this._syncCredentialToAuth(empId, cleanPin);

      this.addAuditLog('RESET_PIN', `Reset login credentials for ${eng.name} (#${empId})`);
      this.saveLocal();
      return { success: true, message: `Login credentials reset successfully for ${eng.name}. New password: ${cleanPin}` };
    }

    // Alias so adminViews.js can call either name
    resetPin(empId, newPin) {
      return this.resetEngineerPin(empId, newPin);
    }

    // Sync credential change to auth.js user database
    _syncCredentialToAuth(empId, newPassword) {
      try {
        if (window.authStore && Array.isArray(window.authStore.users)) {
          const authUser = window.authStore.users.find(u => u.empId === empId);
          if (authUser) {
            authUser.password = newPassword;
            window.authStore.saveUsers();
            console.log('[AdminStore] Credential synced to authStore for empId:', empId);
          } else {
            console.warn('[AdminStore] No matching auth user found for empId:', empId);
          }
        }
      } catch (err) {
        console.warn('[AdminStore] Failed to sync credential to auth:', err);
      }
    }

    // Sync new engineer to auth.js user database
    _syncEngineerToAuth(eng, password) {
      try {
        if (window.authStore && Array.isArray(window.authStore.users)) {
          const existing = window.authStore.users.find(u => u.empId === eng.empId);
          if (!existing) {
            window.authStore.users.push({
              id: 'user_' + Date.now(),
              name: eng.name,
              email: eng.email || (eng.empId + '@kssmart.co'),
              contactNo: eng.phone || '',
              empId: eng.empId,
              district: eng.baseLocation || eng.assignedDistricts[0] || 'TN',
              homeBaseLocation: (eng.baseLocation || 'Field') + ' Base',
              role: 'FIELD_ENGINEER',
              password: password || eng.pin
            });
            window.authStore.saveUsers();
            console.log('[AdminStore] New engineer synced to authStore:', eng.name);
          }
        }
      } catch (err) {
        console.warn('[AdminStore] Failed to sync new engineer to auth:', err);
      }
    }

    // Sync profile updates to auth.js
    _syncEngineerProfileToAuth(eng) {
      try {
        if (window.authStore && Array.isArray(window.authStore.users)) {
          const authUser = window.authStore.users.find(u => u.empId === eng.empId);
          if (authUser) {
            authUser.name = eng.name;
            authUser.email = eng.email;
            authUser.contactNo = eng.phone;
            authUser.district = eng.baseLocation || authUser.district;
            window.authStore.saveUsers();
          }
        }
      } catch (err) {
        console.warn('[AdminStore] Failed to sync profile to auth:', err);
      }
    }

    // ─── SCHOOL CRUD ──────────────────────────────────────

    addSchool(data) {
      if (!data.udise || !data.schoolName) return { success: false, message: 'UDISE Code and School Name are required.' };
      
      const cleanUdise = data.udise.toString().trim();
      const exists = (this.state.schoolsMaster || []).find(s => s.udise === cleanUdise);
      if (exists) return { success: false, message: `School with UDISE ${cleanUdise} already exists: ${exists.schoolName}` };

      const newSchool = {
        udise: cleanUdise,
        schoolName: (data.schoolName || '').trim().toUpperCase(),
        category: (data.category || 'PUMS').trim().toUpperCase(),
        district: (data.district || 'NAGAPATTINAM').trim().toUpperCase(),
        block: (data.block || '').trim(),
        aiName: (data.aiName || '').trim(),
        aiPhone: (data.aiPhone || '').trim(),
        aiAlsoHandlesUdises: Array.isArray(data.aiAlsoHandlesUdises) ? data.aiAlsoHandlesUdises : [],
        labCount: parseInt(data.labCount) || 1,
        labType: data.labType || 'Hi-Tech Lab'
      };

      this.state.schoolsMaster.push(newSchool);
      this.addAuditLog('ADD_SCHOOL', `Added school: ${newSchool.schoolName} (UDISE: ${newSchool.udise})`);
      this.saveLocal();
      return { success: true, message: `School ${newSchool.schoolName} added successfully!` };
    }

    updateSchool(udise, updates) {
      const school = (this.state.schoolsMaster || []).find(s => s.udise === udise);
      if (!school) return { success: false, message: 'School not found.' };

      if (updates.schoolName) school.schoolName = updates.schoolName.trim().toUpperCase();
      if (updates.category) school.category = updates.category.trim().toUpperCase();
      if (updates.district) school.district = updates.district.trim().toUpperCase();
      if (updates.block) school.block = updates.block.trim();
      if (updates.aiName) school.aiName = updates.aiName.trim();
      if (updates.aiPhone) school.aiPhone = updates.aiPhone.trim();
      if (updates.labCount !== undefined) school.labCount = parseInt(updates.labCount) || 1;
      if (updates.labType) school.labType = updates.labType;
      if (Array.isArray(updates.aiAlsoHandlesUdises)) school.aiAlsoHandlesUdises = updates.aiAlsoHandlesUdises;

      this.addAuditLog('UPDATE_SCHOOL', `Updated school: ${school.schoolName} (UDISE: ${udise})`);
      this.saveLocal();
      return { success: true, message: `School ${school.schoolName} updated successfully!` };
    }

    deleteSchool(udise) {
      const idx = (this.state.schoolsMaster || []).findIndex(s => s.udise === udise);
      if (idx === -1) return { success: false, message: 'School not found.' };
      const removed = this.state.schoolsMaster.splice(idx, 1)[0];
      this.addAuditLog('DELETE_SCHOOL', `Removed school: ${removed.schoolName} (UDISE: ${udise})`);
      this.saveLocal();
      return { success: true, message: `School ${removed.schoolName} removed.` };
    }

    bulkImportSchools(schoolsArray) {
      if (!Array.isArray(schoolsArray) || schoolsArray.length === 0) {
        return { success: false, message: 'No schools data provided.', imported: 0, skipped: 0 };
      }

      let imported = 0, updated = 0, skipped = 0;
      schoolsArray.forEach((row, idx) => {
        let udise = (row.udise || row.UDISE || row['UDISE Code'] || '').toString().trim();
        const aiName = (row.aiName || row['AI Name'] || row.ai || row['NAME AS PER AADHAR'] || '').toString().trim();
        const aiPhone = (row.aiPhone || row['AI Phone'] || row.phone || row['MOBILE NUMBER'] || '').toString().trim();
        const aiId = (row.aiId || row['AI ID'] || '').toString().trim();
        const district = (row.district || row.District || 'NAGAPATTINAM').toString().trim().toUpperCase();
        const schoolName = (row.schoolName || row['School Name'] || row.school || (aiName ? `${aiName} (AI - ${district})` : `School (${district} #${idx + 1})`)).toString().trim().toUpperCase();
        
        // If UDISE is empty, create from AI ID, phone, or index
        if (!udise) {
          if (aiId) udise = 'AI-' + aiId.replace(/^_+/, '');
          else if (aiPhone) udise = 'AI-' + aiPhone.slice(-6);
          else udise = 'SCH-' + (Date.now() + idx).toString().slice(-8);
        }

        // Check if school already exists by exact UDISE match only (no phone/name merging)
        const exists = this.state.schoolsMaster.find(s => s.udise === udise);

        if (exists) {
          // Enrich existing record with new details if missing
          if (aiName && !exists.aiName) exists.aiName = aiName;
          if (aiPhone && !exists.aiPhone) exists.aiPhone = aiPhone;
          if (row.block && !exists.block) exists.block = row.block.toString().trim();
          updated++;
          return;
        }

        this.state.schoolsMaster.push({
          udise: udise,
          schoolName: schoolName,
          category: (row.category || row.Category || row.Type || 'PUMS').toString().trim().toUpperCase(),
          district: district,
          block: (row.block || row.Block || '').toString().trim(),
          aiName: aiName,
          aiPhone: aiPhone,
          aiAlsoHandlesUdises: [],
          labCount: parseInt(row.labCount || row['Lab Count'] || row.labs || 1) || 1,
          labType: (row.labType || row['Lab Type'] || 'Hi-Tech Lab').toString().trim()
        });
        imported++;
      });

      this.addAuditLog('BULK_IMPORT_SCHOOLS', `Bulk imported ${imported} schools, updated ${updated}`);
      this.saveLocal();
      const msg = updated > 0 
        ? `Successfully imported ${imported} new and updated ${updated} existing school/AI records!` 
        : `Successfully imported ${imported} school & AI records!`;
      return { success: true, message: msg, imported, updated, skipped };
    }

    syncFromGeoDirectory(geoSchools) {
      if (!Array.isArray(geoSchools) || geoSchools.length === 0) return;
      return this.bulkImportSchools(geoSchools);
    }

    // ─── BULK CALL IMPORT ─────────────────────────────────

    bulkImportCalls(callsArray) {
      if (!Array.isArray(callsArray) || callsArray.length === 0) {
        return { success: false, message: 'No calls data provided.', imported: 0 };
      }

      if (!window.appStore || !Array.isArray(window.appStore.calls)) {
        return { success: false, message: 'App store not available.', imported: 0 };
      }

      let imported = 0;
      callsArray.forEach(row => {
        const schoolName = (row.schoolName || row['School Name'] || row.school || '').toString().trim();
        const district = (row.district || row.District || 'NAGAPATTINAM').toString().trim().toUpperCase();
        if (!schoolName) return;

        const newCall = {
          id: 'CALL_ADMIN_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
          schoolName: schoolName,
          udise: (row.udise || row.UDISE || row['UDISE Code'] || '').toString().trim(),
          district: district,
          contactPerson: (row.contactPerson || row['Contact Person'] || row.ai || '').toString().trim(),
          contactNo: (row.contactNo || row['Contact No'] || row.phone || '').toString().trim(),
          issue: (row.issue || row.Issue || row.complaint || 'General service call').toString().trim(),
          status: (row.status || 'Not Started').toString().trim(),
          priority: (row.priority || 'Normal').toString().trim(),
          dateRegistered: row.dateRegistered || row.date || new Date().toISOString().split('T')[0],
          visitedBy: '',
          ageDays: 0,
          engineerRemarks: '',
          source: 'Admin Bulk Import'
        };

        // Auto-calculate age
        try {
          const regDate = new Date(newCall.dateRegistered);
          const today = new Date();
          newCall.ageDays = Math.floor((today - regDate) / (1000 * 60 * 60 * 24));
        } catch (e) { newCall.ageDays = 0; }

        window.appStore.calls.push(newCall);
        imported++;
      });

      if (imported > 0 && window.appStore.save) {
        window.appStore.save();
      }

      this.addAuditLog('BULK_IMPORT_CALLS', `Bulk imported ${imported} calls across multiple districts`);
      return { success: true, message: `Successfully imported ${imported} calls.`, imported };
    }

    // ─── ENGINEER PERFORMANCE ANALYTICS ───────────────────

    getEngineerPerformance(empId) {
      const eng = (this.state.engineers || []).find(e => e.empId === empId);
      if (!eng) return null;

      const calls = (window.appStore && Array.isArray(window.appStore.calls)) ? window.appStore.calls : [];
      const districts = (eng.assignedDistricts || []).map(d => d.toUpperCase());

      // Filter calls by engineer's assigned districts
      const assignedCalls = calls.filter(c => {
        const cd = (c.district || '').toUpperCase();
        return districts.includes(cd);
      });

      const completed = assignedCalls.filter(c => c.status === 'Completed').length;
      const inProgress = assignedCalls.filter(c => c.status === 'In Progress').length;
      const notStarted = assignedCalls.filter(c => c.status === 'Not Started').length;
      const total = assignedCalls.length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Average resolution time (for completed calls that have dates)
      let avgResolutionDays = 0;
      const completedWithDates = assignedCalls.filter(c => c.status === 'Completed' && c.dateRegistered && c.dateClosed);
      if (completedWithDates.length > 0) {
        const totalDays = completedWithDates.reduce((sum, c) => {
          try {
            const reg = new Date(c.dateRegistered);
            const closed = new Date(c.dateClosed);
            return sum + Math.max(0, Math.floor((closed - reg) / (1000 * 60 * 60 * 24)));
          } catch (e) { return sum; }
        }, 0);
        avgResolutionDays = Math.round(totalDays / completedWithDates.length);
      }

      // Critical aging count
      const criticalAging = assignedCalls.filter(c => c.status !== 'Completed' && parseInt(c.ageDays) >= 100).length;

      // Defect reports by this engineer
      const defectCount = (this.state.defectLogs || []).filter(d => {
        const dd = (d.district || '').toUpperCase();
        return districts.includes(dd);
      }).length;

      return {
        empId: eng.empId,
        name: eng.name,
        districts: eng.assignedDistricts,
        status: eng.status,
        totalCalls: total,
        completed,
        inProgress,
        notStarted,
        completionRate,
        avgResolutionDays,
        criticalAging,
        defectReports: defectCount
      };
    }

    getAllEngineersPerformance() {
      return (this.state.engineers || [])
        .filter(e => e.status === 'Active')
        .map(e => this.getEngineerPerformance(e.empId))
        .filter(Boolean)
        .sort((a, b) => b.completionRate - a.completionRate);
    }

    // ─── DATE-FILTERED REPORTS ────────────────────────────

    getFilteredCalls(startDate, endDate) {
      const calls = (window.appStore && Array.isArray(window.appStore.calls)) ? window.appStore.calls : [];
      if (!startDate && !endDate) return calls;

      const start = startDate ? new Date(startDate + 'T00:00:00') : new Date('2020-01-01');
      const end = endDate ? new Date(endDate + 'T23:59:59') : new Date();

      return calls.filter(c => {
        try {
          const regDate = new Date(c.dateRegistered || c.date);
          return regDate >= start && regDate <= end;
        } catch (e) { return false; }
      });
    }

    getFilteredDefects(startDate, endDate) {
      const defects = this.state.defectLogs || [];
      if (!startDate && !endDate) return defects;

      const start = startDate ? new Date(startDate + 'T00:00:00') : new Date('2020-01-01');
      const end = endDate ? new Date(endDate + 'T23:59:59') : new Date();

      return defects.filter(d => {
        try {
          const rd = new Date(d.reportedDate);
          return rd >= start && rd <= end;
        } catch (e) { return false; }
      });
    }

    // ─── PRODUCT COMPLAINT AGGREGATION ────────────────────

    getProductComplaintSummary() {
      const defects = this.state.defectLogs || [];
      const summary = {};

      defects.forEach(d => {
        const item = d.itemName || 'Unknown';
        if (!summary[item]) {
          summary[item] = { itemName: item, totalQty: 0, faulty: 0, broken: 0, missing: 0, schoolsAffected: new Set() };
        }
        summary[item].totalQty += (parseInt(d.qty) || 1);
        const type = (d.defectType || '').toLowerCase();
        if (type === 'faulty') summary[item].faulty += (parseInt(d.qty) || 1);
        else if (type === 'broken') summary[item].broken += (parseInt(d.qty) || 1);
        else if (type === 'missing') summary[item].missing += (parseInt(d.qty) || 1);
        summary[item].schoolsAffected.add(d.udise || d.schoolName);
      });

      // Convert Sets to counts
      return Object.values(summary).map(s => ({
        ...s,
        schoolsAffected: s.schoolsAffected.size
      })).sort((a, b) => b.totalQty - a.totalQty);
    }

    // ─── HARDWARE INVENTORY (Expected vs Actual) ──────────

    getSchoolHardwareInventory(udise) {
      const school = (this.state.schoolsMaster || []).find(s => s.udise === udise);
      if (!school) return null;

      const labType = (school.labType || 'Hi-Tech Lab').includes('Smart') ? 'SMART_CLASSROOM' : 'HITECH_LAB';
      const catalog = this.hardwareDefs[labType] || [];
      const labCount = school.labCount || 1;

      // Get defects for this school
      const schoolDefects = (this.state.defectLogs || []).filter(d => d.udise === udise);

      const inventory = catalog.map(item => {
        const expected = item.unitQty * labCount;
        const defective = schoolDefects
          .filter(d => d.itemName === item.name)
          .reduce((sum, d) => sum + (parseInt(d.qty) || 0), 0);

        return {
          itemId: item.id,
          itemName: item.name,
          brand: item.brand,
          expected: expected,
          defective: defective,
          working: Math.max(0, expected - defective),
          healthPct: expected > 0 ? Math.round(((expected - defective) / expected) * 100) : 100
        };
      });

      return {
        udise: school.udise,
        schoolName: school.schoolName,
        labCount: labCount,
        labType: labType,
        items: inventory,
        overallHealth: inventory.length > 0 ? Math.round(inventory.reduce((s, i) => s + i.healthPct, 0) / inventory.length) : 100
      };
    }

    // ─── DEFECT LOGGING ───────────────────────────────────

    recordHardwareDefect(udise, defectData) {
      if (!Array.isArray(this.state.defectLogs)) {
        this.state.defectLogs = [];
      }

      const record = Object.assign({
        id: 'DEF_' + Date.now() + '_' + Math.floor(Math.random()*1000),
        udise: udise || 'N/A',
        schoolName: defectData.schoolName || 'School',
        district: defectData.district || 'NAGAPATTINAM',
        labNo: defectData.labNo || 'Lab 1',
        itemName: defectData.itemName || 'Hardware Component',
        defectType: defectData.defectType || 'Faulty',
        qty: parseInt(defectData.qty) || 1,
        remarks: defectData.remarks || '',
        reportedBy: defectData.reportedBy || 'Field Engineer',
        reportedDate: new Date().toISOString().split('T')[0]
      }, defectData);

      this.state.defectLogs.unshift(record);
      this.addAuditLog('HARDWARE_DEFECT', `Defect reported: ${record.qty}x ${record.itemName} at ${record.schoolName}`);
      this.saveLocal();
      return record;
    }

    logDefect(defectData) {
      const udise = (defectData && defectData.udise) ? defectData.udise : 'N/A';
      return this.recordHardwareDefect(udise, defectData);
    }

    deleteHardwareDefect(defectId) {
      if (!Array.isArray(this.state.defectLogs)) return { success: false, message: 'No defect logs found.' };
      const idx = this.state.defectLogs.findIndex(d => d.id === defectId);
      if (idx === -1) return { success: false, message: 'Defect record not found.' };
      const removed = this.state.defectLogs.splice(idx, 1)[0];
      this.addAuditLog('DELETE_DEFECT', `Removed defect record: ${removed.itemName} at ${removed.schoolName}`);
      this.saveLocal();
      return { success: true, message: 'Defect record deleted.' };
    }

    deleteDefect(defectId) {
      return this.deleteHardwareDefect(defectId);
    }
  }

  window.adminStore = new AdminStore();

})(window);
