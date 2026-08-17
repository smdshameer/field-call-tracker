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
      this.storageKey = 'KS_FIELD_TRACKER_ADMIN_STORE_V1';
      this.tnDistricts = TN_DISTRICTS;
      this.hardwareDefs = HARDWARE_CATALOG_DEFS;
      
      this.state = {
        isAdminMode: false,
        adminPasscode: '8899', // Default Admin Master PIN
        activeAdminName: 'State Project Directorate Admin',
        engineers: [],
        districtAllocations: {}, // district -> empId
        schoolsMaster: [],
        schoolAssets: {}, // udise -> assetData
        defectLogs: [],
        auditLogs: []
      };

      this.init();
    }

    init() {
      this.loadLocal();
      if (!this.state.engineers || this.state.engineers.length === 0) {
        this.seedInitialEngineers();
      }
      if (!this.state.schoolsMaster || this.state.schoolsMaster.length === 0) {
        this.seedInitialSchools();
      }
    }

    loadLocal() {
      try {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.state = Object.assign({}, this.state, parsed);
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

    // Seed Tamil Nadu Field Engineers across districts
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
          name: 'Karthikeyan R',
          phone: '9840000002',
          email: 'karthik.field@kssmart.co',
          baseLocation: 'Thiruvarur',
          assignedDistricts: ['THIRUVARUR', 'THANJAVUR'],
          pin: '5700',
          role: 'field_engineer',
          status: 'Active',
          totalCallsResolved: 35
        },
        {
          empId: '571',
          name: 'Saravanan M',
          phone: '9840000003',
          email: 'saravanan.field@kssmart.co',
          baseLocation: 'Cuddalore',
          assignedDistricts: ['CUDDALORE', 'VILLUPURAM'],
          pin: '5710',
          role: 'field_engineer',
          status: 'Active',
          totalCallsResolved: 28
        },
        {
          empId: '572',
          name: 'Prakash K',
          phone: '9840000004',
          email: 'prakash.field@kssmart.co',
          baseLocation: 'Tiruchirappalli',
          assignedDistricts: ['TIRUCHIRAPPALLI', 'ARIYALUR', 'PERAMBALUR'],
          pin: '5720',
          role: 'field_engineer',
          status: 'Active',
          totalCallsResolved: 31
        }
      ];

      this.rebuildDistrictMap();
      this.saveLocal();
    }

    // Seed Tamil Nadu School Master with Administrator-cum-Instructor (AI) Details & Multi-Lab counts
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
          aiName: 'S. Meenakshi',
          aiPhone: '9443215560',
          aiAlsoHandlesUdises: [],
          labCount: 7, // 7 Hi-Tech Labs (70 PCs, 7x 5KVA UPS, 98 Batteries)
          labType: 'Hi-Tech Lab'
        },
        {
          udise: '33190500101',
          schoolName: 'GHSS VEDARANYAM BOYS',
          category: 'HSS',
          district: 'NAGAPATTINAM',
          block: 'Vedaranyam',
          aiName: 'V. Murugan',
          aiPhone: '9842109844',
          aiAlsoHandlesUdises: [],
          labCount: 9, // 9 Hi-Tech Labs (90 PCs, 9x 5KVA UPS, 126 Batteries)
          labType: 'Hi-Tech Lab'
        },
        {
          udise: '33190400101',
          schoolName: 'PUPS VELANKANNI PRIMARY',
          category: 'PUPS',
          district: 'NAGAPATTINAM',
          block: 'Keezhaiyur',
          aiName: 'A. Mary Stella',
          aiPhone: '9787654321',
          aiAlsoHandlesUdises: [],
          labCount: 1,
          labType: 'Smart Classroom'
        }
      ];

      this.saveLocal();
    }

    rebuildDistrictMap() {
      this.state.districtAllocations = {};
      this.state.engineers.forEach(eng => {
        if (eng.status === 'Active' && Array.isArray(eng.assignedDistricts)) {
          eng.assignedDistricts.forEach(dist => {
            this.state.districtAllocations[dist.toUpperCase()] = eng.empId;
          });
        }
      });
    }

    // Get Assigned Engineer for a given District
    getEngineerForDistrict(districtName) {
      if (!districtName) return null;
      const normalized = districtName.trim().toUpperCase();
      const empId = this.state.districtAllocations[normalized];
      if (empId) {
        return this.state.engineers.find(e => e.empId === empId) || null;
      }
      return null;
    }

    // Assign Districts to a specific Field Engineer
    assignDistrictsToEngineer(empId, districtList) {
      const eng = this.state.engineers.find(e => e.empId === empId);
      if (!eng) return { success: false, message: 'Engineer not found' };

      const formatted = districtList.map(d => d.trim().toUpperCase());
      eng.assignedDistricts = formatted;
      this.rebuildDistrictMap();
      this.logAudit(`Assigned Districts [${formatted.join(', ')}] to ${eng.name} (Emp: ${empId})`);
      this.saveLocal();
      return { success: true, engineer: eng };
    }

    // Reset Engineer PIN / Password
    resetEngineerPin(empId, newPin) {
      const eng = this.state.engineers.find(e => e.empId === empId);
      if (!eng) return { success: false, message: 'Engineer not found' };
      if (!newPin || String(newPin).length < 4) {
        return { success: false, message: 'PIN must be at least 4 digits' };
      }

      eng.pin = String(newPin);
      this.logAudit(`Reset Login PIN for ${eng.name} (Emp ID: ${empId}) to ${newPin}`);
      this.saveLocal();
      return { success: true, message: `Login PIN for ${eng.name} successfully updated to ${newPin}` };
    }

    // Calculate Standard Expected Hardware for a School with Multi-Lab Multiplier
    getStandardAssetsForSchool(schoolOrUdise) {
      let school = null;
      if (typeof schoolOrUdise === 'string') {
        school = this.state.schoolsMaster.find(s => s.udise === schoolOrUdise);
      } else {
        school = schoolOrUdise;
      }

      const category = (school && school.category) ? school.category.toUpperCase() : 'PUMS';
      const labCount = (school && school.labCount && school.labCount > 0) ? parseInt(school.labCount) : 1;
      const isSmartClass = category === 'PUPS';

      const defs = isSmartClass ? this.hardwareDefs.SMART_CLASSROOM : this.hardwareDefs.HITECH_LAB;
      
      const calculatedItems = defs.map(item => {
        const multiplier = isSmartClass ? 1 : labCount;
        const totalExpected = item.unitQty * multiplier;
        return {
          id: item.id,
          name: item.name,
          brand: item.brand,
          desc: item.desc,
          unit: item.unit,
          perLabQty: item.unitQty,
          labCount: multiplier,
          standardExpectedQty: totalExpected,
          workingQty: totalExpected,
          faultyQty: 0,
          brokenQty: 0,
          missingQty: 0
        };
      });

      return {
        udise: school ? school.udise : '',
        schoolName: school ? school.schoolName : '',
        category: category,
        labCount: labCount,
        isSmartClass: isSmartClass,
        items: calculatedItems
      };
    }

    // Record Chain-Reaction Hardware Defect reported by Field Engineer
    recordHardwareDefect(udise, defectData) {
      if (!udise) return;
      const record = {
        id: 'DEF_' + Date.now() + '_' + Math.floor(Math.random()*1000),
        udise: udise,
        schoolName: defectData.schoolName || '',
        district: defectData.district || 'NAGAPATTINAM',
        labNo: defectData.labNo || 'Lab 1',
        itemName: defectData.itemName,
        defectType: defectData.defectType, // 'Faulty' | 'Broken' | 'Missing'
        qty: parseInt(defectData.qty) || 1,
        reportedBy: defectData.reportedBy || 'Field Engineer',
        reportedDate: new Date().toLocaleDateString('en-GB'),
        remarks: defectData.remarks || '',
        status: 'Pending Replacement'
      };

      this.state.defectLogs.unshift(record);
      this.logAudit(`Reported Defect: ${record.qty}x ${record.itemName} (${record.defectType}) at ${record.schoolName} (${record.labNo})`);
      this.saveLocal();
      return record;
    }

    // Ingest Multi-District Calls and Auto-Allocate to Engineers
    allocateBulkCalls(rawCalls) {
      if (!Array.isArray(rawCalls)) return { total: 0, allocated: 0, unallocated: 0 };
      
      let allocatedCount = 0;
      let unallocatedCount = 0;

      const processed = rawCalls.map(c => {
        const district = (c.district || 'NAGAPATTINAM').trim().toUpperCase();
        const eng = this.getEngineerForDistrict(district);

        if (eng) {
          c.assignedEngineerId = eng.empId;
          c.assignedEngineerName = eng.name;
          allocatedCount++;
        } else {
          c.assignedEngineerId = 'UNASSIGNED';
          c.assignedEngineerName = 'Unassigned District';
          unallocatedCount++;
        }

        // Enrich School Category & AI Info if in directory
        const school = this.state.schoolsMaster.find(s => s.udise === c.udise);
        if (school) {
          c.schoolCategory = school.category;
          c.aiTeacherName = school.aiName;
          c.aiTeacherPhone = school.aiPhone;
          c.labCount = school.labCount;
        }

        return c;
      });

      this.logAudit(`Bulk Ingested ${rawCalls.length} calls: ${allocatedCount} auto-assigned to engineers, ${unallocatedCount} unassigned.`);
      this.saveLocal();
      return { total: rawCalls.length, allocated: allocatedCount, unallocated: unallocatedCount, calls: processed };
    }

    logAudit(actionText) {
      const log = {
        timestamp: Date.now(),
        dateStr: new Date().toLocaleString('en-GB'),
        admin: this.state.activeAdminName,
        action: actionText
      };
      this.state.auditLogs.unshift(log);
      if (this.state.auditLogs.length > 200) {
        this.state.auditLogs = this.state.auditLogs.slice(0, 200);
      }
    }
  }

  window.adminStore = new AdminStore();

})(window);
