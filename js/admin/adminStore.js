/**
 * KS Smart Solutions - Statewide Admin Store (adminStore.js)
 * Tamil Nadu School ICT / Smart Classroom / Hi-Tech Lab Field Operations
 */

(function(window) {
  'use strict';

  // Standard 38 Districts of Tamil Nadu
  const TN_DISTRICTS = [
    'NAGAPATTINAM', 'MAYILADUTHURAI', 'THIRUVARUR', 'THANJAVUR', 'CUDDALORE',
    'ARIYALUR', 'PERAMBALUR', 'TIRUCHIRAPPALLI', 'PUDUKKOTTAI', 'MADURAI',
    'DINDIGUL', 'THENI', 'RAMANATHAPURAM', 'SIVAGANGA', 'VIRUDHUNAGAR',
    'TIRUNELVELI', 'TENKASI', 'THOOTHUKUDI', 'KANYAKUMARI', 'SALEM',
    'NAMAKKAL', 'DHARMAPURI', 'KRISHNAGIRI', 'ERODE', 'TIRUPPUR',
    'COIMBATORE', 'NILGIRIS', 'VELLORE', 'RANIPET', 'TIRUPATTUR',
    'TIRUVANNAMALAI', 'VILLUPURAM', 'KALLAKURICHI', 'KANCHIPURAM', 'CHENGALPATTU',
    'TIRUVALLUR', 'CHENNAI'
  ];

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
          status: 'Active',
          totalCallsResolved: 42
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
          status: 'Active',
          totalCallsResolved: 35
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
          status: 'Active',
          totalCallsResolved: 28
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
          status: 'Active',
          totalCallsResolved: 31
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

    assignDistrictsToEngineer(empId, districtsArray) {
      const eng = (this.state.engineers || []).find(e => e.empId === empId);
      if (!eng) return { success: false, message: 'Engineer not found' };

      eng.assignedDistricts = (districtsArray || []).map(d => d.toUpperCase().trim());
      this.rebuildDistrictMap();
      this.saveLocal();
      return { success: true, message: `Districts assigned to ${eng.name} successfully!` };
    }

    resetEngineerPin(empId, newPin) {
      const eng = (this.state.engineers || []).find(e => e.empId === empId);
      if (!eng) return { success: false, message: 'Engineer not found' };
      eng.pin = (newPin || '1234').toString().trim();
      this.saveLocal();
      return { success: true, message: `PIN reset successfully to ${eng.pin} for ${eng.name}` };
    }

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
      this.saveLocal();
      return record;
    }
  }

  window.adminStore = new AdminStore();

})(window);
