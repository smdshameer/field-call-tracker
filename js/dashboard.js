/**
 * Field Call Tracker - KPI Aggregations & Dashboard Summary Engine
 */

class FieldCallDashboard {
  constructor() {
    this.statusChartRef = null;
    this.init();
  }

  init() {
    const renderFn = () => {
      if (window.appStore && window.appStore.calls) {
        this.updateDashboard(window.appStore.calls, window.appStore.settings);
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderFn);
    } else {
      renderFn();
    }

    // Subscribe to store updates
    if (window.appStore) {
      window.appStore.subscribe((calls, settings) => {
        this.updateDashboard(calls, settings);
      });
    }
  }

  updateDashboard(calls, settings) {
    if (!calls || !Array.isArray(calls) || calls.length === 0) {
      calls = (window.appStore && Array.isArray(window.appStore.calls) && window.appStore.calls.length > 0)
        ? window.appStore.calls
        : (window.INITIAL_FIELD_CALLS || []);
    }
    if (!calls || !Array.isArray(calls)) calls = [];

    const userRate = (window.authStore && window.authStore.currentUser && window.authStore.currentUser.conveyanceRate) 
      ? parseFloat(window.authStore.currentUser.conveyanceRate) 
      : null;
    const rate = (userRate && !isNaN(userRate) && userRate > 0) 
      ? userRate 
      : ((settings && settings.ratePerKm) ? parseFloat(settings.ratePerKm) : ((window.appStore && window.appStore.settings && window.appStore.settings.ratePerKm) ? parseFloat(window.appStore.settings.ratePerKm) : 5));

    const totalCalls = calls.length;

    let completedCalls = 0;
    let inProgressCalls = 0;
    let notStartedCalls = 0;
    let incompleteCalls = 0;
    let totalDistance = 0;
    let totalConveyance = 0;
    let totalAgeDays = 0;
    let validAgeCount = 0;

    calls.forEach(c => {
      const st = String(c.status || '').trim().toLowerCase();
      if (st === 'completed') {
        completedCalls++;
        const dist = (c.distanceKm !== null && c.distanceKm !== undefined && !isNaN(parseFloat(c.distanceKm))) ? parseFloat(c.distanceKm) : 0;
        const cost = (c.conveyanceCost !== null && c.conveyanceCost !== undefined && !isNaN(parseFloat(c.conveyanceCost))) 
          ? parseFloat(c.conveyanceCost) 
          : Math.round(dist * rate);
        totalDistance += dist;
        totalConveyance += cost;
      } else if (st === 'in progress' || st === 'inprogress') {
        inProgressCalls++;
      } else if (st === 'incomplete') {
        incompleteCalls++;
      } else {
        notStartedCalls++;
      }

      const age = parseInt(c.ageDays);
      if (!isNaN(age) && age >= 0) {
        totalAgeDays += age;
        validAgeCount++;
      }
    });

    const avgAge = validAgeCount > 0 ? Math.round(totalAgeDays / validAgeCount) : 0;
    const compPct = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;

    // Update Dom Elements (KPI Stat Cards)
    this.setElementText('kpiTotalCalls', totalCalls);
    this.setElementText('kpiCompleted', completedCalls);
    this.setElementText('kpiCompletedSubtext', `${compPct}% completion rate`);

    this.setElementText('kpiInProgress', inProgressCalls);
    this.setElementText('kpiNotStarted', notStartedCalls);
    this.setElementText('kpiIncomplete', incompleteCalls);

    this.setElementText('kpiConveyance', `₹${totalConveyance.toLocaleString('en-IN')}`);
    this.setElementText('kpiConveyanceSubtext', `${totalDistance.toLocaleString('en-IN')} total km traveled`);

    this.setElementText('kpiAvgAge', `${avgAge} days`);

    // Live vs Down Schools Metrics (CCC Portal ReportData)
    try {
      const downCalls = calls.filter(c => {
        const s = String(c.status || '').toLowerCase();
        const cat = String(c.category || '').toUpperCase();
        const iss = String(c.issue || '').toLowerCase();
        return s.includes('down') || cat.includes('DOWN') || iss.includes('down');
      });
      const downCount = downCalls.length;
      const liveCount = Math.max(0, totalCalls - downCount);
      const livePercent = totalCalls > 0 ? ((liveCount / totalCalls) * 100).toFixed(1) : '100';
      const downPercent = totalCalls > 0 ? ((downCount / totalCalls) * 100).toFixed(1) : '0';

      const hitechCalls = calls.filter(c => {
        const cat = String(c.category || '').toUpperCase();
        const iss = String(c.issue || '').toLowerCase();
        return cat.includes('HIGH') || iss.includes('hitech') || iss.includes('lab');
      });
      const hitechDownCount = hitechCalls.filter(c => {
        const s = String(c.status || '').toLowerCase();
        const iss = String(c.issue || '').toLowerCase();
        return s.includes('down') || iss.includes('down');
      }).length;

      const smartBoardCalls = calls.filter(c => !hitechCalls.includes(c));
      const smartBoardDownCount = Math.max(0, downCount - hitechDownCount);

      this.setElementText('countAllLabs', totalCalls);
      this.setElementText('countLiveLabs', liveCount);
      this.setElementText('countDownLabs', downCount);
      this.setElementText('labLiveCountDisplay', `${liveCount} (${livePercent}%)`);
      this.setElementText('labDownCountDisplay', `${downCount} (${downPercent}%)`);

      this.setElementText('hitechLabCountDisplay', `🖥️ ${hitechCalls.length} Total • ${hitechDownCount} Down`);
      this.setElementText('smartBoardCountDisplay', `📺 ${smartBoardCalls.length} Total • ${smartBoardDownCount} Down`);
    } catch(e) {
      console.warn('[dashboard] Down vs Live metrics calculation warning:', e);
    }

    // 1. Populate Block Progress Table (Compact)
    try {
      const tableBody = document.getElementById('blockSummaryTableBody');
      if (tableBody) {
        const blocks = ['Keezhaiyur', 'Nagapattinam', 'Kelvelur', 'Thirumarugal', 'Thalainayar', 'Vedaranyam'];
        let tableHTML = '';
        blocks.forEach(b => {
          const bCalls = calls.filter(c => String(c.block || '').trim().toLowerCase() === b.toLowerCase());
          const bComp = bCalls.filter(c => String(c.status || '').trim().toLowerCase() === 'completed').length;
          const percent = bCalls.length > 0 ? Math.round((bComp / bCalls.length) * 100) : 0;
          
          tableHTML += `
            <tr>
              <td style="font-weight: 700;">${b}</td>
              <td style="text-align: center; font-weight: 600;">${bCalls.length}</td>
              <td style="text-align: center; font-weight: 600; color: var(--status-completed-text);">${bComp}</td>
              <td>
                <div class="progress-bar-container" style="width: 70px; height: 6px; margin-right: 0.35rem;">
                  <div class="progress-bar-fill" style="width: ${percent}%; background: ${percent === 100 ? '#10b981' : '#2563eb'}"></div>
                </div>
                <span style="font-weight: 700; font-size: 0.75rem;">${percent}%</span>
              </td>
            </tr>
          `;
        });
        tableBody.innerHTML = tableHTML;
      }
    } catch(e) {
      console.warn('[dashboard] Block Progress Table render error:', e);
    }

    // 2. Populate Ticket Category Summary Table
    try {
      const categoryTableBody = document.getElementById('categorySummaryTableBody') || document.getElementById('techSummaryTableBody');
      if (categoryTableBody) {
        const catMap = {};
        calls.forEach(c => {
          let cat = String(c.category || 'TICKETING TOOL TICKET').trim().toUpperCase();

          if (!catMap[cat]) {
            catMap[cat] = { name: cat, total: 0, completed: 0 };
          }
          catMap[cat].total += 1;
          if (String(c.status || '').trim().toLowerCase() === 'completed') {
            catMap[cat].completed += 1;
          }
        });

        const catList = Object.values(catMap).sort((a, b) => b.total - a.total);

        let catHTML = '';
        catList.forEach(c => {
          const rate = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0;
          let pillColor = 'var(--status-pending-text)';
          let pillBg = 'var(--status-pending-bg)';
          if (rate >= 75) {
            pillColor = 'var(--status-completed-text)';
            pillBg = 'var(--status-completed-bg)';
          } else if (rate >= 40) {
            pillColor = 'var(--status-progress-text)';
            pillBg = 'var(--status-progress-bg)';
          } else {
            pillColor = 'var(--status-incomplete-text)';
            pillBg = 'var(--status-incomplete-bg)';
          }

          catHTML += `
            <tr>
              <td style="font-weight: 700; font-size: 0.73rem; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${c.name}">
                ${c.name}
              </td>
              <td style="text-align: center; font-weight: 600;">${c.total}</td>
              <td style="text-align: center; font-weight: 600; color: var(--status-completed-text);">${c.completed}</td>
              <td style="text-align: center;">
                <span class="badge" style="background: ${pillBg}; color: ${pillColor}; font-weight: 800; padding: 0.15rem 0.4rem; font-size: 0.72rem;">
                  ${rate}%
                </span>
              </td>
            </tr>
          `;
        });

        categoryTableBody.innerHTML = catHTML;
      }
    } catch(e) {
      console.warn('[dashboard] Category Summary Table render error:', e);
    }

    // 3. Render/Update Chart.js Doughnut Status Chart
    try {
      const ctx = document.getElementById('statusChart');
      if (ctx) {
        if (typeof Chart !== 'undefined') {
          const chartData = [completedCalls, inProgressCalls, notStartedCalls, incompleteCalls];
          const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
          const textColor = isDark ? '#cbd5e1' : '#475569';
          const borderColor = isDark ? '#131b2e' : '#ffffff';
          
          if (this.statusChartRef) {
            // Update existing chart instance
            this.statusChartRef.data.datasets[0].data = chartData;
            this.statusChartRef.data.datasets[0].borderColor = borderColor;
            this.statusChartRef.options.plugins.legend.labels.color = textColor;
            this.statusChartRef.update();
          } else {
            // Initialize new Chart instance
            this.statusChartRef = new Chart(ctx, {
              type: 'doughnut',
              data: {
                labels: ['Completed', 'In Progress', 'Not Started', 'Incomplete'],
                datasets: [{
                  data: chartData,
                  backgroundColor: [
                    '#10b981', // Completed
                    '#f59e0b', // In Progress
                    '#6366f1', // Not Started
                    '#f43f5e'  // Incomplete
                  ],
                  borderWidth: 2,
                  borderColor: borderColor
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      color: textColor,
                      font: {
                        family: 'Plus Jakarta Sans',
                        weight: 'bold',
                        size: 11
                      }
                    }
                  }
                },
                cutout: '65%'
              }
            });
          }
        } else {
          // Fallback SVG Doughnut Chart rendering when Chart.js CDN is unavailable
          const total = totalCalls || 1;
          const pComp = Math.round((completedCalls / total) * 100);
          const pProg = Math.round((inProgressCalls / total) * 100);
          const pNot = Math.round((notStartedCalls / total) * 100);
          const parent = ctx.parentNode;
          if (parent) {
            parent.innerHTML = `
              <div style="display: flex; align-items: center; justify-content: space-around; width: 100%; height: 100%; min-height: 200px;">
                <svg viewBox="0 0 36 36" style="width: 140px; height: 140px; transform: rotate(-90deg);">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366f1" stroke-width="4.2" stroke-dasharray="${pNot}, 100" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" stroke-width="4.2" stroke-dasharray="${pComp}, 100" stroke-dashoffset="${-pNot}" />
                </svg>
                <div style="font-size: 0.78rem; font-weight: 700; display: flex; flex-direction: column; gap: 0.45rem;">
                  <div style="color: #10b981;">🟢 Completed: ${completedCalls} (${pComp}%)</div>
                  <div style="color: #f59e0b;">🟠 In Progress: ${inProgressCalls} (${pProg}%)</div>
                  <div style="color: #6366f1;">🔵 Not Started: ${notStartedCalls} (${pNot}%)</div>
                  <div style="color: #f43f5e;">🔴 Incomplete: ${incompleteCalls}</div>
                </div>
              </div>
            `;
          }
        }
      }
    } catch(e) {
      console.warn('[dashboard] Chart.js render warning:', e);
    }
  }

  setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = text !== undefined && text !== null ? String(text) : '';
      el.innerText = text !== undefined && text !== null ? String(text) : '';
    }
  }
}

// Global Dashboard Instance
window.dashboard = new FieldCallDashboard();

// Global unified refresh helper
window.refreshAllDashboardUI = function() {
  const calls = (window.appStore && Array.isArray(window.appStore.calls)) ? window.appStore.calls : (window.INITIAL_FIELD_CALLS || []);
  const settings = (window.appStore && window.appStore.settings) ? window.appStore.settings : {};
  if (window.dashboard && typeof window.dashboard.updateDashboard === 'function') {
    window.dashboard.updateDashboard(calls, settings);
  }
  if (window.tracker && typeof window.tracker.render === 'function') {
    window.tracker.render();
  }
  if (typeof window.generateAndPopulateDailyReport === 'function') {
    window.generateAndPopulateDailyReport();
  }
  if (typeof window.renderSingleCallCards === 'function') {
    window.renderSingleCallCards();
  }
};
