/**
 * Field Call Tracker - CSV Export, Import & Print Module
 */

class FieldCallExporter {
  constructor() {
    this.init();
  }

  init() {
    this.bindEvents();
    setTimeout(() => {
      this.updateDailyReportText();
    }, 150);
  }

  getCallsData() {
    if (window.appStore && Array.isArray(window.appStore.calls) && window.appStore.calls.length > 0) {
      return window.appStore.calls;
    }
    if (Array.isArray(window.INITIAL_FIELD_CALLS) && window.INITIAL_FIELD_CALLS.length > 0) {
      return window.INITIAL_FIELD_CALLS;
    }
    try {
      const saved = localStorage.getItem('NAGAPATTINAM_FIELD_CALLS_V1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return [];
  }

  openShareModal() {
    this.updateDailyReportText();
    const shareModalOverlay = document.getElementById('shareModalOverlay');
    if (shareModalOverlay) {
      shareModalOverlay.classList.add('active');
      shareModalOverlay.style.opacity = '1';
      shareModalOverlay.style.visibility = 'visible';
      shareModalOverlay.style.pointerEvents = 'auto';
    }
    setTimeout(() => {
      this.updateDailyReportText();
    }, 60);
  }

  bindEvents() {
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    if (exportExcelBtn && !exportExcelBtn._hasExporterListener) {
      exportExcelBtn._hasExporterListener = true;
      exportExcelBtn.addEventListener('click', () => this.exportToExcel());
    }

    const downloadExcelReportBtn = document.getElementById('downloadExcelReportBtn');
    if (downloadExcelReportBtn && !downloadExcelReportBtn._hasExporterListener) {
      downloadExcelReportBtn._hasExporterListener = true;
      downloadExcelReportBtn.addEventListener('click', () => this.exportToExcel());
    }

    const downloadWeeklyEscalationsExcelBtn = document.getElementById('downloadWeeklyEscalationsExcelBtn');
    if (downloadWeeklyEscalationsExcelBtn && !downloadWeeklyEscalationsExcelBtn._hasExporterListener) {
      downloadWeeklyEscalationsExcelBtn._hasExporterListener = true;
      downloadWeeklyEscalationsExcelBtn.addEventListener('click', () => this.exportWeeklyMissingMaterialsExcel());
    }

    const resetDataBtn = document.getElementById('resetDataBtn');
    if (resetDataBtn && !resetDataBtn._hasExporterListener) {
      resetDataBtn._hasExporterListener = true;
      resetDataBtn.addEventListener('click', () => {
        if (typeof window._resetAllAppData === 'function') {
          window._resetAllAppData();
        } else if (window.appStore) {
          window.appStore.deleteAllCalls();
        }
      });
    }

    // Daily Report Modal Trigger
    const shareReportBtn = document.getElementById('shareReportBtn');
    const shareModalOverlay = document.getElementById('shareModalOverlay');
    const closeShareModal = document.getElementById('closeShareModal');
    const copyWhatsappBtn = document.getElementById('copyWhatsappBtn');
    const copyEmailBtn = document.getElementById('copyEmailBtn');

    if (shareReportBtn && !shareReportBtn._hasExporterListener) {
      shareReportBtn._hasExporterListener = true;
      shareReportBtn.addEventListener('click', () => this.openShareModal());
    }

    if (closeShareModal && !closeShareModal._hasExporterListener) {
      closeShareModal._hasExporterListener = true;
      closeShareModal.addEventListener('click', () => {
        if (shareModalOverlay) shareModalOverlay.classList.remove('active');
      });
    }

    if (copyWhatsappBtn && !copyWhatsappBtn._hasExporterListener) {
      copyWhatsappBtn._hasExporterListener = true;
      copyWhatsappBtn.addEventListener('click', () => {
        if (typeof window.copyDailyWhatsappReport === 'function') {
          window.copyDailyWhatsappReport();
        } else {
          const reportEl = document.getElementById('dailyReportText');
          const text = reportEl ? reportEl.value : '';
          this.fallbackCopyText(text);
        }
      });
    }

    if (copyEmailBtn && !copyEmailBtn._hasExporterListener) {
      copyEmailBtn._hasExporterListener = true;
      copyEmailBtn.addEventListener('click', () => {
        const text = document.getElementById('dailyReportText').value;
        const subject = encodeURIComponent(`Nagapattinam Field Calls Daily Report - ${new Date().toLocaleDateString('en-IN')}`);
        const body = encodeURIComponent(text);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
      });
    }
  }

  bindCustomReportFilters() {
    ['reportFilterEngineer', 'reportFilterDistrict', 'reportFilterBlock', 'reportFilterCategory', 'reportFilterUdise'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el._hasCustomFilterListener) {
        el._hasCustomFilterListener = true;
        el.addEventListener('input', () => this.generateCustomMasterReport());
        el.addEventListener('change', () => this.generateCustomMasterReport());
      }
    });
  }

  generateCustomMasterReport() {
    const engQuery = (document.getElementById('reportFilterEngineer')?.value || '').toLowerCase().trim();
    const distQuery = (document.getElementById('reportFilterDistrict')?.value || '').toLowerCase().trim();
    const blockQuery = (document.getElementById('reportFilterBlock')?.value || '').toLowerCase().trim();
    const catQuery = (document.getElementById('reportFilterCategory')?.value || '').toLowerCase().trim();
    const udiseQuery = (document.getElementById('reportFilterUdise')?.value || '').toLowerCase().trim();

    let calls = this.getCallsData();

    if (engQuery && engQuery !== 'all') {
      calls = calls.filter(c => (c.visitedBy || '').toLowerCase().includes(engQuery) || (c.aiName || '').toLowerCase().includes(engQuery));
    }
    if (distQuery && distQuery !== 'all') {
      calls = calls.filter(c => (c.district || 'Nagapattinam').toLowerCase().includes(distQuery));
    }
    if (blockQuery && blockQuery !== 'all') {
      calls = calls.filter(c => (c.block || '').toLowerCase().includes(blockQuery));
    }
    if (catQuery && catQuery !== 'all') {
      calls = calls.filter(c => (c.category || '').toLowerCase().includes(catQuery));
    }
    if (udiseQuery) {
      calls = calls.filter(c => String(c.udise).includes(udiseQuery) || (c.schoolName || '').toLowerCase().includes(udiseQuery));
    }

    const todayFormatted = new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const user = window.authStore ? window.authStore.currentUser : null;
    const adminName = user ? user.name : 'Reporting Head Admin';

    const completed = calls.filter(c => c.status === 'Completed');
    const pending = calls.filter(c => c.status !== 'Completed');
    const missingMaterialCalls = calls.filter(c => (c.missingMaterials && c.missingMaterials.trim()) || c.escalationFlag === 'MATERIAL_REQUIRED');

    let report = `🏆 *KS SMART SOLUTIONS - REPORTING HEAD CUSTOM MASTER AUDIT* 🏆\n`;
    report += `📅 *Date:* ${todayFormatted}\n`;
    report += `👑 *Generated By:* ${adminName} (Reporting Head)\n`;
    report += `🔍 *Filters:* Engineer: ${engQuery || 'ALL'} | District: ${distQuery || 'ALL'} | Block: ${blockQuery || 'ALL'} | Category: ${catQuery || 'ALL'}\n`;
    report += `--------------------------------------------------------\n`;
    report += `📊 *SUMMARY KPI SNAPSHOT:*\n`;
    report += `• Total Matching Calls: *${calls.length}*\n`;
    report += `• Completed Calls: *${completed.length}* (${calls.length ? Math.round(completed.length/calls.length*100) : 0}%)\n`;
    report += `• Pending / In Progress: *${pending.length}*\n`;
    report += `• Missing Materials Reported: *${missingMaterialCalls.length}*\n\n`;

    if (missingMaterialCalls.length > 0) {
      report += `📦 *MISSING MATERIALS AUDIT:* \n`;
      missingMaterialCalls.forEach((c, idx) => {
        report += `${idx + 1}. *${c.schoolName}* (UDISE: ${c.udise})\n   • Missing Item: _${c.missingMaterials || 'Material Replacement Required'}_\n   • Assigned Engineer: ${c.visitedBy || 'Unassigned'}\n`;
      });
      report += `\n`;
    }

    report += `📋 *CALL RECORDS DETAIL (${calls.length} Total):*\n`;
    calls.forEach((c, idx) => {
      report += `${idx + 1}. *${c.schoolName}* (${c.udise})\n   • Status: ${c.status} | Age: ${c.ageDays}d\n   • Engineer: ${c.visitedBy || 'Unassigned'} | Category: ${c.category || '-'}\n   • Issue: ${c.issue || '-'}\n`;
      if (c.actionTaken) report += `   • Action Taken: _${c.actionTaken}_\n`;
    });

    const reportEl = document.getElementById('customReportText');
    if (reportEl) reportEl.value = report;
    return report;
  }

  copyCustomReportText() {
    const el = document.getElementById('customReportText');
    const text = (el && el.value.trim()) ? el.value : this.generateCustomMasterReport();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        alert('✅ Custom Master Report copied to clipboard for WhatsApp!');
      }).catch(() => {
        this.fallbackCopyCustomText(text);
      });
    } else {
      this.fallbackCopyCustomText(text);
    }
  }

  fallbackCopyCustomText(text) {
    const el = document.getElementById('customReportText');
    if (el) {
      el.select();
      document.execCommand('copy');
      alert('✅ Custom Master Report copied to clipboard!');
    }
  }

  exportCustomExcel() {
    const engQuery = (document.getElementById('reportFilterEngineer')?.value || '').toLowerCase().trim();
    const distQuery = (document.getElementById('reportFilterDistrict')?.value || '').toLowerCase().trim();
    const blockQuery = (document.getElementById('reportFilterBlock')?.value || '').toLowerCase().trim();
    const udiseQuery = (document.getElementById('reportFilterUdise')?.value || '').toLowerCase().trim();

    let calls = this.getCallsData();

    if (engQuery && engQuery !== 'all') {
      calls = calls.filter(c => (c.visitedBy || '').toLowerCase().includes(engQuery));
    }
    if (distQuery && distQuery !== 'all') {
      calls = calls.filter(c => (c.district || 'Nagapattinam').toLowerCase().includes(distQuery));
    }
    if (blockQuery && blockQuery !== 'all') {
      calls = calls.filter(c => (c.block || '').toLowerCase().includes(blockQuery));
    }
    if (udiseQuery) {
      calls = calls.filter(c => String(c.udise).includes(udiseQuery) || (c.schoolName || '').toLowerCase().includes(udiseQuery));
    }

    if (typeof XLSX === 'undefined') {
      alert('XLSX library loading... please retry in a moment.');
      return;
    }

    const dataRows = calls.map((c, idx) => ({
      'S.No': idx + 1,
      'UDISE Code': c.udise,
      'School Name': c.schoolName,
      'District': c.district || 'Nagapattinam',
      'Block': c.block || '',
      'Issue Description': c.issue || '',
      'Category': c.category || '',
      'Status': c.status || '',
      'Age (Days)': c.ageDays || 0,
      'Assigned Engineer': c.visitedBy || 'Unassigned',
      'Action Taken': c.actionTaken || '',
      'Missing Materials': c.missingMaterials || '',
      'Spares Used': c.materialsUsed || '',
      'HM Name': c.hmName || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master Report");
    XLSX.writeFile(wb, `Custom_Master_Field_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  fallbackCopyText(text) {
    if (typeof window.copyTextToClipboard === 'function') {
      const el = document.getElementById('dailyReportText');
      window.copyTextToClipboard(text, el, '✅ Daily Executive Report copied to clipboard!\n\nYou can now paste it directly into WhatsApp.');
      return;
    }
    const el = document.getElementById('dailyReportText');
    if (el) {
      el.removeAttribute('readonly');
      el.focus();
      el.select();
      el.setSelectionRange(0, 999999);
      el.setAttribute('readonly', 'true');
      document.execCommand('copy');
      alert('✅ Daily Report copied to clipboard!');
    }
  }

  isCallCompletedToday(c) {
    if (!c) return false;
    const status = String(c.status || '').trim().toLowerCase();
    if (status !== 'completed') return false;

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayISO = `${y}-${m}-${d}`;
    const todayIN = `${d}/${m}/${y}`;
    const todayDash = `${d}-${m}-${y}`;

    const dc = String(c.dateClosed || '').trim();
    if (!dc) {
      const tr = String(c.ticketRaisedOn || '').trim();
      if (tr === todayISO || tr === todayIN || tr === todayDash) return true;
      return true;
    }

    if (dc === todayISO || dc === todayIN || dc === todayDash || dc.includes(todayISO)) {
      return true;
    }

    try {
      const parsed = new Date(dc);
      if (!isNaN(parsed.getTime())) {
        return parsed.toDateString() === now.toDateString();
      }
    } catch(e) {}

    return false;
  }

  generateDailyReportText() {
    if (typeof window.generateAndPopulateDailyReport === 'function') {
      return window.generateAndPopulateDailyReport();
    }
    const S = (v, def = '') => (v !== null && v !== undefined) ? String(v).trim() : def;
    const N = (v, def = 0) => {
      const parsed = parseFloat(v);
      return isNaN(parsed) ? def : parsed;
    };

    const calls = this.getCallsData() || [];
    const todayFormatted = new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const user = window.authStore ? window.authStore.currentUser : null;
    const engineerName = user ? S(user.name, 'Mohamed Shameer') : 'Mohamed Shameer';
    const engineerEmpId = user ? S(user.empId, '569') : '569';
    const engineerEmail = user ? S(user.email, 'smssiddiq2011@gmail.com') : 'smssiddiq2011@gmail.com';
    const engineerDistrict = user ? S(user.district, 'Nagapattinam') : 'Nagapattinam';

    const total = calls.length;
    const todayCompleted = calls.filter(c => this.isCallCompletedToday(c));
    const inProgress = calls.filter(c => S(c.status) === 'In Progress');
    const notStarted = calls.filter(c => S(c.status) === 'Not Started' || !c.status);
    const incomplete = calls.filter(c => S(c.status) === 'Incomplete');

    const conveyanceRate = user ? N(user.conveyanceRate, 5) : 5;
    const dailyTargetGoal = user ? N(user.dailyTargetGoal, 3) : 3;

    const totalDistance = todayCompleted.reduce((sum, c) => sum + N(c.distanceKm), 0);
    const totalConveyance = todayCompleted.reduce((sum, c) => sum + N(c.conveyanceCost || (N(c.distanceKm) * conveyanceRate)), 0);
    const totalOwnCash = todayCompleted.reduce((sum, c) => sum + N(c.ownCashSpent), 0);

    // Block Breakdown
    const blocks = ['Nagapattinam', 'Kelvelur', 'Thirumarugal', 'Vedaranyam', 'Thalainayar', 'Keezhaiyur'];
    let blockSummary = '';
    blocks.forEach(b => {
      const bCalls = calls.filter(c => S(c.block) === b);
      const bComp = todayCompleted.filter(c => S(c.block) === b).length;
      blockSummary += `  • *${b}:* ${bComp} Completed Today (${bCalls.length} Total Tickets)\n`;
    });

    // Detailed Completed Calls Log
    let completedLogText = '';
    let hmSignedCount = 0;
    if (todayCompleted.length > 0) {
      completedLogText = todayCompleted.map((c, idx) => {
        const rawMaterials = S(c.materialsUsed);
        const spares = rawMaterials ? rawMaterials : 'None';
        const cashSpentVal = N(c.ownCashSpent);
        const rawReason = S(c.ownCashReason);
        const reasonStr = rawReason ? ` *(For: ${rawReason})*` : '';
        const cashSpent = cashSpentVal > 0 ? `*₹${cashSpentVal.toLocaleString('en-IN')}*${reasonStr}` : '₹0 (No cash spent)';
        const rawAction = S(c.actionTaken);
        const action = rawAction ? rawAction : 'Hi-Tech Lab Equipment Serviced & Verified';
        const rawCat = S(c.category);
        const categoryStr = rawCat ? rawCat : 'HELPLINE TICKET';
        
        const hmSignedStr = c.hmSignedSheet ? 'Attached ✅' : 'Pending ⚠️';
        if (c.hmSignedSheet) hmSignedCount++;

        const hmNameStr = S(c.hmName) ? ` (HM: ${S(c.hmName)})` : '';
        const rawRemark = S(c.remark);
        const remarkStr = rawRemark ? rawRemark : 'All equipments working fine';
        const distVal = (c.distanceKm !== null && c.distanceKm !== undefined && !isNaN(N(c.distanceKm))) ? `${c.distanceKm} km` : '0 km';

        return `${idx + 1}. *${S(c.schoolName, 'School')}* (*${S(c.block, 'Nagapattinam')} Block* | *${categoryStr}*)
   • *UDISE Code:* ${S(c.udise, 'N/A')}
   • *Issue Reported:* ${S(c.issue, 'N/A')}
   • *Action Taken to Rectify:* ${action}
   • *Spares Replaced:* ${spares}
   • *Own Cash Spent for Spares:* ${cashSpent}
   • *Remark:* ${remarkStr}
   • *School HM Signed Sheet:* ${hmSignedStr}${hmNameStr}
   • *Inter-School Distance:* ${distVal}
   • *Field Engineer:* ${S(c.visitedBy, engineerName)} | *Date Closed:* ${S(c.dateClosed, todayFormatted)}`;
      }).join('\n\n');
    } else {
      completedLogText = '  - No completed calls recorded for today yet.\n  (Complete a call log with Action Taken and HM Signature to record completed visits in real-time).';
    }

    const companyName = user ? S(user.companyName, 'KS SMART SOLUTIONS') : 'KS SMART SOLUTIONS';
    const projectName = user ? S(user.projectName, 'TAMIL NADU SCHOOL PROJECT') : 'TAMIL NADU SCHOOL PROJECT';
    const transportMode = user ? S(user.vehicleType, 'Own Bike') : 'Own Bike';
    const vehicleNoStr = (user && S(user.vehicleNo)) ? ` (${S(user.vehicleNo)})` : '';

    const homeLocation = user ? S(user.homeBaseLocation, `${engineerDistrict}, Tamil Nadu 611001`) : `${engineerDistrict}, Tamil Nadu 611001`;
    const targetStatusStr = todayCompleted.length >= dailyTargetGoal 
      ? `*${todayCompleted.length} / ${dailyTargetGoal} Calls Completed Today (100% Target Met)* ✅` 
      : `*${todayCompleted.length} / ${dailyTargetGoal} Calls Completed Today (${dailyTargetGoal - todayCompleted.length} remaining to reach target)* ⚠️`;

    // Escalations & Blockers Block for Management / Vendor Action
    const escalatedCalls = calls.filter(c => (S(c.escalationFlag) && S(c.escalationFlag) !== 'NONE') || S(c.missingMaterials));
    let escalationBlock = '';
    if (escalatedCalls.length > 0) {
      escalationBlock = `\n\n============================================\n*🚨 ESCALATIONS & ACTIONS REQUIRED FROM MANAGEMENT / VENDOR (${escalatedCalls.length}):*\n--------------------------------------------\n` + 
      escalatedCalls.map((c, i) => {
        let flagLabel = 'Action Required';
        const flag = S(c.escalationFlag);
        if (flag === 'INSTALLATION_PENDING') flagLabel = '📦 Requires Installation Team Action (UPS/Wiring Pending)';
        else if (flag === 'MATERIAL_REQUIRED') flagLabel = '🛒 Material / Spares Needed from Vendor';
        else if (flag === 'VENDOR_REPLACEMENT') flagLabel = '⚠️ Vendor Replacement Required';
        else if (flag === 'ADDITIONAL_ISSUE') flagLabel = '🔍 Additional On-Site Issues Reported';
        else if (S(c.missingMaterials)) flagLabel = '🛒 Material / Spares Needed';
        
        return `${i + 1}. *${S(c.schoolName, 'School')}* (UDISE: ${S(c.udise, 'N/A')})\n   • *Issue Reported:* ${S(c.issue, 'N/A')}\n   • *Escalation Type:* ${flagLabel}\n   • *Details / Missing Items:* ${S(c.missingMaterials) || S(c.reasonIncomplete) || S(c.actionTaken) || 'Awaiting vendor/team support'}`;
      }).join('\n\n');
    }

    return `*🏢 ${companyName.toUpperCase()} - ${projectName.toUpperCase()}*
*📊 DAILY FIELD EXECUTIVE EVENING REPORT*
*📅 Date:* ${todayFormatted}
*📍 District:* ${engineerDistrict} | *🏠 Home Base:* ${homeLocation}
*👷 Field Engineer:* ${engineerName} (*Emp ID:* ${engineerEmpId} | ${engineerEmail})
*🏍️ Transport:* ${transportMode}${vehicleNoStr} (Reimbursement @ ₹${conveyanceRate}/km)
============================================

*🎯 TODAY'S TARGET STATUS (MIN ${dailyTargetGoal} CALLS/DAY):*
• ${targetStatusStr}
• *HM Signed Report Sheets:* *${hmSignedCount} / ${todayCompleted.length > 0 ? todayCompleted.length : 1} Attached*

*📈 EXECUTIVE TICKETING SUMMARY:*
• *Total Field Tickets:* ${total}
• *Today's Completed Calls:* *${todayCompleted.length}*
• *In Progress:* ${inProgress.length}
• *Not Started / Pending:* ${notStarted.length}
• *Incomplete:* ${incomplete.length}

*💰 TODAY'S BIKE CONVEYANCE & EXPENSES:*
• *Total Inter-School Distance Today:* *${totalDistance} km*
• *Total Conveyance Claim Today:* *₹${totalConveyance.toLocaleString('en-IN')}* (at ₹${conveyanceRate}/km)
• *Total Own Cash Spent on Spares:* *₹${totalOwnCash.toLocaleString('en-IN')}*

*📍 BLOCK-WISE TODAY'S PROGRESS:*
${blockSummary.trimEnd()}
${escalationBlock}

============================================
*🛠️ TODAY'S COMPLETED CALLS - ACTION, SPARES & HM SIGNATURE LOG (${todayCompleted.length} Call(s)):*
--------------------------------------------
${completedLogText}

--------------------------------------------
*Report generated automatically in real-time via KS Smart Solutions Field Call Tracker.*`;
  }

  updateDailyReportText() {
    try {
      const text = this.generateDailyReportText();
      const reportArea = document.getElementById('dailyReportText');
      if (reportArea) {
        reportArea.value = text;
        reportArea.textContent = text;
      }
      this.renderSingleCallCards();
    } catch(err) {
      console.error('Error generating daily report text:', err);
    }
  }

  generateConveyanceClaimText() {
    const calls = this.getCallsData();
    const todayCompleted = calls.filter(c => this.isCallCompletedToday(c));
    const user = window.authStore ? window.authStore.currentUser : null;
    const companyName = user ? (user.companyName || 'KS SMART SOLUTIONS') : 'KS SMART SOLUTIONS';
    const engineerName = user ? (user.name || 'Mohamed Shameer') : 'Mohamed Shameer';
    const engineerEmpId = user ? (user.empId || '569') : '569';
    const engineerDistrict = user ? (user.district || 'Nagapattinam') : 'Nagapattinam';
    const transportMode = user ? (user.vehicleType || 'Own Bike') : 'Own Bike';
    const conveyanceRate = user ? (user.conveyanceRate || 5) : 5;
    const vehicleNoStr = user && user.vehicleNo ? ` (${user.vehicleNo})` : '';
    const todayFormatted = new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

    const totalDistance = todayCompleted.reduce((sum, c) => sum + (parseFloat(c.distanceKm) || 0), 0);
    const totalConveyance = todayCompleted.reduce((sum, c) => sum + (parseFloat(c.conveyanceCost) || ((parseFloat(c.distanceKm) || 0) * conveyanceRate) || 0), 0);
    const totalOwnCash = todayCompleted.reduce((sum, c) => sum + (parseFloat(c.ownCashSpent) || 0), 0);
    const grandTotalClaim = totalConveyance + totalOwnCash;

    let routeSequenceText = '';
    if (todayCompleted.length > 0) {
      routeSequenceText = todayCompleted.map((c, idx) => {
        const kmStr = c.distanceKm ? ` (${c.distanceKm} km)` : '';
        return `  ${idx + 1}. *${c.schoolName}* [${c.block} Block]${kmStr}`;
      }).join('\n');
    } else {
      routeSequenceText = '  - No completed calls recorded for today yet.';
    }

    const hmSignedCount = todayCompleted.filter(c => c.hmSignedSheet).length;

    return `*🏢 ${companyName.toUpperCase()} - PETROL CONVEYANCE REIMBURSEMENT CLAIM*
*📅 Date:* ${todayFormatted}
*👷 Field Engineer:* ${engineerName} (*Emp ID:* ${engineerEmpId} | ${engineerDistrict} District)
*🏍️ Transport:* ${transportMode}${vehicleNoStr} | *Rate:* ₹${conveyanceRate}/km
============================================

*📍 TODAY'S TRAVEL ROUTE (${todayCompleted.length} CALLS COMPLETED):*
${routeSequenceText}

============================================
*💰 REIMBURSEMENT CLAIM BREAKDOWN:*
• *Total Distance Traveled Today:* *${totalDistance} km*
• *Petrol Conveyance Expense:* *₹${totalConveyance.toLocaleString('en-IN')}* (${totalDistance} km × ₹${conveyanceRate}/km)
• *Own Cash Spent for Spares:* *₹${totalOwnCash.toLocaleString('en-IN')}*
--------------------------------------------
*💵 TOTAL AMOUNT CLAIMED:* *₹${grandTotalClaim.toLocaleString('en-IN')}*
============================================
• *HM Signed Report Sheets:* *${hmSignedCount} / ${todayCompleted.length > 0 ? todayCompleted.length : 1} Attached* ✅

*Submitted for approval to Reporting Manager.*`;
  }

  copyConveyanceClaimText() {
    const text = this.generateConveyanceClaimText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        alert('✅ Petrol Conveyance Claim Message copied to clipboard!\n\nYou can now paste it directly into WhatsApp for your Reporting Head.');
      });
    } else {
      this.fallbackCopyText(text);
    }
  }

  switchShareTab(tab) {
    if (typeof window.switchShareTab === 'function') {
      window.switchShareTab(tab);
    } else {
      const summaryView = document.getElementById('shareSummaryView');
      const singleView = document.getElementById('shareSingleView');
      const btnSummary = document.getElementById('shareTabSummaryBtn');
      const btnSingle = document.getElementById('shareTabSingleBtn');

      if (tab === 'single') {
        if (summaryView) summaryView.style.display = 'none';
        if (singleView) singleView.style.display = 'block';
        if (btnSummary) { btnSummary.className = 'btn btn-sm btn-outline'; }
        if (btnSingle) { btnSingle.className = 'btn btn-sm btn-primary'; }
        this.renderSingleCallCards();
      } else {
        if (summaryView) summaryView.style.display = 'block';
        if (singleView) singleView.style.display = 'none';
        if (btnSummary) { btnSummary.className = 'btn btn-sm btn-primary'; }
        if (btnSingle) { btnSingle.className = 'btn btn-sm btn-outline'; }
      }
    }
  }

  generateSingleCallWhatsappText(c) {
    if (typeof window.generateSingleCallWhatsappText === 'function') {
      return window.generateSingleCallWhatsappText(c);
    }
    if (!c) return '';
    const S = (v, def = '') => (v !== null && v !== undefined && String(v).trim() !== '') ? String(v).trim() : def;
    const user = window.authStore ? window.authStore.currentUser : null;
    const district = (S(c.district) || (user ? S(user.district) : '') || 'NAGAPATTINAM').toUpperCase();
    const rawSpares = S(c.materialsUsed);
    const sparesStr = rawSpares ? `. Spares: ${rawSpares}` : '';
    const rawAction = S(c.actionTaken);
    const actionText = rawAction ? rawAction : 'Hi-Tech Lab Equipment Serviced & Verified';
    const rectifiedText = `${actionText}${sparesStr}`;
    let remarkText = S(c.remark) ? S(c.remark) : 'All equipments working fine';
    if (!remarkText.endsWith('.')) remarkText += '.';

    return `1.UDISE CODE : ${S(c.udise, 'N/A')}

2.DISTRICT: ${district}

3.BLOCK : ${S(c.block, 'N/A')}

4.SCHOOL NAME : ${S(c.schoolName, 'N/A')}

5.ISSUE : ${S(c.issue, 'N/A')}

6.RECTIFIED : ${rectifiedText}

7.REMARK : ${remarkText}`;
  }

  renderSingleCallCards() {
    if (typeof window.renderSingleCallCards === 'function') {
      window.renderSingleCallCards();
      return;
    }
    const container = document.getElementById('singleCallShareContainer');
    if (!container) return;

    const calls = this.getCallsData() || [];
    const todayCompleted = calls.filter(c => this.isCallCompletedToday(c));
    let displayCalls = todayCompleted;

    const tabSingleBtn = document.getElementById('shareTabSingleBtn');
    if (tabSingleBtn) {
      tabSingleBtn.innerHTML = `📋 Today's Completed Calls (${todayCompleted.length})`;
    }

    if (displayCalls.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.84rem; background: var(--bg-main); border: 1.5px dashed var(--border-color); border-radius: 12px; margin: 0.5rem 0;">
        <i class="fas fa-clipboard-check" style="font-size: 2.2rem; color: #10b981; margin-bottom: 0.6rem; display: block;"></i>
        <div style="font-weight: 800; color: var(--text-primary); font-size: 0.95rem; margin-bottom: 0.35rem;">No Completed Calls Logged for Today Yet</div>
        <div style="font-size: 0.78rem; line-height: 1.45; max-width: 360px; margin: 0 auto; color: var(--text-secondary);">
          When you visit schools and mark their status as <strong>"Completed"</strong> with action taken and HM signature, their individual 7-field WhatsApp messages and signed sheets will appear here in real-time.
        </div>
      </div>`;
      return;
    }

    container.innerHTML = displayCalls.map((c, idx) => {
      const msgText = this.generateSingleCallWhatsappText(c);
      const photoHTML = c.hmSignedSheet 
        ? `<div style="display:flex; align-items:center; gap: 0.6rem; margin-top: 0.55rem; background: rgba(16,185,129,0.06); padding: 0.5rem 0.65rem; border-radius: 8px; border: 1px solid rgba(16,185,129,0.25);">
            <img src="${c.hmSignedSheet}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color);" alt="HM Signed Sheet">
            <div style="flex:1;">
              <div style="font-size: 0.74rem; font-weight: 700; color: #10b981;"><i class="fas fa-file-signature"></i> School HM Signed Sheet Photo Attached</div>
              <div style="font-size: 0.68rem; color: var(--text-muted);">${c.hmName ? 'HM: ' + c.hmName : 'Signed & Stamped O&M Sheet'}</div>
            </div>
            <a href="${c.hmSignedSheet}" download="HM_Signed_Sheet_${c.udise}.png" class="btn btn-sm btn-outline" style="font-size: 0.7rem; padding: 0.25rem 0.5rem; background: var(--bg-card); color: var(--primary); border-color: var(--primary);" title="Download signed sheet photo to attach in WhatsApp">
              <i class="fas fa-download"></i> Save Photo
            </a>
           </div>` 
        : `<div style="font-size: 0.71rem; color: var(--danger); margin-top: 0.4rem; background: rgba(239,68,68,0.05); padding: 0.35rem 0.55rem; border-radius: 6px; border: 1px solid rgba(239,68,68,0.2);"><i class="fas fa-exclamation-triangle"></i> School HM Signed Sheet photo missing</div>`;

      return `
        <div class="single-call-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 0.95rem; margin-bottom: 0.85rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.5rem;">
            <div style="font-weight: 800; font-size: 0.86rem; color: var(--text-primary);">${idx + 1}. ${c.schoolName || 'School'}</div>
            <span class="badge" style="font-size: 0.7rem; background: rgba(16,185,129,0.12); color: #10b981; font-weight: 700;"><i class="fas fa-check-circle"></i> Completed Today</span>
          </div>

          <textarea id="singleCallMsgText_${c.id}" class="form-control font-mono single-call-textarea" style="font-size: 0.8rem; min-height: 180px; line-height: 1.45; margin-bottom: 0.5rem; color: #0f172a !important; -webkit-text-fill-color: #0f172a !important; -webkit-opacity: 1 !important; opacity: 1 !important; background: #f8fafc !important; border: 1.5px solid #cbd5e1; padding: 0.65rem; width: 100%; box-sizing: border-box;" readonly>${msgText}</textarea>
          
          <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
            <button type="button" onclick="window.copySingleCallText ? window.copySingleCallText('${c.id}') : window.exporter.copySingleCallText('${c.id}')" class="btn btn-sm" style="background: #25D366; color: #ffffff; border: none; font-weight: 800; font-size: 0.75rem; padding: 0.45rem 0.9rem; border-radius: 6px; box-shadow: 0 3px 8px rgba(37,211,102,0.25);">
              <i class="fab fa-whatsapp"></i> Copy 7-Field WhatsApp Msg
            </button>
          </div>
          ${photoHTML}
        </div>
      `;
    }).join('');

    displayCalls.forEach(c => {
      const ta = document.getElementById('singleCallMsgText_' + c.id);
      if (ta) {
        const msg = this.generateSingleCallWhatsappText(c);
        ta.value = msg;
        ta.textContent = msg;
      }
    });
  }

  copySingleCallText(id) {
    if (typeof window.copySingleCallText === 'function') {
      window.copySingleCallText(id);
      return;
    }
    const el = document.getElementById('singleCallMsgText_' + id);
    if (el) {
      const text = el.value || el.textContent || '';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          alert('✅ 7-Field WhatsApp message copied to clipboard!\n\nYou can now paste it into WhatsApp alongside the saved HM Signed Sheet photo.');
        });
      } else {
        el.select();
        document.execCommand('copy');
        alert('✅ 7-Field WhatsApp message copied to clipboard!');
      }
    }
  }

  async exportToExcel() {
    if (typeof ExcelJS === 'undefined') {
      alert('Error: ExcelJS library is loading. Please check your internet connection or try again in a few seconds.');
      return;
    }

    try {
      // Show loading indicator
      const downloadBtn = document.getElementById('downloadExcelReportBtn');
      const origText = downloadBtn ? downloadBtn.innerHTML : '';
      if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Excel...';
      }

      // Load workbook from embedded Base64 string
      const workbook = new ExcelJS.Workbook();
      const binaryString = window.atob(EXCEL_TEMPLATE_BASE64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      await workbook.xlsx.load(bytes.buffer);

      const calls = this.getCallsData();
      
      // 1. Update Dashboard sheet
      const wsDash = workbook.getWorksheet('Dashboard');
      if (wsDash) {
        const total = calls.length;
        const completed = calls.filter(c => c.status === 'Completed').length;
        const inProgress = calls.filter(c => c.status === 'In Progress').length;
        const notStarted = calls.filter(c => c.status === 'Not Started').length;
        const incomplete = calls.filter(c => c.status === 'Incomplete').length;
        const totalDistance = calls.reduce((sum, c) => sum + (parseFloat(c.distanceKm) || 0), 0);
        const totalConveyance = calls.reduce((sum, c) => sum + (parseFloat(c.conveyanceCost) || 0), 0);

        // Update single metrics (Overview section)
        wsDash.getCell('B12').value = total;
        wsDash.getCell('F12').value = completed;
        wsDash.getCell('J12').value = incomplete;
        wsDash.getCell('B16').value = notStarted;
        wsDash.getCell('F16').value = totalDistance;
        wsDash.getCell('J16').value = totalConveyance;

        // Set report date (today)
        wsDash.getCell('D8').value = new Date();

        // Update Block Breakdown table (rows 24 to 29)
        const blocks = ['Keezhaiyur', 'Nagapattinam', 'Kelvelur', 'Thirumarugal', 'Thalainayar', 'Vedaranyam'];
        blocks.forEach((b, idx) => {
          const rowNum = 24 + idx;
          const bCalls = calls.filter(c => c.block === b);
          const bComp = bCalls.filter(c => c.status === 'Completed').length;
          
          wsDash.getCell(`B${rowNum}`).value = b;
          wsDash.getCell(`C${rowNum}`).value = bCalls.length;
          wsDash.getCell(`D${rowNum}`).value = bComp;
          wsDash.getCell(`E${rowNum}`).value = bCalls.length > 0 ? bComp / bCalls.length : 0;
        });

        // Update Category Breakdown table (rows 24 to 28)
        const categories = ['GOOGLE FORM - AI', 'TICKETING TOOL TICKET', 'HELPLINE TICKET', 'KS SMART', 'Ticketing Tool'];
        categories.forEach((cat, idx) => {
          const rowNum = 24 + idx;
          const catCalls = calls.filter(c => c.category === cat);
          const catComp = catCalls.filter(c => c.status === 'Completed').length;
          const catIncomp = catCalls.filter(c => c.status === 'Incomplete').length;
          const catPend = catCalls.filter(c => c.status === 'Not Started' || c.status === 'In Progress').length;

          wsDash.getCell(`G${rowNum}`).value = cat;
          wsDash.getCell(`H${rowNum}`).value = catCalls.length;
          wsDash.getCell(`I${rowNum}`).value = catComp;
          wsDash.getCell(`J${rowNum}`).value = catIncomp;
          wsDash.getCell(`K${rowNum}`).value = catPend;
        });
      }

      // 2. Update Call Tracker sheet (Preserve exact original template layout from Field_Call_Tracker.xlsx)
      const wsLedger = workbook.getWorksheet('Call Tracker');
      if (wsLedger) {
        calls.forEach((c, idx) => {
          const rNum = 3 + idx;
          const row = wsLedger.getRow(rNum);
          row.hidden = false;

          row.getCell(1).value = c.id;
          row.getCell(2).value = c.udise || '';
          row.getCell(3).value = c.block || '';
          row.getCell(4).value = c.schoolName || '';
          row.getCell(5).value = c.issue || '';
          row.getCell(6).value = c.category || '';
          
          // Column 7 (Ai Name in legacy template - replace Ranjitha with On-Site Issues or leave blank)
          row.getCell(7).value = c.addlIssues && c.addlIssues !== 'None' ? c.addlIssues : '';
          
          row.getCell(8).value = c.contactNo || '';
          row.getCell(9).value = c.zone611001 || 'NO';

          // Ticket Raised On Date
          if (c.ticketRaisedOn) {
            row.getCell(10).value = new Date(c.ticketRaisedOn);
          } else {
            row.getCell(10).value = '';
          }

          row.getCell(11).value = c.ageDays || 0;
          row.getCell(12).value = c.status || 'Not Started';
          row.getCell(13).value = c.distanceKm !== null && c.distanceKm !== undefined ? c.distanceKm : '';
          
          // Conveyance cost
          row.getCell(14).value = c.conveyanceCost !== null && c.conveyanceCost !== undefined ? c.conveyanceCost : '';

          // Date Closed
          if (c.dateClosed) {
            row.getCell(15).value = new Date(c.dateClosed);
          } else {
            row.getCell(15).value = '';
          }

          // Reason Incomplete with Manager Escalation Flag
          let reasonText = c.reasonIncomplete || '';
          if (c.escalationFlag && c.escalationFlag !== 'NONE') {
            const flagMap = {
              'INSTALLATION_PENDING': 'Installation Pending',
              'MATERIAL_REQUIRED': 'Material Dispatch Required',
              'VENDOR_REPLACEMENT': 'Vendor Replacement Required',
              'NEW_TICKET_LOG': 'New Ticket Required'
            };
            const fLabel = flagMap[c.escalationFlag] || c.escalationFlag;
            reasonText += (reasonText ? ' | ' : '') + 'Escalation: ' + fLabel;
          }
          row.getCell(16).value = reasonText;
          
          // Action Taken with On-Site Discoveries & Remark
          let actionText = c.actionTaken || '';
          if (c.addlIssues && c.addlIssues.trim() && c.addlIssues.trim() !== 'None') {
            actionText += (actionText ? ' | ' : '') + 'New On-Site Issue: ' + c.addlIssues.trim();
          }
          if (c.remark && c.remark.trim() && c.remark.trim() !== 'All equipments working fine') {
            actionText += (actionText ? ' | ' : '') + 'Remark: ' + c.remark.trim();
          }
          row.getCell(17).value = actionText;

          // Materials Used with Missing Materials & Own Cash Spent
          let materialsText = c.materialsUsed || '';
          if (c.missingMaterials && c.missingMaterials.trim() && c.missingMaterials.trim() !== 'None') {
            materialsText += (materialsText ? ' | ' : '') + 'Missing Materials: ' + c.missingMaterials.trim();
          }
          if (c.ownCashSpent && parseFloat(c.ownCashSpent) > 0) {
            materialsText += (materialsText ? ' | ' : '') + 'Own Cash Spent: ₹' + c.ownCashSpent;
          }
          row.getCell(18).value = materialsText;

          row.getCell(19).value = c.visitedBy || '';

          // Explicitly clear leftover template strings in columns 20 to 30 (including hardcoded Cell U7 'Ranjitha'!)
          for (let col = 20; col <= 30; col++) {
            row.getCell(col).value = null;
          }

          row.commit();
        });

        // Clear unused rows & leftover template strings in columns 20 to 30 across all rows
        for (let r = 3; r <= 100; r++) {
          const row = wsLedger.getRow(r);
          if (row) {
            for (let col = 20; col <= 30; col++) {
              const cell = row.getCell(col);
              if (cell) cell.value = null;
            }
            if (r >= 3 + calls.length) {
              for (let col = 1; col <= 30; col++) {
                const cell = row.getCell(col);
                if (cell) cell.value = null;
              }
            }
            row.commit();
          }
        }
      }

      // Generate binary buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const todayStr = new Date().toISOString().split('T')[0];
      link.download = `Field_Call_Tracker_Report_${todayStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Restore button status
      if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = origText;
      }
    } catch (error) {
      console.error('Error generating Excel file:', error);
      alert('Error generating Excel file. Please ensure template.xlsx exists in the folder and is valid.');
      
      const downloadBtn = document.getElementById('downloadExcelReportBtn');
      if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '<i class="fas fa-file-excel"></i> Download Excel (.xlsx)';
      }
    }
  }

  async exportWeeklyMissingMaterialsExcel() {
    if (typeof ExcelJS === 'undefined') {
      alert('Error: ExcelJS library is loading. Please check your internet connection or try again in a few seconds.');
      return;
    }

    try {
      const btn = document.getElementById('downloadWeeklyEscalationsExcelBtn');
      const origText = btn ? btn.innerHTML : '';
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Building Weekly Report...';
      }

      const calls = this.getCallsData();
      const user = window.authStore ? window.authStore.currentUser : null;
      const engineerName = user ? user.name : 'Mohamad Shameer';
      const engineerDistrict = user ? user.district : 'Nagapattinam';

      // Filter calls with missing materials, additional issues, or escalation flags
      const escalatedCalls = calls.filter(c => 
        (c.missingMaterials && c.missingMaterials.trim()) || 
        (c.addlIssues && c.addlIssues.trim()) || 
        (c.escalationFlag && c.escalationFlag !== 'NONE')
      );

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'KS Smart Solutions';
      workbook.created = new Date();

      const sheet = workbook.addWorksheet('Weekly Missing Materials', {
        views: [{ showGridLines: true }]
      });

      // Title Row
      sheet.mergeCells('A1:J1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'KS SMART SOLUTIONS - HI-TECH LAB WEEKLY MISSING MATERIALS & INSTALLATION ESCALATION REPORT';
      titleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E1B4B' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(1).height = 32;

      // Meta Header Rows
      sheet.getCell('A2').value = `District: ${engineerDistrict}`;
      sheet.getCell('D2').value = `Field Engineer: ${engineerName}`;
      sheet.getCell('G2').value = `Date Generated: ${new Date().toLocaleDateString('en-IN')}`;
      sheet.getCell('J2').value = `Total Escalated Schools: ${escalatedCalls.length}`;

      for (let r = 2; r <= 3; r++) {
        sheet.getRow(r).font = { bold: true, size: 10, color: { argb: 'FF334155' } };
      }

      // Column Headers
      const headers = [
        'S.No', 'UDISE Code', 'School Name', 'Block', 'Call Status',
        'Original Ticket Complaint', 'New / Unlisted On-Site Issues',
        'Missing Materials & Pending Installation Work',
        'Manager Escalation / Action Required', 'Field Engineer'
      ];

      const headerRow = sheet.getRow(4);
      headerRow.values = headers;
      headerRow.height = 26;
      headerRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF64748B' } },
          bottom: { style: 'medium', color: { argb: 'FF1E1B4B' } },
          left: { style: 'thin', color: { argb: 'FF64748B' } },
          right: { style: 'thin', color: { argb: 'FF64748B' } }
        };
      });

      const flagMap = {
        'INSTALLATION_PENDING': '📦 REQUIRES INSTALLATION TEAM ACTION (UPS/Wiring Pending)',
        'MATERIAL_REQUIRED': '🛒 REQUIRES MATERIAL DISPATCH (Spares/Hardware Pending)',
        'VENDOR_REPLACEMENT': '⚠️ REQUIRES VENDOR REPLACEMENT (Warranty/Hardware Failure)',
        'NEW_TICKET_LOG': '🔍 NEW COMPLAINT TICKET TO BE LOGGED',
        'NONE': 'NONE'
      };

      // Populate Data Rows
      const rowsToUse = escalatedCalls.length > 0 ? escalatedCalls : calls;
      rowsToUse.forEach((c, idx) => {
        const row = sheet.addRow([
          idx + 1,
          c.udise || '',
          c.schoolName || '',
          c.block || '',
          c.status || 'Not Started',
          c.issue || '',
          c.addlIssues || 'None',
          c.missingMaterials || 'None',
          flagMap[c.escalationFlag] || c.escalationFlag || 'None',
          c.visitedBy || engineerName
        ]);

        row.height = 24;
        row.alignment = { vertical: 'middle' };
        row.font = { size: 10 };

        // Zebra striping
        if (idx % 2 === 1) {
          row.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
          });
        }
      });

      // Enable Excel AutoFilter dropdowns on column headers
      sheet.autoFilter = {
        from: { row: 4, column: 1 },
        to: { row: 3 + rowsToUse.length, column: 10 }
      };

      // Auto-fit column widths
      sheet.columns.forEach((col) => {
        let maxLen = 12;
        col.eachCell({ includeEmpty: true }, (cell) => {
          const len = cell.value ? String(cell.value).length : 0;
          if (len > maxLen) maxLen = len;
        });
        col.width = Math.min(Math.max(maxLen + 4, 12), 45);
      });

      // Save buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HiTechLab_Weekly_Missing_Materials_${engineerDistrict}_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origText;
      }
    } catch(err) {
      console.error('Error exporting weekly missing materials excel:', err);
      alert('Error generating Excel file. Please try again.');
      const btn = document.getElementById('downloadWeeklyEscalationsExcelBtn');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-file-excel"></i> Export Weekly Missing Materials Excel (.xlsx)';
      }
    }
  }
}

// Global Exporter Instance
window.exporter = new FieldCallExporter();
