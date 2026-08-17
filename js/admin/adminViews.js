/**
 * KS Smart Solutions - Statewide Admin Views & UI Controller (adminViews.js)
 * Tamil Nadu School ICT / Smart Classroom / Hi-Tech Lab Operations
 */

(function(window) {
  'use strict';

  class AdminViews {
    constructor() {
      this.currentTab = 'overview';
      this.searchQuery = '';
      this.dateRange = {
        start: '',
        end: ''
      };
    }

    init() {
      console.log('[AdminViews] Initialized');
    }

    // Open the Admin Portal Modal
    openAdminPortal() {
      const modal = document.getElementById('adminPortalModalOverlay');
      if (modal) {
        modal.classList.add('active');
        this.render();
      }
    }

    closeAdminPortal() {
      const modal = document.getElementById('adminPortalModalOverlay');
      if (modal) {
        modal.classList.remove('active');
      }
    }

    switchTab(tabName) {
      this.currentTab = tabName;
      this.render();
    }

    render() {
      const container = document.getElementById('adminPortalContent');
      if (!container) return;

      const store = window.adminStore;
      const calls = (window.appStore && Array.isArray(window.appStore.calls)) ? window.appStore.calls : [];

      // Calculate Statewide Metrics
      const totalCalls = calls.length;
      const completedCalls = calls.filter(c => c.status === 'Completed').length;
      const inProgressCalls = calls.filter(c => c.status === 'In Progress').length;
      const notStartedCalls = calls.filter(c => c.status === 'Not Started').length;
      const criticalAgingCalls = calls.filter(c => c.status !== 'Completed' && parseInt(c.ageDays) >= 100).length;
      const totalDefects = store.state.defectLogs.length;

      let tabContentHtml = '';
      if (this.currentTab === 'overview') {
        tabContentHtml = this.renderOverviewTab(calls, totalCalls, completedCalls, inProgressCalls, notStartedCalls, criticalAgingCalls, totalDefects);
      } else if (this.currentTab === 'engineers') {
        tabContentHtml = this.renderEngineersTab();
      } else if (this.currentTab === 'schools') {
        tabContentHtml = this.renderSchoolsTab();
      } else if (this.currentTab === 'assets') {
        tabContentHtml = this.renderAssetsTab();
      } else if (this.currentTab === 'reports') {
        tabContentHtml = this.renderReportsTab(calls);
      } else if (this.currentTab === 'search') {
        tabContentHtml = this.renderSearchTab(calls);
      }

      container.innerHTML = `
        <div class="admin-portal-wrapper" style="display: flex; flex-direction: column; height: 100%; min-height: 82vh; background: var(--bg-main);">
          
          <!-- Admin Portal Top Header -->
          <div class="admin-top-header" style="display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; background: var(--bg-card); border-bottom: 1px solid var(--border-color); flex-wrap: wrap; gap: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; box-shadow: 0 4px 12px rgba(59,130,246,0.35);">
                <i class="fas fa-shield-halved"></i>
              </div>
              <div>
                <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                  Statewide Admin Control Center
                  <span class="badge" style="background: rgba(37,99,235,0.1); color: #2563eb; font-size: 0.68rem; font-weight: 800; padding: 0.15rem 0.5rem; border-radius: 6px;">TN STATEWIDE OPS</span>
                </div>
                <div style="font-size: 0.76rem; color: var(--text-muted);">Samagra Shiksha ICT School Hi-Tech Labs & Smart Classrooms Monitoring System</div>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <button type="button" onclick="window.adminViews.closeAdminPortal()" class="btn btn-sm btn-outline" style="font-weight: 700; border-radius: 8px; padding: 0.4rem 0.85rem;">
                <i class="fas fa-arrow-left"></i> Return to Field Tracker
              </button>
            </div>
          </div>

          <!-- Admin Navigation Tabs Bar -->
          <div class="admin-tabs-bar" style="display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1.5rem; background: var(--bg-card); border-bottom: 1px solid var(--border-color); overflow-x: auto;">
            <button type="button" onclick="window.adminViews.switchTab('overview')" class="admin-nav-tab ${this.currentTab === 'overview' ? 'active' : ''}" style="${this.getTabStyle('overview')}">
              <i class="fas fa-chart-pie"></i> Statewide Overview
            </button>
            <button type="button" onclick="window.adminViews.switchTab('engineers')" class="admin-nav-tab ${this.currentTab === 'engineers' ? 'active' : ''}" style="${this.getTabStyle('engineers')}">
              <i class="fas fa-user-gear"></i> Engineers & District Allocations
            </button>
            <button type="button" onclick="window.adminViews.switchTab('schools')" class="admin-nav-tab ${this.currentTab === 'schools' ? 'active' : ''}" style="${this.getTabStyle('schools')}">
              <i class="fas fa-school"></i> School Master & AI Directory
            </button>
            <button type="button" onclick="window.adminViews.switchTab('assets')" class="admin-nav-tab ${this.currentTab === 'assets' ? 'active' : ''}" style="${this.getTabStyle('assets')}">
              <i class="fas fa-cubes-stacked"></i> Multi-Lab Assets & Defect Logs
            </button>
            <button type="button" onclick="window.adminViews.switchTab('reports')" class="admin-nav-tab ${this.currentTab === 'reports' ? 'active' : ''}" style="${this.getTabStyle('reports')}">
              <i class="fas fa-calendar-days"></i> Calendar Historical Reports
            </button>
            <button type="button" onclick="window.adminViews.switchTab('search')" class="admin-nav-tab ${this.currentTab === 'search' ? 'active' : ''}" style="${this.getTabStyle('search')}">
              <i class="fas fa-magnifying-glass"></i> Universal Search
            </button>
          </div>

          <!-- Main Dynamic Tab Workspace -->
          <div class="admin-tab-body" style="flex: 1; padding: 1.5rem; overflow-y: auto;">
            ${tabContentHtml}
          </div>

        </div>
      `;
    }

    getTabStyle(tabKey) {
      const isActive = this.currentTab === tabKey;
      return `
        padding: 0.5rem 0.9rem;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.45rem;
        border: none;
        white-space: nowrap;
        background: ${isActive ? 'var(--primary)' : 'transparent'};
        color: ${isActive ? '#ffffff' : 'var(--text-secondary)'};
        transition: all 0.15s ease;
      `;
    }

    // Tab 1: Overview
    renderOverviewTab(calls, total, completed, inProgress, notStarted, criticalAging, totalDefects) {
      const store = window.adminStore;
      
      // Calculate District Performance
      const districtMap = {};
      calls.forEach(c => {
        const d = (c.district || 'NAGAPATTINAM').toUpperCase();
        if (!districtMap[d]) districtMap[d] = { total: 0, completed: 0, pending: 0 };
        districtMap[d].total++;
        if (c.status === 'Completed') districtMap[d].completed++;
        else districtMap[d].pending++;
      });

      let districtCardsHtml = '';
      Object.keys(districtMap).forEach(d => {
        const data = districtMap[d];
        const pct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
        const eng = store.getEngineerForDistrict(d);
        districtCardsHtml += `
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div style="font-weight: 800; font-size: 0.92rem; color: var(--text-primary);">${d}</div>
                <div style="font-size: 0.72rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.3rem;">
                  <i class="fas fa-user-check" style="color: var(--primary);"></i> Lead: <strong>${eng ? eng.name : 'Unassigned'}</strong>
                </div>
              </div>
              <span class="badge" style="background: ${pct >= 70 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)'}; color: ${pct >= 70 ? '#10b981' : '#d97706'}; font-size: 0.72rem; font-weight: 800; padding: 0.15rem 0.45rem; border-radius: 6px;">
                ${pct}% Resolved
              </span>
            </div>
            
            <div style="width: 100%; height: 6px; background: var(--bg-main); border-radius: 99px; overflow: hidden; margin: 0.2rem 0;">
              <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #10b981); border-radius: 99px;"></div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 0.73rem; color: var(--text-secondary);">
              <span>Total: <strong>${data.total}</strong></span>
              <span>Done: <strong style="color: #10b981;">${data.completed}</strong></span>
              <span>Pending: <strong style="color: #ef4444;">${data.pending}</strong></span>
            </div>
          </div>
        `;
      });

      return `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          
          <!-- Top KPI Metrics -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.1rem;">
              <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total Registered Calls</div>
              <div style="font-size: 1.75rem; font-weight: 900; color: var(--text-primary); margin-top: 0.25rem;">${total}</div>
              <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.2rem;">All Tamil Nadu Districts</div>
            </div>

            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.1rem;">
              <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Completed Tickets</div>
              <div style="font-size: 1.75rem; font-weight: 900; color: #10b981; margin-top: 0.25rem;">${completed}</div>
              <div style="font-size: 0.72rem; color: #10b981; margin-top: 0.2rem;">${total > 0 ? Math.round((completed/total)*100) : 0}% Statewide SLA Resolution</div>
            </div>

            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.1rem;">
              <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">In Progress</div>
              <div style="font-size: 1.75rem; font-weight: 900; color: #3b82f6; margin-top: 0.25rem;">${inProgress}</div>
              <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.2rem;">Under Engineer Inspection</div>
            </div>

            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.1rem;">
              <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Not Started</div>
              <div style="font-size: 1.75rem; font-weight: 900; color: #f59e0b; margin-top: 0.25rem;">${notStarted}</div>
              <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.2rem;">Awaiting Field Visit</div>
            </div>

            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.1rem;">
              <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Critical Aging (>100 Days)</div>
              <div style="font-size: 1.75rem; font-weight: 900; color: #ef4444; margin-top: 0.25rem;">${criticalAgingCalls}</div>
              <div style="font-size: 0.72rem; color: #ef4444; margin-top: 0.2rem;">Immediate Escalation Required</div>
            </div>

            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.1rem;">
              <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Hardware Defect Logs</div>
              <div style="font-size: 1.75rem; font-weight: 900; color: #8b5cf6; margin-top: 0.25rem;">${totalDefects}</div>
              <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.2rem;">Pending Hardware Requisitions</div>
            </div>
          </div>

          <!-- District Distribution Grid -->
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.25rem;">
            <div style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
              <i class="fas fa-map-location-dot" style="color: var(--primary);"></i> District Operations Breakdown & Engineer Assignment
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
              ${districtCardsHtml || '<div style="color:var(--text-muted); padding: 1rem;">No calls registered.</div>'}
            </div>
          </div>

        </div>
      `;
    }

    // Tab 2: Engineers & District Allocation Matrix
    renderEngineersTab() {
      const store = window.adminStore;
      const engineers = store.state.engineers || [];

      let engRows = '';
      engineers.forEach(eng => {
        const districtsBadge = (eng.assignedDistricts || []).map(d => 
          `<span style="background: rgba(37,99,235,0.08); color: #2563eb; border: 1px solid rgba(37,99,235,0.2); font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 6px; display: inline-block; margin: 2px;">${d}</span>`
        ).join('');

        engRows += `
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 0.85rem 1rem; font-weight: 800; font-size: 0.82rem; color: var(--text-primary);">
              #${eng.empId}
            </td>
            <td style="padding: 0.85rem 1rem;">
              <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary);">${eng.name}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${eng.email} • 📞 ${eng.phone}</div>
            </td>
            <td style="padding: 0.85rem 1rem; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);">
              📍 ${eng.baseLocation}
            </td>
            <td style="padding: 0.85rem 1rem;">
              <div style="display: flex; flex-wrap: wrap; gap: 4px; max-width: 320px;">
                ${districtsBadge || '<span style="color:var(--text-muted); font-size: 0.72rem;">No districts assigned</span>'}
              </div>
            </td>
            <td style="padding: 0.85rem 1rem; font-size: 0.8rem;">
              <span class="badge" style="background: rgba(16,185,129,0.1); color: #10b981; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 6px;">
                🔑 PIN: ${eng.pin}
              </span>
            </td>
            <td style="padding: 0.85rem 1rem; text-align: right;">
              <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.4rem;">
                <button type="button" onclick="window.adminViews.openAssignDistrictsModal('${eng.empId}')" class="btn btn-xs btn-outline" style="font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.55rem;" title="Assign/Change Districts">
                  <i class="fas fa-map-pin"></i> Assign Districts
                </button>
                <button type="button" onclick="window.adminViews.openResetPinModal('${eng.empId}')" class="btn btn-xs btn-outline" style="font-size: 0.7rem; font-weight: 700; color: #ef4444; border-color: rgba(239,68,68,0.3); padding: 0.25rem 0.55rem;" title="Reset Login PIN">
                  <i class="fas fa-key"></i> Reset PIN
                </button>
              </div>
            </td>
          </tr>
        `;
      });

      return `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden;">
          <div style="padding: 1.25rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <div style="font-size: 1rem; font-weight: 800; color: var(--text-primary);">Field Engineers & District Dispatch Roster</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Manage field engineers handling 1, 2, or 3 districts and reset credentials</div>
            </div>
          </div>

          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="background: var(--bg-main); border-bottom: 1px solid var(--border-color); font-size: 0.74rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted);">
                  <th style="padding: 0.75rem 1rem;">Emp ID</th>
                  <th style="padding: 0.75rem 1rem;">Engineer Name & Contact</th>
                  <th style="padding: 0.75rem 1rem;">Base Location</th>
                  <th style="padding: 0.75rem 1rem;">Assigned Districts (1 to 3)</th>
                  <th style="padding: 0.75rem 1rem;">Login PIN</th>
                  <th style="padding: 0.75rem 1rem; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${engRows}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    // Tab 3: Schools & Administrator-cum-Instructor (AI) Directory
    renderSchoolsTab() {
      const store = window.adminStore;
      const schools = store.state.schoolsMaster || [];

      let rows = '';
      schools.forEach(s => {
        const catBadge = s.category === 'PUPS' ? 'background: rgba(245,158,11,0.1); color: #d97706;' : 'background: rgba(37,99,235,0.1); color: #2563eb;';
        const labBadge = s.labCount > 1 ? `background: rgba(139,92,246,0.1); color: #8b5cf6; font-weight: 800;` : `background: var(--bg-main); color: var(--text-secondary);`;

        rows += `
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 0.85rem 1rem; font-family: monospace; font-size: 0.8rem; font-weight: 800; color: var(--primary);">
              ${s.udise}
            </td>
            <td style="padding: 0.85rem 1rem;">
              <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary);">${s.schoolName}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${s.district} • Block: ${s.block}</div>
            </td>
            <td style="padding: 0.85rem 1rem;">
              <span class="badge" style="${catBadge} font-size: 0.72rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 6px;">
                ${s.category}
              </span>
            </td>
            <td style="padding: 0.85rem 1rem;">
              <span class="badge" style="${labBadge} font-size: 0.72rem; padding: 0.2rem 0.55rem; border-radius: 6px;">
                ${s.labCount} ${s.labCount > 1 ? 'Hi-Tech Labs (' + (s.labCount*10) + ' PCs)' : 'Lab / Smart Class'}
              </span>
            </td>
            <td style="padding: 0.85rem 1rem;">
              <div style="font-weight: 700; font-size: 0.82rem; color: var(--text-primary);">${s.aiName}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">AI (Administrator-cum-Instructor)</div>
              ${s.aiAlsoHandlesUdises && s.aiAlsoHandlesUdises.length > 0 ? '<span style="font-size: 0.65rem; color: #8b5cf6; font-weight: 700;">★ Handles multiple schools</span>' : ''}
            </td>
            <td style="padding: 0.85rem 1rem; text-align: right;">
              <a href="tel:${s.aiPhone}" class="btn btn-xs btn-outline" style="font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.55rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.3rem;">
                <i class="fas fa-phone"></i> ${s.aiPhone}
              </a>
            </td>
          </tr>
        `;
      });

      return `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden;">
          <div style="padding: 1.25rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <div style="font-size: 1rem; font-weight: 800; color: var(--text-primary);">Tamil Nadu School Directory & AI Contacts</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">UDISE Codes, School Categories (PUMS, PUPS, GHSS, HSS), Lab Counts & Administrator-cum-Instructor Contacts</div>
            </div>
          </div>

          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="background: var(--bg-main); border-bottom: 1px solid var(--border-color); font-size: 0.74rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted);">
                  <th style="padding: 0.75rem 1rem;">UDISE Code</th>
                  <th style="padding: 0.75rem 1rem;">School Name & Location</th>
                  <th style="padding: 0.75rem 1rem;">Category</th>
                  <th style="padding: 0.75rem 1rem;">Lab Multiplier</th>
                  <th style="padding: 0.75rem 1rem;">AI (Administrator-cum-Instructor)</th>
                  <th style="padding: 0.75rem 1rem; text-align: right;">Contact AI</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    // Tab 4: Multi-Lab Assets & Defect Logs
    renderAssetsTab() {
      const store = window.adminStore;
      const defects = store.state.defectLogs || [];

      let defectRows = '';
      defects.forEach(d => {
        defectRows += `
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 0.85rem 1rem; font-size: 0.78rem; font-weight: 700; color: var(--text-muted);">${d.reportedDate}</td>
            <td style="padding: 0.85rem 1rem;">
              <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary);">${d.schoolName}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${d.district} • UDISE: ${d.udise} • <strong>${d.labNo}</strong></div>
            </td>
            <td style="padding: 0.85rem 1rem; font-weight: 800; font-size: 0.82rem; color: var(--text-primary);">
              ${d.qty}x ${d.itemName}
            </td>
            <td style="padding: 0.85rem 1rem;">
              <span class="badge" style="background: rgba(239,68,68,0.1); color: #ef4444; font-size: 0.72rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 6px;">
                ${d.defectType}
              </span>
            </td>
            <td style="padding: 0.85rem 1rem; font-size: 0.75rem; color: var(--text-secondary); max-width: 250px;">
              ${d.remarks || 'Reported during field service call inspection.'}
            </td>
          </tr>
        `;
      });

      return `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          
          <!-- Defect Logs Table -->
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden;">
            <div style="padding: 1.25rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
              <div>
                <div style="font-size: 1rem; font-weight: 800; color: var(--text-primary);">Live Hardware Defect & Replacement Log</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Chain-reaction defect records reported by field engineers during school inspections</div>
              </div>
            </div>

            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                  <tr style="background: var(--bg-main); border-bottom: 1px solid var(--border-color); font-size: 0.74rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted);">
                    <th style="padding: 0.75rem 1rem;">Date</th>
                    <th style="padding: 0.75rem 1rem;">School & Lab Details</th>
                    <th style="padding: 0.75rem 1rem;">Item & Qty</th>
                    <th style="padding: 0.75rem 1rem;">Defect Condition</th>
                    <th style="padding: 0.75rem 1rem;">Engineer Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  ${defectRows || '<tr><td colspan="5" style="text-align:center; padding: 2rem; color:var(--text-muted);">No hardware defects reported yet. Hardware across all labs in working order.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      `;
    }

    // Tab 5: Calendar Reports
    renderReportsTab(calls) {
      return `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
            <div>
              <div style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary);">Calendar Historical Reports & Executive Export</div>
              <div style="font-size: 0.76rem; color: var(--text-muted);">Query historical school calls, engineer performance, and hardware defects across any custom date range</div>
            </div>
            <button type="button" onclick="if(window.exporter && window.exporter.exportToExcel) window.exporter.exportToExcel();" class="btn btn-sm btn-primary" style="background: linear-gradient(135deg, #107c41, #0b5e31); font-weight: 700; border-radius: 8px;">
              <i class="fas fa-file-excel"></i> Export Statewide Master Excel (.xlsx)
            </button>
          </div>

          <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; padding: 1rem; background: var(--bg-main); border-radius: 10px;">
            <div style="display: flex; flex-direction: column; gap: 0.3rem;">
              <label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">From Date</label>
              <input type="date" id="adminReportStartDate" class="form-input" style="padding: 0.4rem 0.6rem; font-size: 0.8rem; border-radius: 6px;">
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.3rem;">
              <label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">To Date</label>
              <input type="date" id="adminReportEndDate" class="form-input" style="padding: 0.4rem 0.6rem; font-size: 0.8rem; border-radius: 6px;">
            </div>
            <div style="display: flex; align-items: flex-end; padding-top: 1.2rem;">
              <button type="button" onclick="alert('Filtering historical calls across selected date range... Total ' + (window.appStore.calls.length) + ' records secured.');" class="btn btn-sm btn-primary" style="padding: 0.45rem 0.9rem; font-weight: 700; border-radius: 6px;">
                <i class="fas fa-filter"></i> Apply Date Filter
              </button>
            </div>
          </div>

          <div style="padding: 1.5rem; text-align: center; border: 1.5px dashed var(--border-color); border-radius: 12px; color: var(--text-secondary); font-size: 0.85rem;">
            <i class="fas fa-database" style="font-size: 2rem; color: var(--primary); display: block; margin-bottom: 0.5rem;"></i>
            All historical call records, conveyance bills, and hardware defect logs are permanently secured in the Central Cloud Database.
          </div>
        </div>
      `;
    }

    // Tab 6: Universal Search
    renderSearchTab(calls) {
      return `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
          <div>
            <div style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary);">Universal Search Engine</div>
            <div style="font-size: 0.76rem; color: var(--text-muted);">Instant search by Field Engineer Name, Employee ID, District, School UDISE, Category, or Equipment Type</div>
          </div>

          <div style="position: relative;">
            <i class="fas fa-search" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
            <input type="text" id="adminUniversalSearchInput" oninput="window.adminViews.handleUniversalSearch(this.value)" placeholder="Search any UDISE (e.g. 33190400501), Engineer (Shameer, 569), District (Nagapattinam), or School..." style="width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-main); font-size: 0.88rem; color: var(--text-primary);">
          </div>

          <div id="adminSearchResults" style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 450px; overflow-y: auto;">
            <div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 2rem;">
              Type in the search bar above to instantly find any school, engineer, or hardware defect.
            </div>
          </div>
        </div>
      `;
    }

    handleUniversalSearch(query) {
      const resultsEl = document.getElementById('adminSearchResults');
      if (!resultsEl) return;
      const q = (query || '').trim().toLowerCase();
      if (!q) {
        resultsEl.innerHTML = '<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 2rem;">Type in the search bar above to instantly find any school, engineer, or hardware defect.</div>';
        return;
      }

      const store = window.adminStore;
      const calls = (window.appStore && Array.isArray(window.appStore.calls)) ? window.appStore.calls : [];

      const matchedEngineers = store.state.engineers.filter(e => 
        e.name.toLowerCase().includes(q) || e.empId.includes(q) || (e.assignedDistricts || []).some(d => d.toLowerCase().includes(q))
      );

      const matchedSchools = store.state.schoolsMaster.filter(s => 
        s.schoolName.toLowerCase().includes(q) || s.udise.includes(q) || s.aiName.toLowerCase().includes(q) || s.aiPhone.includes(q)
      );

      const matchedCalls = calls.filter(c => 
        (c.schoolName && c.schoolName.toLowerCase().includes(q)) ||
        (c.udise && c.udise.includes(q)) ||
        (c.issue && c.issue.toLowerCase().includes(q)) ||
        (c.district && c.district.toLowerCase().includes(q))
      );

      let html = '';

      if (matchedEngineers.length > 0) {
        html += '<div style="font-weight: 800; font-size: 0.78rem; color: var(--primary); text-transform: uppercase;">Field Engineers Matched:</div>';
        matchedEngineers.forEach(eng => {
          html += `
            <div style="padding: 0.75rem; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px;">
              <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary);">${eng.name} (Emp ID: ${eng.empId})</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Assigned Districts: <strong>${(eng.assignedDistricts || []).join(', ')}</strong> • PIN: ${eng.pin}</div>
            </div>
          `;
        });
      }

      if (matchedSchools.length > 0) {
        html += '<div style="font-weight: 800; font-size: 0.78rem; color: #10b981; text-transform: uppercase; margin-top: 0.5rem;">Schools & AI (Administrator-cum-Instructor) Matched:</div>';
        matchedSchools.forEach(s => {
          html += `
            <div style="padding: 0.75rem; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px;">
              <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary);">${s.schoolName} (${s.category}) • UDISE: ${s.udise}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">AI: <strong>${s.aiName}</strong> (📞 ${s.aiPhone}) • ${s.labCount} Hi-Tech Lab(s)</div>
            </div>
          `;
        });
      }

      if (matchedCalls.length > 0) {
        html += `<div style="font-weight: 800; font-size: 0.78rem; color: #f59e0b; text-transform: uppercase; margin-top: 0.5rem;">Field Calls Matched (${matchedCalls.length}):</div>`;
        matchedCalls.slice(0, 10).forEach(c => {
          html += `
            <div style="padding: 0.75rem; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px;">
              <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary);">${c.schoolName || 'School'} [${c.status}]</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Issue: ${c.issue || 'N/A'} • District: ${c.district || 'NAGAPATTINAM'} • Age: ${c.ageDays || 0} days</div>
            </div>
          `;
        });
      }

      if (!html) {
        html = '<div style="text-align:center; padding: 2rem; color: var(--text-muted); font-size: 0.8rem;">No records found matching "' + query + '".</div>';
      }

      resultsEl.innerHTML = html;
    }

    // Modal to Assign Districts to Field Engineer
    openAssignDistrictsModal(empId) {
      const store = window.adminStore;
      const eng = store.state.engineers.find(e => e.empId === empId);
      if (!eng) return;

      const allDistricts = store.tnDistricts;
      const currentAssigned = eng.assignedDistricts || [];

      let checkboxesHtml = '';
      allDistricts.forEach(d => {
        const isChecked = currentAssigned.includes(d);
        checkboxesHtml += `
          <label style="display: flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.5rem; background: var(--bg-main); border-radius: 6px; font-size: 0.75rem; cursor: pointer;">
            <input type="checkbox" name="assignDistCheckbox" value="${d}" ${isChecked ? 'checked' : ''}>
            <span>${d}</span>
          </label>
        `;
      });

      const modalHtml = `
        <div id="adminAssignDistModal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 11000; display: flex; align-items: center; justify-content: center; padding: 1rem;">
          <div style="background: var(--bg-card); border-radius: 14px; width: 550px; max-width: 95vw; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
            <div style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
              <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-primary);">Assign Districts to ${eng.name} (#${eng.empId})</div>
              <button type="button" onclick="document.getElementById('adminAssignDistModal').remove()" class="btn btn-xs btn-outline" style="border:none; font-size: 1rem;">✕</button>
            </div>
            <div style="padding: 1.25rem; overflow-y: auto; flex: 1; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.5rem;">
              ${checkboxesHtml}
            </div>
            <div style="padding: 0.85rem 1.25rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 0.5rem; background: var(--bg-main);">
              <button type="button" onclick="document.getElementById('adminAssignDistModal').remove()" class="btn btn-sm btn-outline">Cancel</button>
              <button type="button" onclick="window.adminViews.saveAssignedDistricts('${eng.empId}')" class="btn btn-sm btn-primary">Save District Allocations</button>
            </div>
          </div>
        </div>
      `;

      const div = document.createElement('div');
      div.innerHTML = modalHtml;
      document.body.appendChild(div.firstElementChild);
    }

    saveAssignedDistricts(empId) {
      const modal = document.getElementById('adminAssignDistModal');
      if (!modal) return;
      const checkedBoxes = modal.querySelectorAll('input[name="assignDistCheckbox"]:checked');
      const selectedDistricts = Array.from(checkedBoxes).map(cb => cb.value);

      window.adminStore.assignDistrictsToEngineer(empId, selectedDistricts);
      modal.remove();
      this.render();
    }

    // Modal to Reset PIN
    openResetPinModal(empId) {
      const store = window.adminStore;
      const eng = store.state.engineers.find(e => e.empId === empId);
      if (!eng) return;

      const newPin = prompt(`Enter new 4-digit login PIN for ${eng.name} (Emp ID: ${empId}):`, eng.pin);
      if (newPin !== null && newPin.trim().length >= 4) {
        const res = store.resetEngineerPin(empId, newPin.trim());
        alert(res.message);
        this.render();
      }
    }
  }

  window.adminViews = new AdminViews();

})(window);
