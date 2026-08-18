/**
 * KS Smart Solutions - Statewide Admin Views & UI Controller (adminViews.js)
 * Tamil Nadu School ICT / Smart Classroom / Hi-Tech Lab Operations
 * COMPLETE: All tabs fully functional — Performance, CRUD Modals, Date Filtering, Bulk Import
 */

(function(window) {
  'use strict';

  class AdminViews {
    constructor() {
      this.currentTab = 'overview';
      this.searchQuery = '';
      this.schoolSearchQuery = '';
      this.schoolDistrictFilter = 'ALL';
      this.schoolBlockFilter = 'ALL';
      this.schoolCategoryFilter = 'ALL';
      this.dateRange = { start: '', end: '' };
      this.filteredCalls = null;
      this.filteredDefects = null;
    }

    init() {
      console.log('[AdminViews] Initialized — Full Feature Mode');
    }

    openAdminPortal() {
      this.showSection('overview');
    }

    closeAdminPortal() {
      if (typeof window.showMainCallsDashboard === 'function') {
        window.showMainCallsDashboard();
      } else {
        const fieldView = document.getElementById('fieldEngineerMainView');
        const adminView = document.getElementById('adminMainView');
        if (fieldView && adminView) {
          fieldView.style.display = 'block';
          adminView.style.display = 'none';
        }
      }
    }

    switchTab(tabName) {
      this.showSection(tabName);
    }

    showSection(sectionKey) {
      this.currentTab = sectionKey;
      this.filteredCalls = null;
      this.filteredDefects = null;
      const fieldView = document.getElementById('fieldEngineerMainView');
      const adminView = document.getElementById('adminMainView');
      if (fieldView && adminView) {
        fieldView.style.display = 'none';
        adminView.style.display = 'block';
      }
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    render() {
      const container = document.getElementById('adminMainView') || document.getElementById('adminPortalContent');
      if (!container) return;

      try {
        const store = window.adminStore || { state: { engineers: [], schoolsMaster: [], defectLogs: [], districtAllocations: {} } };
        const state = store.state || {};
        const calls = (window.appStore && Array.isArray(window.appStore.calls)) ? window.appStore.calls : [];

        const totalCalls = calls.length;
        const completedCalls = calls.filter(c => c.status === 'Completed').length;
        const inProgressCalls = calls.filter(c => c.status === 'In Progress').length;
        const notStartedCalls = calls.filter(c => c.status === 'Not Started').length;
        const criticalAgingCalls = calls.filter(c => c.status !== 'Completed' && parseInt(c.ageDays) >= 100).length;
        const totalDefects = (state.defectLogs && Array.isArray(state.defectLogs)) ? state.defectLogs.length : 0;

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
        } else if (this.currentTab === 'performance') {
          tabContentHtml = this.renderPerformanceTab();
        }

        const tabMeta = {
          'performance': {
            title: 'Field Engineer Performance Leaderboard',
            icon: 'fa-ranking-star',
            sub: 'Resolution metrics, completion rates & critical aging calls per engineer',
            actionBtn: `<button type="button" onclick="window.adminViews.openAddEngineerModal()" class="btn" style="background: #ffffff; color: #1e40af; font-weight: 700; font-size: 0.82rem; padding: 0.45rem 1rem; border-radius: 8px; border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 0.4rem; cursor: pointer; transition: all 0.2s ease;"><i class="fas fa-plus"></i> New Engineer</button>`
          },
          'engineers': {
            title: 'Field Engineers & 38 District Allocations',
            icon: 'fa-user-gear',
            sub: 'Manage field engineers, assign 1 to 3 districts, and reset login PINs',
            actionBtn: `<button type="button" onclick="window.adminViews.openAddEngineerModal()" class="btn" style="background: #ffffff; color: #1e40af; font-weight: 700; font-size: 0.82rem; padding: 0.45rem 1rem; border-radius: 8px; border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 0.4rem; cursor: pointer; transition: all 0.2s ease;"><i class="fas fa-plus"></i> New Engineer</button>`
          },
          'schools': {
            title: 'Tamil Nadu School & AI Master Directory',
            icon: 'fa-school',
            sub: 'UDISE codes, school categories (PUPS/PUMS/GHSS), lab counts & AI contact numbers',
            actionBtn: `<button type="button" onclick="window.adminViews.openAddSchoolModal()" class="btn" style="background: #ffffff; color: #1e40af; font-weight: 700; font-size: 0.82rem; padding: 0.45rem 1rem; border-radius: 8px; border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 0.4rem; cursor: pointer; transition: all 0.2s ease;"><i class="fas fa-plus"></i> New School</button>`
          },
          'assets': {
            title: 'ICT Hi-Tech Lab Hardware Assets & Defect Logs',
            icon: 'fa-cubes-stacked',
            sub: 'Multi-lab multipliers, defect chain reaction & product complaint aggregation',
            actionBtn: `<button type="button" onclick="window.adminViews.openDefectModal()" class="btn" style="background: #ffffff; color: #1e40af; font-weight: 700; font-size: 0.82rem; padding: 0.45rem 1rem; border-radius: 8px; border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 0.4rem; cursor: pointer; transition: all 0.2s ease;"><i class="fas fa-plus"></i> Log Defect</button>`
          },
          'reports': {
            title: 'Historical Calendar Reports & Query Engine',
            icon: 'fa-calendar-days',
            sub: 'Filter calls, defects, and engineer visits across custom date ranges',
            actionBtn: `<button type="button" onclick="if(window.exporter && typeof window.exporter.exportToExcel==='function') window.exporter.exportToExcel()" class="btn" style="background: #ffffff; color: #1e40af; font-weight: 700; font-size: 0.82rem; padding: 0.45rem 1rem; border-radius: 8px; border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 0.4rem; cursor: pointer; transition: all 0.2s ease;"><i class="fas fa-file-excel"></i> Export Excel</button>`
          },
          'search': {
            title: 'Statewide Universal Search Engine',
            icon: 'fa-magnifying-glass',
            sub: 'Search across all schools, engineers, call tickets, and defect logs',
            actionBtn: ''
          },
          'overview': {
            title: 'Statewide District Operations Breakdown',
            icon: 'fa-chart-pie',
            sub: 'Operational status and district breakdown across all 38 districts',
            actionBtn: `<button type="button" onclick="window.adminViews.openBulkImportCallsModal()" class="btn" style="background: #ffffff; color: #1e40af; font-weight: 700; font-size: 0.82rem; padding: 0.45rem 1rem; border-radius: 8px; border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 0.4rem; cursor: pointer; transition: all 0.2s ease;"><i class="fas fa-plus"></i> Bulk Import</button>`
          }
        };

        const meta = tabMeta[this.currentTab] || { title: 'Statewide Operations', icon: 'fa-shield-halved', sub: 'KS Smart Solutions Management', actionBtn: '' };

        container.innerHTML = `
          <div class="admin-section-container" style="display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 2.5rem;">
            
            <!-- Royal Blue Banner Header (Replicating Screenshot Design) -->
            <div class="admin-blue-banner" style="display: flex; align-items: center; justify-content: space-between; padding: 1.15rem 1.6rem; background: linear-gradient(135deg, #185adb 0%, #1e40af 100%); color: #ffffff; border-radius: 14px; box-shadow: 0 4px 15px rgba(24, 90, 219, 0.22); flex-wrap: wrap; gap: 1rem;">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="font-size: 1.5rem; color: #ffffff; opacity: 0.95; display: flex; align-items: center; justify-content: center;">
                  <i class="fas ${meta.icon}"></i>
                </div>
                <div>
                  <div style="font-size: 1.25rem; font-weight: 700; color: #ffffff; line-height: 1.2; letter-spacing: -0.01em;">${meta.title}</div>
                  <div style="font-size: 0.8rem; color: rgba(255, 255, 255, 0.82); margin-top: 0.22rem; font-weight: 400;">${meta.sub}</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 0.65rem;">
                ${meta.actionBtn || ''}
                <button type="button" onclick="window.showMainCallsDashboard()" class="btn" style="background: rgba(255, 255, 255, 0.16); color: #ffffff; font-weight: 600; font-size: 0.82rem; padding: 0.45rem 1rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.3); display: flex; align-items: center; gap: 0.4rem; cursor: pointer; transition: all 0.2s ease; backdrop-filter: blur(4px);">
                  <i class="fas fa-arrow-left"></i> Back
                </button>
              </div>
            </div>

            <!-- Section Body -->
            <div class="admin-tab-body">
              ${tabContentHtml}
            </div>
          </div>
        `;
      } catch (err) {
        console.error('[AdminViews] Render Error:', err);
        container.innerHTML = `
          <div style="padding: 2rem; text-align: center; color: var(--text-primary, #0f172a);">
            <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; color: #f59e0b; margin-bottom: 1rem;"></i>
            <h3>Statewide Admin Portal Loading</h3>
            <p style="color: var(--text-muted); margin-bottom: 1rem;">${err.message}</p>
            <button onclick="window.adminViews.render()" class="btn btn-primary btn-sm">Retry Load</button>
          </div>
        `;
      }
    }

    getTabStyle(tabKey) {
      const isActive = this.currentTab === tabKey;
      return `padding: 0.5rem 0.9rem; border-radius: 8px; font-size: 0.78rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.45rem; border: none; white-space: nowrap; background: ${isActive ? '#2563eb' : 'transparent'}; color: ${isActive ? '#ffffff' : 'var(--text-secondary, #475569)'}; transition: all 0.15s ease;`;
    }

    // ═══════════════════════════════════════════════════════
    // TAB 1: STATEWIDE OVERVIEW
    // ═══════════════════════════════════════════════════════
    renderOverviewTab(calls, total, completed, inProgress, notStarted, criticalAging, totalDefects) {
      const store = window.adminStore || {};
      const engCount = (store.state && store.state.engineers) ? store.state.engineers.filter(e => e.status === 'Active').length : 0;
      const schoolCount = (store.state && store.state.schoolsMaster) ? store.state.schoolsMaster.length : 0;
      
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
        const eng = (store.getEngineerForDistrict && typeof store.getEngineerForDistrict === 'function') ? store.getEngineerForDistrict(d) : null;
        districtCardsHtml += `
          <div class="panel" style="padding: 1.1rem; display: flex; flex-direction: column; gap: 0.5rem; transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 28px rgba(37,99,235,0.1)';" onmouseout="this.style.transform=''; this.style.boxShadow='';">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-primary, #0f172a); display: flex; align-items: center; gap: 0.4rem;">
                  <i class="fas fa-location-dot" style="color: #2563eb; font-size: 0.85rem;"></i> ${d}
                </div>
                <div style="font-size: 0.72rem; color: var(--text-muted, #64748b); display: flex; align-items: center; gap: 0.3rem; margin-top: 0.2rem;">
                  <i class="fas fa-user-check" style="color: #10b981;"></i> Lead: <strong>${eng ? eng.name : 'Unassigned'}</strong>
                </div>
              </div>
              <span class="badge" style="background: ${pct >= 70 ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)'}; color: ${pct >= 70 ? '#10b981' : '#d97706'}; font-size: 0.72rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 6px; border: 1px solid ${pct >= 70 ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'};">
                ${pct}% Resolved
              </span>
            </div>
            <div style="width: 100%; height: 7px; background: var(--bg-main, #f1f5f9); border-radius: 99px; overflow: hidden; margin: 0.25rem 0;">
              <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #10b981); border-radius: 99px; transition: width 0.4s ease;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary, #475569); font-weight: 600;">
              <span>Total: <strong>${data.total}</strong></span>
              <span>Done: <strong style="color: #10b981;">${data.completed}</strong></span>
              <span>Pending: <strong style="color: #ef4444;">${data.pending}</strong></span>
            </div>
          </div>
        `;
      });

      return `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(165px, 1fr)); gap: 12px;">
            ${this._kpiCard('Total Calls', total, 'blue', 'All Tamil Nadu Districts', 'fa-list-check')}
            ${this._kpiCard('Completed', completed, 'green', total > 0 ? Math.round((completed/total)*100) + '% Resolution' : '0%', 'fa-check-double')}
            ${this._kpiCard('In Progress', inProgress, 'amber', 'Under Inspection', 'fa-spinner')}
            ${this._kpiCard('Not Started', notStarted, 'purple', 'Awaiting Field Visit', 'fa-clock')}
            ${this._kpiCard('Critical (>100d)', criticalAging, 'red', 'Escalation Required', 'fa-triangle-exclamation')}
            ${this._kpiCard('Defect Logs', totalDefects, 'red', 'Hardware Issues', 'fa-wrench')}
            ${this._kpiCard('Active Engineers', engCount, 'blue', 'Field Team', 'fa-user-gear')}
            ${this._kpiCard('Schools Tracked', schoolCount, 'amber', 'In Directory', 'fa-school')}
          </div>

          <div class="panel" style="padding: 1.25rem;">
            <div style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary, #0f172a); margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-map-location-dot" style="color: #2563eb;"></i> District Operations Breakdown
              </div>
              <span class="badge" style="background: rgba(37,99,235,0.08); color: #2563eb; font-size: 0.72rem; font-weight: 700;">38 Districts</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem;">
              ${districtCardsHtml || '<div style="color:var(--text-muted); padding: 1rem;">No calls registered.</div>'}
            </div>
          </div>
        </div>
      `;
    }

    _kpiCard(label, value, colorTheme, subtitle, iconClass) {
      const color = colorTheme || 'blue';
      const icon = iconClass || 'fa-chart-pie';
      return `
        <div class="stat-card ${color}">
          <div class="stat-card-body">
            <div class="flex items-center justify-between w-full" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <span class="stat-label">${label}</span>
              <div class="stat-icon ${color}"><i class="fas ${icon}"></i></div>
            </div>
            <span class="stat-value">${value}</span>
            <span class="stat-sub">${subtitle || ''}</span>
          </div>
        </div>
      `;
    }

    // ═══════════════════════════════════════════════════════
    // TAB: ENGINEER PERFORMANCE ANALYTICS (NEW)
    // ═══════════════════════════════════════════════════════
    renderPerformanceTab() {
      const store = window.adminStore;
      if (!store) return '<div>Store not loaded.</div>';

      const performances = store.getAllEngineersPerformance();

      let rankRows = '';
      performances.forEach((p, idx) => {
        const rankIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '#' + (idx + 1);
        const barColor = p.completionRate >= 70 ? '#10b981' : p.completionRate >= 40 ? '#f59e0b' : '#ef4444';

        rankRows += `
          <tr style="border-bottom: 1px solid var(--border-color, #e2e8f0);">
            <td style="padding: 0.85rem 1rem; font-size: 1.1rem; text-align: center; font-weight: 800;">${rankIcon}</td>
            <td style="padding: 0.85rem 1rem;">
              <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary, #0f172a);">${p.name} <span style="color: var(--text-muted); font-size: 0.72rem;">#${p.empId}</span></div>
              <div style="font-size: 0.7rem; color: var(--text-muted, #64748b);">${(p.districts || []).join(', ')}</div>
            </td>
            <td style="padding: 0.85rem 1rem; text-align: center; font-weight: 800; font-size: 0.9rem;">${p.totalCalls}</td>
            <td style="padding: 0.85rem 1rem; text-align: center; font-weight: 800; color: #10b981;">${p.completed}</td>
            <td style="padding: 0.85rem 1rem; text-align: center; font-weight: 700; color: #3b82f6;">${p.inProgress}</td>
            <td style="padding: 0.85rem 1rem; text-align: center; font-weight: 700; color: #f59e0b;">${p.notStarted}</td>
            <td style="padding: 0.85rem 1rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div style="flex: 1; height: 8px; background: var(--bg-main, #f1f5f9); border-radius: 99px; overflow: hidden;">
                  <div style="width: ${p.completionRate}%; height: 100%; background: ${barColor}; border-radius: 99px; transition: width 0.3s;"></div>
                </div>
                <span style="font-weight: 900; font-size: 0.82rem; color: ${barColor}; min-width: 42px; text-align: right;">${p.completionRate}%</span>
              </div>
            </td>
            <td style="padding: 0.85rem 1rem; text-align: center; font-size: 0.8rem; color: var(--text-secondary);">${p.avgResolutionDays}d</td>
            <td style="padding: 0.85rem 1rem; text-align: center;">
              ${p.criticalAging > 0 ? '<span style="background: rgba(239,68,68,0.1); color: #ef4444; font-weight: 800; padding: 0.15rem 0.45rem; border-radius: 6px; font-size: 0.72rem;">' + p.criticalAging + ' Critical</span>' : '<span style="color: #10b981; font-size: 0.75rem;">✓ Clear</span>'}
            </td>
          </tr>
        `;
      });

      return `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div style="background: var(--bg-card, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 14px; overflow: hidden; box-shadow: var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05));">
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                  <tr style="background: var(--bg-main, #f8fafc); border-bottom: 1px solid var(--border-color, #e2e8f0); font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted, #64748b);">
                    <th style="padding: 0.75rem 1rem; text-align: center; width: 50px;">Rank</th>
                    <th style="padding: 0.75rem 1rem;">Engineer</th>
                    <th style="padding: 0.75rem 1rem; text-align: center;">Total</th>
                    <th style="padding: 0.75rem 1rem; text-align: center;">Done</th>
                    <th style="padding: 0.75rem 1rem; text-align: center;">Active</th>
                    <th style="padding: 0.75rem 1rem; text-align: center;">Pending</th>
                    <th style="padding: 0.75rem 1rem; min-width: 180px;">Completion Rate</th>
                    <th style="padding: 0.75rem 1rem; text-align: center;">Avg Days</th>
                    <th style="padding: 0.75rem 1rem; text-align: center;">Aging</th>
                  </tr>
                </thead>
                <tbody>
                  ${rankRows || '<tr><td colspan="9" style="text-align:center; padding: 2rem; color:var(--text-muted);">No engineer data available.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }

    // ═══════════════════════════════════════════════════════
    // TAB 2: ENGINEERS & DISTRICT ALLOCATION (with CRUD)
    // ═══════════════════════════════════════════════════════
    renderEngineersTab() {
      const store = window.adminStore || {};
      const engineers = (store.state && Array.isArray(store.state.engineers)) ? store.state.engineers : [];

      let engRows = '';
      engineers.forEach(eng => {
        const isInactive = eng.status === 'Inactive';
        const rowOpacity = isInactive ? 'opacity: 0.5;' : '';
        const districtsBadge = (eng.assignedDistricts || []).map(d => 
          `<span style="background: rgba(37,99,235,0.08); color: #2563eb; border: 1px solid rgba(37,99,235,0.2); font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 6px; display: inline-block; margin: 2px;">${d}</span>`
        ).join('');

        engRows += `
          <tr style="border-bottom: 1px solid var(--border-color, #e2e8f0); ${rowOpacity}">
            <td style="padding: 0.85rem 1rem; font-weight: 800; font-size: 0.82rem; color: var(--text-primary, #0f172a);">#${eng.empId}</td>
            <td style="padding: 0.85rem 1rem;">
              <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary, #0f172a);">${eng.name} ${isInactive ? '<span style="color:#ef4444; font-size:0.68rem;">(Inactive)</span>' : ''}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted, #64748b);">${eng.email} • 📞 ${eng.phone}</div>
            </td>
            <td style="padding: 0.85rem 1rem; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary, #475569);">📍 ${eng.baseLocation}</td>
            <td style="padding: 0.85rem 1rem;">
              <div style="display: flex; flex-wrap: wrap; gap: 4px; max-width: 320px;">
                ${districtsBadge || '<span style="color:var(--text-muted); font-size: 0.72rem;">No districts</span>'}
              </div>
            </td>
            <td style="padding: 0.85rem 1rem; font-size: 0.8rem;">
              <span class="badge" style="background: rgba(16,185,129,0.1); color: #10b981; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 6px;">🔑 ${eng.pin}</span>
            </td>
            <td style="padding: 0.85rem 1rem; text-align: right;">
              <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.35rem; flex-wrap: wrap;">
                <button type="button" onclick="window.adminViews.openEditEngineerModal('${eng.empId}')" class="btn btn-xs btn-outline" style="font-size: 0.68rem; font-weight: 700; padding: 0.2rem 0.45rem; cursor: pointer;" title="Edit Profile">
                  <i class="fas fa-pen-to-square"></i> Edit
                </button>
                <button type="button" onclick="window.adminViews.openAssignDistrictsModal('${eng.empId}')" class="btn btn-xs btn-outline" style="font-size: 0.68rem; font-weight: 700; padding: 0.2rem 0.45rem; cursor: pointer;" title="Assign Districts">
                  <i class="fas fa-map-pin"></i> Districts
                </button>
                <button type="button" onclick="window.adminViews.openResetPinModal('${eng.empId}')" class="btn btn-xs btn-outline" style="font-size: 0.68rem; font-weight: 700; color: #f59e0b; border-color: rgba(245,158,11,0.3); padding: 0.2rem 0.45rem; cursor: pointer;" title="Reset PIN">
                  <i class="fas fa-key"></i> PIN
                </button>
                ${!isInactive ? `<button type="button" onclick="window.adminViews.confirmDeactivateEngineer('${eng.empId}')" class="btn btn-xs btn-outline" style="font-size: 0.68rem; font-weight: 700; color: #ef4444; border-color: rgba(239,68,68,0.3); padding: 0.2rem 0.45rem; cursor: pointer;" title="Deactivate">
                  <i class="fas fa-user-slash"></i>
                </button>` : ''}
              </div>
            </td>
          </tr>
        `;
      });

      return `
        <div style="background: var(--bg-card, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 14px; overflow: hidden; box-shadow: var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05));">
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="background: var(--bg-main, #f8fafc); border-bottom: 1px solid var(--border-color, #e2e8f0); font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted, #64748b);">
                  <th style="padding: 0.75rem 1rem;">Emp ID</th>
                  <th style="padding: 0.75rem 1rem;">Engineer</th>
                  <th style="padding: 0.75rem 1rem;">Base</th>
                  <th style="padding: 0.75rem 1rem;">Assigned Districts</th>
                  <th style="padding: 0.75rem 1rem;">Login PIN</th>
                  <th style="padding: 0.75rem 1rem; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>${engRows}</tbody>
            </table>
          </div>
        </div>
      `;
    }

    // ═══════════════════════════════════════════════════════
    // TAB 3: SCHOOL & AI DIRECTORY (with SEARCH BAR & CRUD)
    // ═══════════════════════════════════════════════════════
    handleSchoolSearch(val) {
      this.schoolSearchQuery = val || '';
      this.updateSchoolTable();
    }

    handleSchoolDistrictFilter(val) {
      this.schoolDistrictFilter = val || 'ALL';
      this.updateSchoolTable();
    }

    handleSchoolCategoryFilter(val) {
      this.schoolCategoryFilter = val || 'ALL';
      this.updateSchoolTable();
    }

    handleSchoolBlockFilter(val) {
      this.schoolBlockFilter = val || 'ALL';
      this.updateSchoolTable();
    }

    clearSchoolFilters() {
      this.schoolSearchQuery = '';
      this.schoolDistrictFilter = 'ALL';
      this.schoolBlockFilter = 'ALL';
      this.schoolCategoryFilter = 'ALL';
      const searchInput = document.getElementById('adminSchoolSearchInput');
      const distSelect = document.getElementById('adminSchoolDistrictFilter');
      const blockSelect = document.getElementById('adminSchoolBlockFilter');
      const catSelect = document.getElementById('adminSchoolCategoryFilter');
      if (searchInput) searchInput.value = '';
      if (distSelect) distSelect.value = 'ALL';
      if (blockSelect) blockSelect.value = 'ALL';
      if (catSelect) catSelect.value = 'ALL';
      this.updateSchoolTable();
    }

    getFilteredSchools() {
      const store = window.adminStore || {};
      let schools = (store.state && Array.isArray(store.state.schoolsMaster)) ? store.state.schoolsMaster : [];
      const q = (this.schoolSearchQuery || '').trim().toLowerCase();
      const dist = this.schoolDistrictFilter || 'ALL';
      const block = this.schoolBlockFilter || 'ALL';
      const cat = this.schoolCategoryFilter || 'ALL';

      if (q) {
        schools = schools.filter(s => {
          return (s.schoolName && String(s.schoolName).toLowerCase().includes(q)) ||
                 (s.udise && String(s.udise).toLowerCase().includes(q)) ||
                 (s.district && String(s.district).toLowerCase().includes(q)) ||
                 (s.block && String(s.block).toLowerCase().includes(q)) ||
                 (s.aiName && String(s.aiName).toLowerCase().includes(q)) ||
                 (s.aiPhone && String(s.aiPhone).toLowerCase().includes(q)) ||
                 (s.category && String(s.category).toLowerCase().includes(q));
        });
      }

      if (dist !== 'ALL') {
        schools = schools.filter(s => s.district && s.district.toLowerCase() === dist.toLowerCase());
      }

      if (block !== 'ALL') {
        schools = schools.filter(s => s.block && s.block.toLowerCase() === block.toLowerCase());
      }

      if (cat !== 'ALL') {
        schools = schools.filter(s => s.category && s.category.toUpperCase() === cat.toUpperCase());
      }

      return schools;
    }

    renderSchoolRows(schools) {
      if (!schools || schools.length === 0) {
        return `
          <tr>
            <td colspan="6" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted, #64748b);">
              <i class="fas fa-school-circle-xmark" style="font-size: 2.2rem; color: #94a3b8; margin-bottom: 0.6rem; display: block;"></i>
              <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary, #0f172a); margin-bottom: 0.25rem;">No Matching Schools Found</div>
              <div style="font-size: 0.78rem; margin-bottom: 0.85rem;">No records matched your search query or selected filters.</div>
              <button type="button" onclick="window.adminViews.clearSchoolFilters()" class="btn btn-sm btn-primary" style="font-weight: 700; border-radius: 8px; font-size: 0.78rem; cursor: pointer;">
                <i class="fas fa-rotate-left"></i> Clear All Filters
              </button>
            </td>
          </tr>
        `;
      }

      return schools.map(s => {
        const catColor = { 'PUPS': '#d97706', 'PUMS': '#2563eb', 'GHSS': '#8b5cf6', 'HSS': '#059669', 'GHS': '#0ea5e9' }[s.category] || '#64748b';
        return `
          <tr style="border-bottom: 1px solid var(--border-color, #e2e8f0);">
            <td style="padding: 0.8rem 1rem; font-family: monospace; font-size: 0.78rem; font-weight: 800; color: #2563eb;">${s.udise}</td>
            <td style="padding: 0.8rem 1rem;">
              <div style="font-weight: 700; font-size: 0.82rem; color: var(--text-primary, #0f172a);">${s.schoolName}</div>
              <div style="font-size: 0.7rem; color: var(--text-muted, #64748b);">${s.district} • Block: ${s.block}</div>
            </td>
            <td style="padding: 0.8rem 1rem;">
              <span style="background: rgba(${catColor === '#d97706' ? '217,119,6' : catColor === '#2563eb' ? '37,99,235' : catColor === '#8b5cf6' ? '139,92,246' : '5,150,105'},0.1); color: ${catColor}; font-size: 0.72rem; font-weight: 800; padding: 0.18rem 0.5rem; border-radius: 6px;">${s.category}</span>
            </td>
            <td style="padding: 0.8rem 1rem;">
              <span style="background: ${s.labCount > 1 ? 'rgba(139,92,246,0.1)' : 'var(--bg-main, #f1f5f9)'}; color: ${s.labCount > 1 ? '#8b5cf6' : 'var(--text-secondary)'}; font-size: 0.72rem; font-weight: 800; padding: 0.18rem 0.5rem; border-radius: 6px;">
                ${s.labCount} ${s.labCount > 1 ? 'Labs (' + (s.labCount*10) + ' PCs)' : 'Lab'}
              </span>
            </td>
            <td style="padding: 0.8rem 1rem;">
              <div style="font-weight: 700; font-size: 0.8rem; color: var(--text-primary, #0f172a);">${s.aiName}</div>
              <div style="font-size: 0.68rem; color: var(--text-muted);">AI (Administrator-cum-Instructor)</div>
              ${s.aiAlsoHandlesUdises && s.aiAlsoHandlesUdises.length > 0 ? '<span style="font-size: 0.63rem; color: #8b5cf6; font-weight: 700;">★ Multi-school AI</span>' : ''}
            </td>
            <td style="padding: 0.8rem 1rem; text-align: right;">
              <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.35rem; flex-wrap: wrap;">
                <a href="tel:${s.aiPhone}" class="btn btn-xs btn-outline" style="font-size: 0.68rem; font-weight: 700; padding: 0.2rem 0.45rem; text-decoration: none; cursor: pointer;">
                  <i class="fas fa-phone"></i> ${s.aiPhone}
                </a>
                <button type="button" onclick="window.adminViews.openEditSchoolModal('${s.udise}')" class="btn btn-xs btn-outline" style="font-size: 0.68rem; font-weight: 700; padding: 0.2rem 0.45rem; cursor: pointer;">
                  <i class="fas fa-pen"></i> Edit
                </button>
                <button type="button" onclick="window.adminViews.confirmDeleteSchool('${s.udise}')" class="btn btn-xs btn-outline" style="font-size: 0.68rem; font-weight: 700; color: #ef4444; border-color: rgba(239,68,68,0.3); padding: 0.2rem 0.45rem; cursor: pointer;">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    updateSchoolTable() {
      const tbody = document.getElementById('adminSchoolTableBody');
      const badge = document.getElementById('adminSchoolCountBadge');
      const summary = document.getElementById('adminSchoolCountSummary');
      const blockSelect = document.getElementById('adminSchoolBlockFilter');
      const store = window.adminStore || {};
      const allSchools = (store.state && Array.isArray(store.state.schoolsMaster)) ? store.state.schoolsMaster : [];
      const totalOriginal = allSchools.length;

      // Dynamically sync available blocks dropdown
      if (blockSelect) {
        const blocksSource = this.schoolDistrictFilter !== 'ALL' 
          ? allSchools.filter(s => s.district && s.district.toLowerCase() === this.schoolDistrictFilter.toLowerCase())
          : allSchools;
        const availableBlocks = [...new Set(blocksSource.map(s => (s.block || '').trim()).filter(b => b))].sort();
        
        // Check if current filter is valid in new district
        if (this.schoolBlockFilter !== 'ALL' && !availableBlocks.some(b => b.toLowerCase() === this.schoolBlockFilter.toLowerCase())) {
          this.schoolBlockFilter = 'ALL';
        }

        const blockOptsHtml = `<option value="ALL" ${this.schoolBlockFilter === 'ALL' ? 'selected' : ''}>All Blocks${availableBlocks.length > 0 ? ' (' + availableBlocks.length + ')' : ''}</option>` +
          availableBlocks.map(b => `<option value="${b}" ${this.schoolBlockFilter.toLowerCase() === b.toLowerCase() ? 'selected' : ''}>${b}</option>`).join('');
        blockSelect.innerHTML = blockOptsHtml;
      }

      const filtered = this.getFilteredSchools();

      if (tbody) {
        tbody.innerHTML = this.renderSchoolRows(filtered);
      }
      if (badge) {
        badge.innerHTML = `<i class="fas fa-list-check" style="color: #2563eb;"></i> Directory Records: <strong>${filtered.length}</strong> / ${totalOriginal} Schools`;
      }
      if (summary) {
        summary.innerHTML = `Showing <strong>${filtered.length}</strong> of <strong>${totalOriginal}</strong> schools in directory`;
      }
    }

    renderSchoolsTab() {
      const store = window.adminStore || {};
      const allDistricts = store.districts || [
        'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul', 'Erode',
        'Kallakurichi', 'Kancheepuram', 'Kanniyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
        'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet',
        'Salem', 'Sivagangai', 'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli',
        'Tirunelveli', 'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore',
        'Viluppuram', 'Virudhunagar'
      ];
      const allSchools = (store.state && Array.isArray(store.state.schoolsMaster)) ? store.state.schoolsMaster : [];
      const totalOriginalCount = allSchools.length;

      // Compute available blocks (dynamic cascading from district filter)
      const blocksSource = this.schoolDistrictFilter !== 'ALL' 
        ? allSchools.filter(s => s.district && s.district.toLowerCase() === this.schoolDistrictFilter.toLowerCase())
        : allSchools;
      const availableBlocks = [...new Set(blocksSource.map(s => (s.block || '').trim()).filter(b => b))].sort();

      const filteredSchools = this.getFilteredSchools();
      const rows = this.renderSchoolRows(filteredSchools);

      return `
        <div style="background: var(--bg-card, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 14px; overflow: hidden; box-shadow: var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05));">
          <!-- 🔍 SEARCH BAR & FILTER TOOLBAR (Properly Aligned Single-Row Flex) -->
          <div style="padding: 0.85rem 1.25rem; border-bottom: 1px solid var(--border-color, #e2e8f0); background: var(--bg-main, #f8fafc); display: flex; flex-wrap: wrap; gap: 0.65rem; align-items: center;">
            
            <!-- Search Box with Icon and Live Filter -->
            <div class="search-box" style="flex: 1 1 260px; min-width: 220px; position: relative;">
              <i class="fas fa-search" style="position: absolute; left: 0.9rem; top: 50%; transform: translateY(-50%); color: var(--text-muted, #64748b); font-size: 0.85rem; pointer-events: none;"></i>
              <input type="text" 
                     id="adminSchoolSearchInput" 
                     value="${this.schoolSearchQuery || ''}" 
                     oninput="window.adminViews.handleSchoolSearch(this.value)" 
                     placeholder="Search school name, UDISE, district, block, AI name, phone..." 
                     class="form-control search-input" 
                     style="padding-left: 2.35rem; padding-right: 2rem; border-radius: 8px; font-size: 0.84rem; height: 38px; width: 100%; border: 1px solid var(--border-color, #cbd5e1); background: #ffffff; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
              ${this.schoolSearchQuery ? `<button type="button" onclick="window.adminViews.clearSchoolFilters()" style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.85rem;" title="Clear search"><i class="fas fa-times-circle"></i></button>` : ''}
            </div>

            <!-- District Filter -->
            <select id="adminSchoolDistrictFilter" 
                    onchange="window.adminViews.handleSchoolDistrictFilter(this.value)" 
                    class="filter-select" 
                    style="flex: 0 1 170px; min-width: 145px; border-radius: 8px; font-size: 0.82rem; height: 38px; font-weight: 600; border: 1px solid var(--border-color, #cbd5e1); background: #ffffff; cursor: pointer;">
              <option value="ALL" ${this.schoolDistrictFilter === 'ALL' ? 'selected' : ''}>All Districts (38)</option>
              ${allDistricts.map(d => `<option value="${d}" ${this.schoolDistrictFilter === d ? 'selected' : ''}>${d}</option>`).join('')}
            </select>

            <!-- 🏛️ Block / Taluk Filter (Dynamic Cascading) -->
            <select id="adminSchoolBlockFilter" 
                    onchange="window.adminViews.handleSchoolBlockFilter(this.value)" 
                    class="filter-select" 
                    style="flex: 0 1 155px; min-width: 130px; border-radius: 8px; font-size: 0.82rem; height: 38px; font-weight: 600; border: 1px solid var(--border-color, #cbd5e1); background: #ffffff; cursor: pointer;">
              <option value="ALL" ${this.schoolBlockFilter === 'ALL' ? 'selected' : ''}>All Blocks${availableBlocks.length > 0 ? ' (' + availableBlocks.length + ')' : ''}</option>
              ${availableBlocks.map(b => `<option value="${b}" ${this.schoolBlockFilter === b ? 'selected' : ''}>${b}</option>`).join('')}
            </select>

            <!-- Category Filter -->
            <select id="adminSchoolCategoryFilter" 
                    onchange="window.adminViews.handleSchoolCategoryFilter(this.value)" 
                    class="filter-select" 
                    style="flex: 0 1 125px; min-width: 110px; border-radius: 8px; font-size: 0.82rem; height: 38px; font-weight: 600; border: 1px solid var(--border-color, #cbd5e1); background: #ffffff; cursor: pointer;">
              <option value="ALL" ${this.schoolCategoryFilter === 'ALL' ? 'selected' : ''}>All Types</option>
              <option value="PUMS" ${this.schoolCategoryFilter === 'PUMS' ? 'selected' : ''}>PUMS</option>
              <option value="PUPS" ${this.schoolCategoryFilter === 'PUPS' ? 'selected' : ''}>PUPS</option>
              <option value="GHS" ${this.schoolCategoryFilter === 'GHS' ? 'selected' : ''}>GHS</option>
              <option value="GHSS" ${this.schoolCategoryFilter === 'GHSS' ? 'selected' : ''}>GHSS</option>
              <option value="HSS" ${this.schoolCategoryFilter === 'HSS' ? 'selected' : ''}>HSS</option>
            </select>

            <!-- Reset Button if Active Filter -->
            ${(this.schoolSearchQuery || this.schoolDistrictFilter !== 'ALL' || this.schoolBlockFilter !== 'ALL' || this.schoolCategoryFilter !== 'ALL') ? `
              <button type="button" onclick="window.adminViews.clearSchoolFilters()" class="btn btn-sm btn-outline" style="border-radius: 8px; font-size: 0.78rem; height: 38px; font-weight: 700; color: #ef4444; border-color: rgba(239,68,68,0.3); cursor: pointer; white-space: nowrap; padding: 0 0.75rem;" title="Reset filters">
                <i class="fas fa-rotate-left"></i> Reset
              </button>
            ` : ''}

            <!-- Bulk Import CSV Button -->
            <button type="button" onclick="window.adminViews.openBulkImportSchoolsModal()" class="btn btn-sm btn-outline" style="font-weight: 700; border-radius: 8px; cursor: pointer; font-size: 0.78rem; height: 38px; display: inline-flex; align-items: center; gap: 0.35rem; white-space: nowrap; padding: 0 0.85rem;">
              <i class="fas fa-file-import"></i> Bulk Import CSV
            </button>

            <!-- 🗺️ 38-District GPS Map & StackSchools Importer -->
            <button type="button" onclick="if(window.openTnSchoolGeoDirectory) window.openTnSchoolGeoDirectory();" class="btn btn-sm" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #ffffff; font-weight: 700; border-radius: 8px; border: none; cursor: pointer; font-size: 0.78rem; height: 38px; display: inline-flex; align-items: center; gap: 0.4rem; white-space: nowrap; padding: 0 0.85rem; box-shadow: 0 2px 6px rgba(2,132,199,0.25);">
              <i class="fas fa-map-location-dot"></i> TN Schools Geo-Map & StackSchools
            </button>

          </div>

          <!-- Secondary Counter Strip -->
          <div style="padding: 0.5rem 1.25rem; border-bottom: 1px solid var(--border-color, #e2e8f0); background: #ffffff; display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-muted, #64748b);">
            <div id="adminSchoolCountBadge">
              <i class="fas fa-list-check" style="color: #2563eb;"></i> Directory Records: <strong>${filteredSchools.length}</strong> / ${totalOriginalCount} Schools
            </div>
            <div style="font-size: 0.72rem;">
              Instant real-time search
            </div>
          </div>

          <!-- Table Body Grid -->
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="background: var(--bg-main, #f8fafc); border-bottom: 1px solid var(--border-color, #e2e8f0); font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted, #64748b);">
                  <th style="padding: 0.75rem 1rem;">UDISE</th>
                  <th style="padding: 0.75rem 1rem;">School & Location</th>
                  <th style="padding: 0.75rem 1rem;">Category</th>
                  <th style="padding: 0.75rem 1rem;">Labs</th>
                  <th style="padding: 0.75rem 1rem;">AI Contact</th>
                  <th style="padding: 0.75rem 1rem; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody id="adminSchoolTableBody">${rows}</tbody>
            </table>
          </div>
          <div id="adminSchoolCountSummary" style="padding: 0.75rem 1.25rem; border-top: 1px solid var(--border-color, #e2e8f0); background: var(--bg-main, #f8fafc); font-size: 0.72rem; color: var(--text-muted, #64748b); text-align: right;">
            Showing <strong>${filteredSchools.length}</strong> of <strong>${totalOriginalCount}</strong> schools in directory
          </div>
        </div>
      `;
    }

    // ═══════════════════════════════════════════════════════
    // TAB 4: ASSETS & DEFECT LOGS (Comprehensive Multi-Lab)
    // ═══════════════════════════════════════════════════════
    renderAssetsTab() {
      const store = window.adminStore || {};
      const state = store.state || {};
      const schools = (state.schoolsMaster && Array.isArray(state.schoolsMaster)) ? state.schoolsMaster : [];
      const defects = (state.defectLogs && Array.isArray(state.defectLogs)) ? state.defectLogs : [];
      const hardwareDefs = store.hardwareDefs || {};
      const hitechCatalog = hardwareDefs.HITECH_LAB || [];
      const smartCatalog = hardwareDefs.SMART_CLASSROOM || [];

      // Calculate totals across all schools
      const totalSchools = schools.length;
      let totalLabs = 0;
      schools.forEach(s => {
        totalLabs += (parseInt(s.labCount) || 1);
      });
      if (totalLabs === 0 && totalSchools > 0) totalLabs = totalSchools;

      const totalThinClients = totalLabs * 10;
      const totalServers = totalLabs * 1;
      const totalUps = totalLabs * 1;
      const totalBatteries = totalLabs * 14;
      const totalDefectCount = defects.reduce((sum, d) => sum + (parseInt(d.qty) || 1), 0);

      // Product complaint summary
      const summary = store.getProductComplaintSummary ? store.getProductComplaintSummary() : [];
      let summaryHtml = '';
      if (summary.length > 0) {
        let summaryRows = '';
        summary.forEach(s => {
          summaryRows += `
            <tr style="border-bottom: 1px solid var(--border-color, #e2e8f0);">
              <td style="padding: 0.7rem 1rem; font-weight: 700; font-size: 0.82rem; color: var(--text-primary);">${s.itemName}</td>
              <td style="padding: 0.7rem 1rem; font-weight: 800; font-size: 0.85rem; text-align: center;">${s.totalQty}</td>
              <td style="padding: 0.7rem 1rem; text-align: center; color: #f59e0b; font-weight: 700;">${s.faulty}</td>
              <td style="padding: 0.7rem 1rem; text-align: center; color: #ef4444; font-weight: 700;">${s.broken}</td>
              <td style="padding: 0.7rem 1rem; text-align: center; color: #8b5cf6; font-weight: 700;">${s.missing}</td>
              <td style="padding: 0.7rem 1rem; text-align: center; font-size: 0.8rem;">${s.schoolsAffected}</td>
            </tr>
          `;
        });

        summaryHtml = `
          <div style="background: var(--bg-card, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 14px; overflow: hidden; box-shadow: var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05));">
            <div style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-color, #e2e8f0); background: var(--bg-main, #f8fafc); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary);"><i class="fas fa-chart-bar" style="color: #ef4444;"></i> Product Complaint Aggregation</div>
                <div style="font-size: 0.72rem; color: var(--text-muted);">Defect clustering and failure trends across all school labs</div>
              </div>
              <span class="badge" style="background: rgba(239,68,68,0.1); color: #ef4444; font-weight: 800; font-size: 0.72rem;">${summary.length} Affected Models</span>
            </div>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                  <tr style="background: var(--bg-main, #f8fafc); font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted);">
                    <th style="padding: 0.7rem 1rem;">Product Component</th>
                    <th style="padding: 0.7rem 1rem; text-align: center;">Total Defective</th>
                    <th style="padding: 0.7rem 1rem; text-align: center;">⚠ Faulty</th>
                    <th style="padding: 0.7rem 1rem; text-align: center;">💥 Broken</th>
                    <th style="padding: 0.7rem 1rem; text-align: center;">❌ Missing</th>
                    <th style="padding: 0.7rem 1rem; text-align: center;">Schools Affected</th>
                  </tr>
                </thead>
                <tbody>${summaryRows}</tbody>
              </table>
            </div>
          </div>
        `;
      }

      // Catalog Table Rows
      let catalogRows = '';
      hitechCatalog.forEach((item, idx) => {
        const statewideTotal = item.unitQty * totalLabs;
        catalogRows += `
          <tr style="border-bottom: 1px solid var(--border-color, #e2e8f0);">
            <td style="padding: 0.65rem 0.9rem; font-size: 0.75rem; color: var(--text-muted); font-weight: 700; width: 40px; text-align: center;">${idx + 1}</td>
            <td style="padding: 0.65rem 0.9rem;">
              <div style="font-weight: 700; font-size: 0.82rem; color: var(--text-primary);">${item.name}</div>
              <div style="font-size: 0.68rem; color: var(--text-muted);">${item.desc} • Brand: <strong>${item.brand}</strong></div>
            </td>
            <td style="padding: 0.65rem 0.9rem; text-align: center; font-size: 0.8rem; font-weight: 700;">${item.unitQty} ${item.unit}</td>
            <td style="padding: 0.65rem 0.9rem; text-align: center; font-size: 0.85rem; font-weight: 800; color: #2563eb;">${statewideTotal.toLocaleString()} ${item.unit}</td>
            <td style="padding: 0.65rem 0.9rem; text-align: center;">
              <span class="badge" style="background: rgba(16,185,129,0.1); color: #10b981; font-weight: 800; font-size: 0.68rem; padding: 0.15rem 0.45rem; border-radius: 6px;">✓ Standard Spec</span>
            </td>
          </tr>
        `;
      });

      // Defect log table
      let defectRows = '';
      defects.forEach(d => {
        const typeColor = { 'Faulty': '#f59e0b', 'Broken': '#ef4444', 'Missing': '#8b5cf6', 'Needs Replacement': '#ef4444' }[d.defectType] || '#ef4444';
        defectRows += `
          <tr style="border-bottom: 1px solid var(--border-color, #e2e8f0);">
            <td style="padding: 0.8rem 1rem; font-size: 0.78rem; font-weight: 700; color: var(--text-muted);">${d.reportedDate || 'N/A'}</td>
            <td style="padding: 0.8rem 1rem;">
              <div style="font-weight: 700; font-size: 0.82rem; color: var(--text-primary);">${d.schoolName}</div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">${d.district || 'NAGAPATTINAM'} • UDISE: ${d.udise || 'N/A'} • <strong>${d.labNo || 'Lab 1'}</strong></div>
            </td>
            <td style="padding: 0.8rem 1rem; font-weight: 800; font-size: 0.82rem; color: #2563eb;">${d.qty || 1}x ${d.itemName}</td>
            <td style="padding: 0.8rem 1rem;">
              <span style="background: rgba(239,68,68,0.1); color: ${typeColor}; font-size: 0.72rem; font-weight: 800; padding: 0.18rem 0.5rem; border-radius: 6px;">${d.defectType || 'Faulty'}</span>
            </td>
            <td style="padding: 0.8rem 1rem; font-size: 0.75rem; color: var(--text-secondary); max-width: 220px;">${d.remarks || 'Field inspection ticket logged.'}</td>
            <td style="padding: 0.8rem 1rem; text-align: right;">
              <button type="button" onclick="window.adminViews.deleteDefect('${d.id}')" class="btn btn-xs btn-outline" style="color: #ef4444; border-color: rgba(239,68,68,0.3); font-size: 0.68rem; padding: 0.2rem 0.45rem; cursor: pointer;" title="Delete defect entry">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
      });

      return `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          
          <!-- 1. STATEWIDE MULTI-LAB KPI SUMMARY CARDS -->
          <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px;">
            ${this._kpiCard('Schools Tracked', totalSchools, 'blue', 'In Directory', 'fa-school')}
            ${this._kpiCard('Hi-Tech Labs', totalLabs, 'amber', 'Configured Units', 'fa-network-wired')}
            ${this._kpiCard('Thin Clients / PCs', totalThinClients, 'green', '10 per Lab Multiplier', 'fa-desktop')}
            ${this._kpiCard('Master Servers', totalServers, 'purple', '1 per Lab', 'fa-server')}
            ${this._kpiCard('5/6 KVA Online UPS', totalUps, 'blue', 'Main Power Backup', 'fa-bolt')}
            ${this._kpiCard('UPS Batteries (12V)', totalBatteries, 'amber', '14 per 5KVA Lab Bank', 'fa-car-battery')}
            ${this._kpiCard('Logged Defects', totalDefectCount, totalDefectCount > 0 ? 'red' : 'green', totalDefectCount > 0 ? 'Needs Attention' : 'All Clear', 'fa-wrench')}
          </div>

          <!-- 2. PRODUCT COMPLAINT AGGREGATION (if any) -->
          ${summaryHtml}

          <!-- 3. STANDARD ICT HI-TECH LAB HARDWARE CATALOG (16 CORE ITEMS) -->
          <div style="background: var(--bg-card, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 14px; overflow: hidden; box-shadow: var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05));">
            <div style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-color, #e2e8f0); background: var(--bg-main, #f8fafc); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <div style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary);"><i class="fas fa-cubes-stacked" style="color: #2563eb;"></i> Standard Hi-Tech Lab Equipment Specifications (16 Core Items)</div>
                <div style="font-size: 0.72rem; color: var(--text-muted);">Per-lab baseline multipliers & statewide asset allocation</div>
              </div>
              <button type="button" onclick="window.adminViews.openDefectModal()" class="btn btn-sm btn-primary" style="font-size: 0.78rem; font-weight: 700; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 0.35rem;">
                <i class="fas fa-plus"></i> Log Hardware Defect
              </button>
            </div>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                  <tr style="background: var(--bg-main, #f8fafc); font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted);">
                    <th style="padding: 0.65rem 0.9rem; text-align: center;">#</th>
                    <th style="padding: 0.65rem 0.9rem;">Equipment & Specification</th>
                    <th style="padding: 0.65rem 0.9rem; text-align: center;">Per-Lab Qty</th>
                    <th style="padding: 0.65rem 0.9rem; text-align: center;">Statewide Total (${totalLabs} Labs)</th>
                    <th style="padding: 0.65rem 0.9rem; text-align: center;">Standard Status</th>
                  </tr>
                </thead>
                <tbody>${catalogRows}</tbody>
              </table>
            </div>
          </div>

          <!-- 4. LIVE HARDWARE DEFECT & REPLACEMENT LOG TABLE -->
          <div style="background: var(--bg-card, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 14px; overflow: hidden; box-shadow: var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05));">
            <div style="padding: 1.1rem 1.25rem; border-bottom: 1px solid var(--border-color, #e2e8f0); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <div style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary);"><i class="fas fa-wrench" style="color: #8b5cf6;"></i> Live Hardware Defect & Replacement Log</div>
                <div style="font-size: 0.72rem; color: var(--text-muted);">Chain-reaction defect records from field inspections</div>
              </div>
              <span class="badge" style="background: rgba(37,99,235,0.08); color: #2563eb; font-weight: 800; font-size: 0.72rem;">${defects.length} Defect Log(s)</span>
            </div>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                  <tr style="background: var(--bg-main, #f8fafc); font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted);">
                    <th style="padding: 0.7rem 1rem;">Date</th>
                    <th style="padding: 0.7rem 1rem;">School & Lab</th>
                    <th style="padding: 0.7rem 1rem;">Item & Qty</th>
                    <th style="padding: 0.7rem 1rem;">Condition</th>
                    <th style="padding: 0.7rem 1rem;">Remarks</th>
                    <th style="padding: 0.7rem 1rem; text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${defectRows || '<tr><td colspan="6" style="text-align:center; padding: 2rem; color:var(--text-muted);">No hardware defects reported yet. Click "+ Log Defect" to record an issue.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }

    // ═══════════════════════════════════════════════════════
    // TAB 5: CALENDAR REPORTS (REAL DATE FILTERING)
    // ═══════════════════════════════════════════════════════
    renderReportsTab(calls) {
      // Show filtered results if available
      let filteredResultsHtml = '';
      if (this.filteredCalls !== null) {
        const fc = this.filteredCalls;
        const fd = this.filteredDefects || [];
        const fcCompleted = fc.filter(c => c.status === 'Completed').length;
        const fcInProgress = fc.filter(c => c.status === 'In Progress').length;
        const fcNotStarted = fc.filter(c => c.status === 'Not Started').length;

        let callRows = '';
        fc.slice(0, 50).forEach(c => {
          const statusColor = { 'Completed': '#10b981', 'In Progress': '#3b82f6', 'Not Started': '#f59e0b' }[c.status] || '#64748b';
          callRows += `
            <tr style="border-bottom: 1px solid var(--border-color, #e2e8f0);">
              <td style="padding: 0.6rem 0.8rem; font-size: 0.76rem; color: var(--text-muted);">${c.dateRegistered || 'N/A'}</td>
              <td style="padding: 0.6rem 0.8rem; font-weight: 700; font-size: 0.8rem;">${c.schoolName || 'N/A'}</td>
              <td style="padding: 0.6rem 0.8rem; font-size: 0.76rem;">${c.district || 'N/A'}</td>
              <td style="padding: 0.6rem 0.8rem; font-size: 0.76rem; max-width: 200px;">${c.issue || 'Service Call'}</td>
              <td style="padding: 0.6rem 0.8rem;">
                <span style="background: rgba(0,0,0,0.05); color: ${statusColor}; font-weight: 800; font-size: 0.7rem; padding: 0.15rem 0.4rem; border-radius: 5px;">${c.status}</span>
              </td>
              <td style="padding: 0.6rem 0.8rem; font-size: 0.76rem; text-align: center;">${c.ageDays || 0}d</td>
            </tr>
          `;
        });

        filteredResultsHtml = `
          <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 1.25rem;">
            ${this._kpiCard('Filtered Calls', fc.length, 'blue', this.dateRange.start + ' → ' + this.dateRange.end, 'fa-list-check')}
            ${this._kpiCard('Completed', fcCompleted, 'green', fc.length > 0 ? Math.round((fcCompleted/fc.length)*100) + '%' : '0%', 'fa-check-double')}
            ${this._kpiCard('In Progress', fcInProgress, 'amber', 'Active tickets', 'fa-spinner')}
            ${this._kpiCard('Not Started', fcNotStarted, 'purple', 'Pending tickets', 'fa-clock')}
            ${this._kpiCard('Defects', fd.length, 'red', 'In Selected Period', 'fa-wrench')}
          </div>

          <div style="background: var(--bg-card, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; overflow: hidden;">
            <div style="padding: 0.85rem 1rem; border-bottom: 1px solid var(--border-color, #e2e8f0); font-weight: 800; font-size: 0.85rem; color: var(--text-primary);">
              Filtered Results — ${fc.length} calls ${fc.length > 50 ? '(showing first 50)' : ''}
            </div>
            <div style="overflow-x: auto; max-height: 400px; overflow-y: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                  <tr style="background: var(--bg-main, #f8fafc); font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); position: sticky; top: 0;">
                    <th style="padding: 0.6rem 0.8rem;">Date</th>
                    <th style="padding: 0.6rem 0.8rem;">School</th>
                    <th style="padding: 0.6rem 0.8rem;">District</th>
                    <th style="padding: 0.6rem 0.8rem;">Issue</th>
                    <th style="padding: 0.6rem 0.8rem;">Status</th>
                    <th style="padding: 0.6rem 0.8rem; text-align: center;">Age</th>
                  </tr>
                </thead>
                <tbody>${callRows || '<tr><td colspan="6" style="text-align:center; padding: 1.5rem; color:var(--text-muted);">No calls in selected period.</td></tr>'}</tbody>
              </table>
            </div>
          </div>
        `;
      }

      return `
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          <div style="background: var(--bg-card, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 14px; padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
              <div>
                <div style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary);"><i class="fas fa-calendar-days" style="color: #2563eb;"></i> Calendar Historical Reports</div>
                <div style="font-size: 0.76rem; color: var(--text-muted);">Query calls, defects, and engineer activity across any date range</div>
              </div>
              <button type="button" onclick="if(window.exporter && window.exporter.exportToExcel) window.exporter.exportToExcel();" class="btn btn-sm btn-primary" style="background: linear-gradient(135deg, #107c41, #0b5e31); font-weight: 700; border-radius: 8px; cursor: pointer;">
                <i class="fas fa-file-excel"></i> Export Excel
              </button>
            </div>

            <div style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; padding: 1rem; background: var(--bg-main, #f8fafc); border-radius: 10px;">
              <div style="display: flex; flex-direction: column; gap: 0.3rem;">
                <label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">From Date</label>
                <input type="date" id="adminReportStartDate" class="form-input" style="padding: 0.4rem 0.6rem; font-size: 0.8rem; border-radius: 6px; border: 1px solid var(--border-color, #e2e8f0);">
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.3rem;">
                <label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">To Date</label>
                <input type="date" id="adminReportEndDate" class="form-input" style="padding: 0.4rem 0.6rem; font-size: 0.8rem; border-radius: 6px; border: 1px solid var(--border-color, #e2e8f0);">
              </div>
              <button type="button" onclick="window.adminViews.applyDateFilter()" class="btn btn-sm btn-primary" style="padding: 0.45rem 0.9rem; font-weight: 700; border-radius: 6px; cursor: pointer;">
                <i class="fas fa-filter"></i> Apply Date Filter
              </button>
              ${this.filteredCalls !== null ? '<button type="button" onclick="window.adminViews.clearDateFilter()" class="btn btn-sm btn-outline" style="padding: 0.45rem 0.9rem; font-weight: 700; border-radius: 6px; cursor: pointer;"><i class="fas fa-times"></i> Clear</button>' : ''}
            </div>
          </div>

          ${filteredResultsHtml}

          ${!this.filteredCalls ? `<div style="padding: 2rem; text-align: center; border: 1.5px dashed var(--border-color, #e2e8f0); border-radius: 12px; color: var(--text-secondary); font-size: 0.85rem; background: var(--bg-card, #ffffff);">
            <i class="fas fa-calendar-check" style="font-size: 2rem; color: #2563eb; display: block; margin-bottom: 0.5rem;"></i>
            Select a date range above and click "Apply Date Filter" to query historical records.
          </div>` : ''}
        </div>
      `;
    }

    applyDateFilter() {
      const startEl = document.getElementById('adminReportStartDate');
      const endEl = document.getElementById('adminReportEndDate');
      const start = startEl ? startEl.value : '';
      const end = endEl ? endEl.value : '';

      if (!start && !end) {
        alert('Please select at least one date (From or To).');
        return;
      }

      this.dateRange = { start: start || '2020-01-01', end: end || new Date().toISOString().split('T')[0] };
      
      const store = window.adminStore;
      this.filteredCalls = store ? store.getFilteredCalls(this.dateRange.start, this.dateRange.end) : [];
      this.filteredDefects = store ? store.getFilteredDefects(this.dateRange.start, this.dateRange.end) : [];
      
      this.render();
    }

    clearDateFilter() {
      this.filteredCalls = null;
      this.filteredDefects = null;
      this.dateRange = { start: '', end: '' };
      this.render();
    }

    // ═══════════════════════════════════════════════════════
    // TAB 6: UNIVERSAL SEARCH
    // ═══════════════════════════════════════════════════════
    renderSearchTab(calls) {
      return `
        <div style="background: var(--bg-card, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
          <div>
            <div style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary);"><i class="fas fa-magnifying-glass" style="color: #2563eb;"></i> Universal Search Engine</div>
            <div style="font-size: 0.76rem; color: var(--text-muted);">Instant search by Engineer, UDISE, District, School, Equipment, or AI Name</div>
          </div>
          <div style="position: relative;">
            <i class="fas fa-search" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
            <input type="text" id="adminUniversalSearchInput" oninput="window.adminViews.handleUniversalSearch(this.value)" placeholder="Search any UDISE, Engineer, District, or School..." style="width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border-radius: 10px; border: 1px solid var(--border-color, #e2e8f0); background: var(--bg-main, #f8fafc); font-size: 0.88rem; color: var(--text-primary); box-sizing: border-box;">
          </div>
          <div id="adminSearchResults" style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 450px; overflow-y: auto;">
            <div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 2rem;">
              Type in the search bar above to find any school, engineer, or hardware defect.
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
        resultsEl.innerHTML = '<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 2rem;">Type in the search bar above to find any school, engineer, or hardware defect.</div>';
        return;
      }

      const store = window.adminStore || {};
      const state = store.state || {};
      const calls = (window.appStore && Array.isArray(window.appStore.calls)) ? window.appStore.calls : [];

      const matchedEngineers = (state.engineers || []).filter(e => 
        (e.name && e.name.toLowerCase().includes(q)) || (e.empId && e.empId.includes(q)) || ((e.assignedDistricts || []).some(d => d.toLowerCase().includes(q)))
      );

      const matchedSchools = (state.schoolsMaster || []).filter(s => 
        (s.schoolName && s.schoolName.toLowerCase().includes(q)) || (s.udise && s.udise.includes(q)) || (s.aiName && s.aiName.toLowerCase().includes(q)) || (s.aiPhone && s.aiPhone.includes(q)) || (s.category && s.category.toLowerCase().includes(q))
      );

      const matchedCalls = calls.filter(c => 
        (c.schoolName && c.schoolName.toLowerCase().includes(q)) ||
        (c.udise && c.udise.includes(q)) ||
        (c.issue && c.issue.toLowerCase().includes(q)) ||
        (c.district && c.district.toLowerCase().includes(q))
      );

      const matchedDefects = (state.defectLogs || []).filter(d =>
        (d.itemName && d.itemName.toLowerCase().includes(q)) ||
        (d.schoolName && d.schoolName.toLowerCase().includes(q)) ||
        (d.defectType && d.defectType.toLowerCase().includes(q))
      );

      let html = '';

      if (matchedEngineers.length > 0) {
        html += '<div style="font-weight: 800; font-size: 0.78rem; color: #2563eb; text-transform: uppercase;">Field Engineers:</div>';
        matchedEngineers.forEach(eng => {
          html += `<div style="padding: 0.75rem; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px;">
            <div style="font-weight: 700; font-size: 0.85rem;">${eng.name} (#${eng.empId})</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Districts: <strong>${(eng.assignedDistricts || []).join(', ')}</strong> • Status: ${eng.status}</div>
          </div>`;
        });
      }

      if (matchedSchools.length > 0) {
        html += '<div style="font-weight: 800; font-size: 0.78rem; color: #10b981; text-transform: uppercase; margin-top: 0.5rem;">Schools & AI:</div>';
        matchedSchools.forEach(s => {
          html += `<div style="padding: 0.75rem; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px;">
            <div style="font-weight: 700; font-size: 0.85rem;">${s.schoolName} (${s.category}) • UDISE: ${s.udise}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">AI: <strong>${s.aiName}</strong> (📞 ${s.aiPhone}) • ${s.labCount} Lab(s)</div>
          </div>`;
        });
      }

      if (matchedDefects.length > 0) {
        html += `<div style="font-weight: 800; font-size: 0.78rem; color: #ef4444; text-transform: uppercase; margin-top: 0.5rem;">Hardware Defects (${matchedDefects.length}):</div>`;
        matchedDefects.slice(0, 10).forEach(d => {
          html += `<div style="padding: 0.75rem; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px;">
            <div style="font-weight: 700; font-size: 0.85rem;">${d.qty}x ${d.itemName} — ${d.defectType}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${d.schoolName} • ${d.labNo} • ${d.reportedDate}</div>
          </div>`;
        });
      }

      if (matchedCalls.length > 0) {
        html += `<div style="font-weight: 800; font-size: 0.78rem; color: #f59e0b; text-transform: uppercase; margin-top: 0.5rem;">Calls (${matchedCalls.length}):</div>`;
        matchedCalls.slice(0, 10).forEach(c => {
          html += `<div style="padding: 0.75rem; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px;">
            <div style="font-weight: 700; font-size: 0.85rem;">${c.schoolName || 'School'} [${c.status}]</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Issue: ${c.issue || 'N/A'} • ${c.district || ''} • ${c.ageDays || 0}d</div>
          </div>`;
        });
      }

      if (!html) {
        html = '<div style="text-align:center; padding: 2rem; color: var(--text-muted); font-size: 0.8rem;">No records found matching "' + query + '".</div>';
      }

      resultsEl.innerHTML = html;
    }

    // ═══════════════════════════════════════════════════════
    // MODALS: ENGINEER CRUD
    // ═══════════════════════════════════════════════════════

    openAddEngineerModal() {
      const districts = (window.adminStore && window.adminStore.tnDistricts) || [];
      let distOpts = districts.map(d => `<option value="${d}">${d}</option>`).join('');

      this._showModal('adminAddEngModal', 'Add New Field Engineer', `
        <div style="display: flex; flex-direction: column; gap: 0.85rem; padding: 0.5rem 0;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Full Name *</label>
            <input type="text" id="newEngName" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;" placeholder="e.g. Rajesh Kumar"></div>
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Employee ID *</label>
            <input type="text" id="newEngEmpId" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;" placeholder="e.g. 575"></div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Phone</label>
            <input type="text" id="newEngPhone" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;" placeholder="9876543210"></div>
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Email</label>
            <input type="text" id="newEngEmail" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;" placeholder="name@kssmart.co"></div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Base Location</label>
            <input type="text" id="newEngBase" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;" placeholder="e.g. Thanjavur"></div>
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Login Password</label>
            <input type="text" id="newEngPassword" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;" placeholder="e.g. ks123"></div>
          </div>
        </div>
      `, () => {
        const data = {
          name: document.getElementById('newEngName').value,
          empId: document.getElementById('newEngEmpId').value,
          phone: document.getElementById('newEngPhone').value,
          email: document.getElementById('newEngEmail').value,
          baseLocation: document.getElementById('newEngBase').value,
          password: document.getElementById('newEngPassword').value
        };
        const res = window.adminStore.addEngineer(data);
        alert(res.message);
        if (res.success) { this._closeModal('adminAddEngModal'); this.render(); }
      });
    }

    openEditEngineerModal(empId) {
      const eng = (window.adminStore.state.engineers || []).find(e => e.empId === empId);
      if (!eng) return;

      this._showModal('adminEditEngModal', `Edit Engineer: ${eng.name} (#${empId})`, `
        <div style="display: flex; flex-direction: column; gap: 0.85rem; padding: 0.5rem 0;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Full Name</label>
            <input type="text" id="editEngName" value="${eng.name}" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;"></div>
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Emp ID</label>
            <input type="text" value="${eng.empId}" disabled class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; background: var(--bg-main); box-sizing:border-box;"></div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Phone</label>
            <input type="text" id="editEngPhone" value="${eng.phone}" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;"></div>
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Email</label>
            <input type="text" id="editEngEmail" value="${eng.email}" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;"></div>
          </div>
          <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Base Location</label>
          <input type="text" id="editEngBase" value="${eng.baseLocation}" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;"></div>
        </div>
      `, () => {
        const res = window.adminStore.updateEngineer(empId, {
          name: document.getElementById('editEngName').value,
          phone: document.getElementById('editEngPhone').value,
          email: document.getElementById('editEngEmail').value,
          baseLocation: document.getElementById('editEngBase').value
        });
        alert(res.message);
        if (res.success) { this._closeModal('adminEditEngModal'); this.render(); }
      });
    }

    confirmDeactivateEngineer(empId) {
      const eng = (window.adminStore.state.engineers || []).find(e => e.empId === empId);
      if (!eng) return;
      if (confirm(`Are you sure you want to deactivate engineer "${eng.name}" (#${empId})? They will no longer appear in active rosters.`)) {
        const res = window.adminStore.deleteEngineer(empId);
        alert(res.message);
        this.render();
      }
    }

    // ═══════════════════════════════════════════════════════
    // MODALS: SCHOOL CRUD
    // ═══════════════════════════════════════════════════════

    openAddSchoolModal() {
      const cats = (window.adminStore && window.adminStore.schoolCategories) || ['PUPS', 'PUMS', 'GHS', 'GHSS', 'HSS'];
      const districts = (window.adminStore && window.adminStore.tnDistricts) || [];
      let catOpts = cats.map(c => `<option value="${c}">${c}</option>`).join('');
      let distOpts = districts.map(d => `<option value="${d}">${d}</option>`).join('');

      this._showModal('adminAddSchoolModal', 'Add New School', `
        <div style="display: flex; flex-direction: column; gap: 0.85rem; padding: 0.5rem 0;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">UDISE Code *</label>
            <input type="text" id="newSchUdise" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;" placeholder="e.g. 33190400501"></div>
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">School Name *</label>
            <input type="text" id="newSchName" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;" placeholder="e.g. PUMS KEEZHAIYUR"></div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.85rem;">
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Category</label>
            <select id="newSchCategory" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem;">${catOpts}</select></div>
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">District</label>
            <select id="newSchDistrict" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem;">${distOpts}</select></div>
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Block</label>
            <input type="text" id="newSchBlock" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;" placeholder="Block name"></div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">AI Name</label>
            <input type="text" id="newSchAiName" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;" placeholder="AI (Administrator-cum-Instructor)"></div>
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">AI Phone</label>
            <input type="text" id="newSchAiPhone" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;" placeholder="9876543210"></div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">No. of Hi-Tech Labs</label>
            <input type="number" id="newSchLabCount" value="1" min="1" max="15" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;"></div>
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Lab Type</label>
            <select id="newSchLabType" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem;">
              <option value="Hi-Tech Lab">Hi-Tech Lab</option>
              <option value="Smart Classroom">Smart Classroom</option>
            </select></div>
          </div>
        </div>
      `, () => {
        const res = window.adminStore.addSchool({
          udise: document.getElementById('newSchUdise').value,
          schoolName: document.getElementById('newSchName').value,
          category: document.getElementById('newSchCategory').value,
          district: document.getElementById('newSchDistrict').value,
          block: document.getElementById('newSchBlock').value,
          aiName: document.getElementById('newSchAiName').value,
          aiPhone: document.getElementById('newSchAiPhone').value,
          labCount: document.getElementById('newSchLabCount').value,
          labType: document.getElementById('newSchLabType').value
        });
        alert(res.message);
        if (res.success) { this._closeModal('adminAddSchoolModal'); this.render(); }
      });
    }

    openEditSchoolModal(udise) {
      const school = (window.adminStore.state.schoolsMaster || []).find(s => s.udise === udise);
      if (!school) return;

      const cats = (window.adminStore && window.adminStore.schoolCategories) || ['PUPS', 'PUMS', 'GHS', 'GHSS', 'HSS'];
      let catOpts = cats.map(c => `<option value="${c}" ${c === school.category ? 'selected' : ''}>${c}</option>`).join('');

      this._showModal('adminEditSchoolModal', `Edit School: ${school.schoolName}`, `
        <div style="display: flex; flex-direction: column; gap: 0.85rem; padding: 0.5rem 0;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">UDISE</label>
            <input type="text" value="${school.udise}" disabled class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; background: var(--bg-main); box-sizing:border-box;"></div>
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">School Name</label>
            <input type="text" id="editSchName" value="${school.schoolName}" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;"></div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.85rem;">
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Category</label>
            <select id="editSchCategory" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem;">${catOpts}</select></div>
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Block</label>
            <input type="text" id="editSchBlock" value="${school.block}" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;"></div>
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Labs</label>
            <input type="number" id="editSchLabCount" value="${school.labCount}" min="1" max="15" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;"></div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">AI Name</label>
            <input type="text" id="editSchAiName" value="${school.aiName}" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;"></div>
            <div><label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">AI Phone</label>
            <input type="text" id="editSchAiPhone" value="${school.aiPhone}" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;"></div>
          </div>
        </div>
      `, () => {
        const res = window.adminStore.updateSchool(udise, {
          schoolName: document.getElementById('editSchName').value,
          category: document.getElementById('editSchCategory').value,
          block: document.getElementById('editSchBlock').value,
          labCount: document.getElementById('editSchLabCount').value,
          aiName: document.getElementById('editSchAiName').value,
          aiPhone: document.getElementById('editSchAiPhone').value
        });
        alert(res.message);
        if (res.success) { this._closeModal('adminEditSchoolModal'); this.render(); }
      });
    }

    confirmDeleteSchool(udise) {
      const school = (window.adminStore.state.schoolsMaster || []).find(s => s.udise === udise);
      if (!school) return;
      if (confirm(`Delete school "${school.schoolName}" (UDISE: ${udise})? This cannot be undone.`)) {
        const res = window.adminStore.deleteSchool(udise);
        alert(res.message);
        this.render();
      }
    }

    // ═══════════════════════════════════════════════════════
    // BULK IMPORT MODALS & TEMPLATE GENERATION
    // ═══════════════════════════════════════════════════════

    downloadSchoolTemplate() {
      const csv = `UDISE,School Name,Category,District,Block,AI Name,AI Phone,Lab Count,Lab Type\n33190600201,PUMS EXAMPLE SCHOOL,PUMS,NAGAPATTINAM,Vedaranyam,K. Teacher,9876543210,1,Hi-Tech Lab\n33190102201,PUMS THERKKU POIGAINALLUR,PUMS,NAGAPATTINAM,Nagapattinam,M. Rajalakshmi,6382800142,1,Hi-Tech Lab\n33190400501,PUMS VILUNTHAMAVADI WEST,PUMS,NAGAPATTINAM,Keezhaiyur,K. Senthil Nathan,6384147212,1,Hi-Tech Lab`;
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'TN_School_AI_Directory_Template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    downloadCallsTemplate() {
      const csv = `School Name,UDISE,District,Contact Person,Contact No,Issue,Date,Priority\nPUMS EXAMPLE,33190600201,NAGAPATTINAM,K. Teacher,9876543210,UPS not working,2026-08-15,High\nGHSS NAGAPATTINAM,33190100101,NAGAPATTINAM,R. Headmaster,9444123456,Projector Lamp replacement,2026-08-16,Normal`;
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Statewide_Calls_Import_Template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    openBulkImportSchoolsModal() {
      this._showModal('adminBulkSchoolModal', 'Bulk Import Schools & AI Directory', `
        <div style="display: flex; flex-direction: column; gap: 1rem; padding: 0.25rem 0;">
          
          <!-- Instructions & Template Banner -->
          <div style="background: linear-gradient(135deg, rgba(37,99,235,0.06), rgba(59,130,246,0.1)); border: 1px solid rgba(37,99,235,0.2); border-radius: 10px; padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.6rem;">
            <div>
              <div style="font-weight: 800; font-size: 0.85rem; color: #1e40af;"><i class="fas fa-file-excel"></i> Upload or Paste School Directory (.xlsx, .xls, .csv)</div>
              <div style="font-size: 0.72rem; color: var(--text-secondary, #475569); margin-top: 2px;">Expected columns: <code>UDISE, School Name, Category, District, Block, AI Name, AI Phone, Lab Count, Lab Type</code></div>
            </div>
            <button type="button" onclick="window.adminViews.downloadSchoolTemplate()" class="btn btn-sm btn-outline" style="background:#ffffff; color:#2563eb; border-color:#2563eb; font-weight:700; font-size:0.75rem; border-radius:6px; cursor:pointer;">
              <i class="fas fa-download"></i> Sample CSV
            </button>
          </div>

          <!-- Drag & Drop / File Input Dropzone -->
          <div id="schoolDropzone" 
               onclick="document.getElementById('schoolFileInput').click()" 
               ondragover="event.preventDefault(); this.style.borderColor='#2563eb'; this.style.background='rgba(37,99,235,0.08)';"
               ondragleave="this.style.borderColor='#94a3b8'; this.style.background='var(--bg-main)';"
               ondrop="event.preventDefault(); this.style.borderColor='#94a3b8'; this.style.background='var(--bg-main)'; if(event.dataTransfer.files.length) window.adminViews.handleSchoolDrop(event.dataTransfer.files[0]);"
               style="border: 2px dashed #94a3b8; border-radius: 10px; padding: 1.25rem; text-align: center; background: var(--bg-main, #f8fafc); cursor: pointer; transition: all 0.2s ease;">
            <i class="fas fa-cloud-arrow-up" style="font-size: 1.75rem; color: #2563eb; margin-bottom: 0.35rem; display: block;"></i>
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary, #0f172a);">Click to browse or Drag & Drop Excel (.xlsx, .xls) / CSV</div>
            <div style="font-size: 0.7rem; color: var(--text-muted, #64748b);">Direct Excel spreadsheet reading or paste cells below</div>
            <input type="file" id="schoolFileInput" accept=".xlsx,.xls,.csv,.txt" style="display: none;" onchange="window.adminViews.handleSchoolFileUpload(this)">
          </div>

          <!-- Paste Area -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <label style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Or Paste CSV / Tab-Delimited Excel Cells:</label>
              <span id="schoolParsedCountBadge" style="font-size: 0.72rem; font-weight: 800; color: #2563eb;"></span>
            </div>
            <textarea id="bulkSchoolsCsvData" rows="6" oninput="window.adminViews.previewSchoolParsedData(this.value)" placeholder="UDISE,School Name,Category,District,Block,AI Name,AI Phone,Lab Count,Lab Type
33190600201,PUMS EXAMPLE SCHOOL,PUMS,NAGAPATTINAM,Vedaranyam,K. Teacher,9876543210,1,Hi-Tech Lab" style="width: 100%; padding: 0.65rem 0.85rem; border: 1.5px solid var(--border-color, #cbd5e1); border-radius: 8px; font-family: monospace; font-size: 0.76rem; resize: vertical; box-sizing: border-box; background: #ffffff;"></textarea>
          </div>

          <!-- Live Preview Container -->
          <div id="schoolParsedPreviewBox" style="display: none; max-height: 140px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-main);"></div>

        </div>
      `, () => {
        const csvText = document.getElementById('bulkSchoolsCsvData').value;
        const parsed = this._parseCsv(csvText);
        if (parsed.length === 0) { alert('No valid data found. Please upload an Excel/CSV file or paste table data.'); return; }
        
        // Smart normalization of all government & vendor formats
        const normalized = parsed.map((r, idx) => this.normalizeSchoolRow(r, idx)).filter(s => s && (s.udise || s.schoolName || s.aiName));

        if (normalized.length === 0) { alert('No valid school or AI records found. Please check data.'); return; }

        const res = window.adminStore.bulkImportSchools(normalized);
        alert(res.message);
        if (res.success) { this._closeModal('adminBulkSchoolModal'); this.render(); }
      }, 'Import Schools');
    }

    normalizeSchoolRow(rawRow, index) {
      if (!rawRow || typeof rawRow !== 'object') return null;
      const keys = Object.keys(rawRow);
      const cleanKey = (k) => String(k || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      const findVal = (candidates) => {
        const cleanedCandidates = candidates.map(cleanKey);
        // Exact match
        for (const k of keys) {
          const ck = cleanKey(k);
          if (cleanedCandidates.includes(ck)) {
            const val = rawRow[k];
            if (val !== undefined && val !== null && String(val).trim() !== '') {
              return String(val).trim();
            }
          }
        }
        // Substring match
        for (const k of keys) {
          const ck = cleanKey(k);
          for (const cand of cleanedCandidates) {
            if (ck.length > 2 && (ck.includes(cand) || cand.includes(ck))) {
              const val = rawRow[k];
              if (val !== undefined && val !== null && String(val).trim() !== '') {
                return String(val).trim();
              }
            }
          }
        }
        return '';
      };

      // 1. AI Name & Contact
      const aiName = findVal(['name as per aadhar', 'ai name', 'instructor name', 'staff name', 'teacher name', 'employee name', 'instructor', 'ai', 'teacher', 'name']);
      const aiPhone = findVal(['mobile number', 'mobile no', 'contact number', 'contact no', 'phone number', 'phone no', 'ai phone', 'mobile', 'phone', 'contact', 'cell']);
      const aiId = findVal(['ai id', 'ai_id', 'instructor id', 'staff id', 'emp id', 'employee id', 'ai code', 'id']);

      // 2. Location
      let district = findVal(['district name', 'district', 'dist', 'revenue district']) || 'NAGAPATTINAM';
      const block = findVal(['block name', 'block', 'taluk', 'zone', 'union', 'educational block']);

      // 3. UDISE & Identification
      let udise = findVal(['udise code', 'udisecode', 'udise', 'school code', 'schoolcode', 'emis code', 'emiscode', 'emis']);
      if (!udise) {
        if (aiId) udise = 'AI-' + aiId.replace(/^_+/, '');
        else if (aiPhone) udise = 'AI-' + aiPhone.slice(-6);
        else udise = 'SCH-' + ((index !== undefined ? index + 1 : Date.now())).toString();
      }

      // 4. School Name
      let schoolName = findVal(['school name', 'schoolname', 'name of school', 'school', 'institution name', 'institution']);
      if (!schoolName) {
        if (aiName) schoolName = `${aiName} (AI - ${district})`;
        else schoolName = `School (${district} #${(index !== undefined ? index + 1 : 1)})`;
      }

      // 5. Category
      let category = findVal(['school category', 'category', 'school type', 'type', 'cat']);
      if (!category) {
        const sUpper = schoolName.toUpperCase();
        if (sUpper.includes('PUMS')) category = 'PUMS';
        else if (sUpper.includes('PUPS')) category = 'PUPS';
        else if (sUpper.includes('GHSS')) category = 'GHSS';
        else if (sUpper.includes('GHS')) category = 'GHS';
        else if (sUpper.includes('HSS')) category = 'HSS';
        else category = 'PUMS';
      }

      // 6. Labs
      const labCount = parseInt(findVal(['lab count', 'no of labs', 'labs', 'lab qty', 'no. of labs'])) || 1;
      const labType = findVal(['lab type', 'type of lab', 'labtype']) || 'Hi-Tech Lab';

      return {
        udise,
        schoolName,
        category,
        district,
        block,
        aiName,
        aiPhone,
        aiId,
        labCount,
        labType
      };
    }

    async processSpreadsheetFile(file, textareaId, previewFn) {
      if (!file) return;
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || (file.type && (file.type.includes('spreadsheet') || file.type.includes('excel')));

      if (isExcel && typeof XLSX !== 'undefined') {
        try {
          const buffer = await file.arrayBuffer();
          const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            alert('The Excel file contains no worksheets.');
            return;
          }
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const csv = XLSX.utils.sheet_to_csv(sheet);
          const ta = document.getElementById(textareaId);
          if (ta) {
            ta.value = csv;
            if (typeof previewFn === 'function') previewFn(csv);
          }
          return;
        } catch (err) {
          console.error('SheetJS parse error:', err);
          alert('Could not parse Excel workbook: ' + err.message);
          return;
        }
      }

      // Plain text or CSV reading
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        // Check if raw binary was read into text (starts with PK)
        if (typeof text === 'string' && text.startsWith('PK\x03\x04') && typeof XLSX !== 'undefined') {
          const readerBuf = new FileReader();
          readerBuf.onload = (e2) => {
            try {
              const wb = XLSX.read(new Uint8Array(e2.target.result), { type: 'array' });
              const sheet = wb.Sheets[wb.SheetNames[0]];
              const csv = XLSX.utils.sheet_to_csv(sheet);
              const ta = document.getElementById(textareaId);
              if (ta) {
                ta.value = csv;
                if (typeof previewFn === 'function') previewFn(csv);
              }
            } catch(e) {
              alert('Error reading Excel format: ' + e.message);
            }
          };
          readerBuf.readAsArrayBuffer(file);
          return;
        }

        const ta = document.getElementById(textareaId);
        if (ta) {
          ta.value = text;
          if (typeof previewFn === 'function') previewFn(text);
        }
      };
      reader.readAsText(file);
    }

    handleSchoolFileUpload(input) {
      if (!input.files || !input.files[0]) return;
      this.processSpreadsheetFile(input.files[0], 'bulkSchoolsCsvData', (txt) => this.previewSchoolParsedData(txt));
    }

    handleSchoolDrop(file) {
      this.processSpreadsheetFile(file, 'bulkSchoolsCsvData', (txt) => this.previewSchoolParsedData(txt));
    }

    previewSchoolParsedData(text) {
      const badge = document.getElementById('schoolParsedCountBadge');
      const box = document.getElementById('schoolParsedPreviewBox');
      if (!badge || !box) return;

      if (!text || !text.trim()) {
        badge.textContent = '';
        box.style.display = 'none';
        return;
      }

      // Check for raw binary file content (e.g. .xlsx ZIP header PK...)
      if (text.startsWith('PK') || /[\x00-\x08\x0E-\x1F\uFFFD]/.test(text.slice(0, 150))) {
        badge.innerHTML = `<span style="color: #ef4444; font-weight:700;"><i class="fas fa-triangle-exclamation"></i> Raw binary Excel file text detected</span>`;
        box.style.display = 'block';
        box.innerHTML = `
          <div style="padding: 1rem; text-align: center; color: #b91c1c; font-size: 0.78rem; background: #fef2f2; border-radius: 8px;">
            <strong>⚠️ Cannot parse raw binary .xlsx text directly.</strong><br>
            Please use the <strong>"Click to browse or Drag & Drop"</strong> box above to upload the Excel file, or open the Excel file and copy-paste the actual spreadsheet cells.
          </div>
        `;
        return;
      }

      const parsed = this._parseCsv(text);

      if (parsed.length === 0) {
        badge.textContent = '';
        box.style.display = 'none';
        return;
      }

      const normalized = parsed.map((r, i) => this.normalizeSchoolRow(r, i)).filter(Boolean);

      badge.innerHTML = `✅ <strong>${normalized.length}</strong> valid record(s) detected`;
      box.style.display = 'block';
      
      let rowsHtml = normalized.slice(0, 5).map((s, i) => `
        <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.72rem;">
          <td style="padding: 0.35rem 0.5rem; font-weight:700;">#${i+1}</td>
          <td style="padding: 0.35rem 0.5rem; color: #2563eb; font-weight: 700;">${s.udise}</td>
          <td style="padding: 0.35rem 0.5rem; font-weight: 600;">${s.schoolName}</td>
          <td style="padding: 0.35rem 0.5rem;">${s.district}</td>
          <td style="padding: 0.35rem 0.5rem; color: #059669; font-weight: 700;">${s.aiName || '—'} ${s.aiPhone ? `<span style="font-size:0.68rem; color:var(--text-muted); font-weight:normal;">(${s.aiPhone})</span>` : ''}</td>
        </tr>
      `).join('');

      box.innerHTML = `
        <table style="width:100%; border-collapse: collapse; text-align:left;">
          <thead>
            <tr style="background: rgba(0,0,0,0.03); font-size:0.68rem; font-weight:800; text-transform:uppercase;">
              <th style="padding:0.35rem 0.5rem;">#</th>
              <th style="padding:0.35rem 0.5rem;">UDISE / ID</th>
              <th style="padding:0.35rem 0.5rem;">School / Description</th>
              <th style="padding:0.35rem 0.5rem;">District</th>
              <th style="padding:0.35rem 0.5rem;">AI Instructor & Phone</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        ${normalized.length > 5 ? `<div style="padding: 0.35rem 0.5rem; font-size: 0.68rem; color: var(--text-muted); text-align: center;">... and ${normalized.length - 5} more records</div>` : ''}
      `;
    }

    openBulkImportCallsModal() {
      this._showModal('adminBulkCallsModal', 'Bulk Import Calls (Multi-District)', `
        <div style="display: flex; flex-direction: column; gap: 1rem; padding: 0.25rem 0;">
          <div style="background: linear-gradient(135deg, rgba(37,99,235,0.06), rgba(59,130,246,0.1)); border: 1px solid rgba(37,99,235,0.2); border-radius: 10px; padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.6rem;">
            <div>
              <div style="font-weight: 800; font-size: 0.85rem; color: #1e40af;"><i class="fas fa-file-excel"></i> Bulk Import Field Support Calls (.xlsx, .xls, .csv)</div>
              <div style="font-size: 0.72rem; color: var(--text-secondary, #475569); margin-top: 2px;">Expected columns: <code>School Name, UDISE, District, Contact Person, Contact No, Issue, Date, Priority</code></div>
            </div>
            <button type="button" onclick="window.adminViews.downloadCallsTemplate()" class="btn btn-sm btn-outline" style="background:#ffffff; color:#2563eb; border-color:#2563eb; font-weight:700; font-size:0.75rem; border-radius:6px; cursor:pointer;">
              <i class="fas fa-download"></i> Sample CSV
            </button>
          </div>

          <div id="callsDropzone" 
               onclick="document.getElementById('callsFileInput').click()" 
               ondragover="event.preventDefault(); this.style.borderColor='#2563eb'; this.style.background='rgba(37,99,235,0.08)';"
               ondragleave="this.style.borderColor='#94a3b8'; this.style.background='var(--bg-main)';"
               ondrop="event.preventDefault(); this.style.borderColor='#94a3b8'; this.style.background='var(--bg-main)'; if(event.dataTransfer.files.length) window.adminViews.handleCallsDrop(event.dataTransfer.files[0]);"
               style="border: 2px dashed #94a3b8; border-radius: 10px; padding: 1.25rem; text-align: center; background: var(--bg-main, #f8fafc); cursor: pointer; transition: all 0.2s ease;">
            <i class="fas fa-cloud-arrow-up" style="font-size: 1.75rem; color: #2563eb; margin-bottom: 0.35rem; display: block;"></i>
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary, #0f172a);">Click to browse or Drag & Drop Excel (.xlsx, .xls) / CSV</div>
            <div style="font-size: 0.7rem; color: var(--text-muted, #64748b);">Direct Excel spreadsheet reading or paste data below</div>
            <input type="file" id="callsFileInput" accept=".xlsx,.xls,.csv,.txt" style="display: none;" onchange="window.adminViews.handleCallsFileUpload(this)">
          </div>

          <textarea id="bulkCallsCsvData" rows="6" placeholder="School Name,UDISE,District,Contact Person,Contact No,Issue,Date,Priority
PUMS EXAMPLE,33190600201,NAGAPATTINAM,K. Teacher,9876543210,UPS not working,2026-08-15,High" style="width: 100%; padding: 0.65rem 0.85rem; border: 1.5px solid var(--border-color, #cbd5e1); border-radius: 8px; font-family: monospace; font-size: 0.76rem; resize: vertical; box-sizing: border-box; background: #ffffff;"></textarea>
        </div>
      `, () => {
        const csvText = document.getElementById('bulkCallsCsvData').value;
        const parsed = this._parseCsv(csvText);
        if (parsed.length === 0) { alert('No valid data found. Please upload a file or paste data.'); return; }
        
        const mapped = parsed.map(row => {
          const keys = Object.keys(row);
          const findKey = (candidates) => {
            const k = keys.find(key => candidates.includes(key.trim().toLowerCase()));
            return k ? row[k] : '';
          };
          return {
            schoolName: findKey(['school name', 'school', 'name']) || '',
            udise: findKey(['udise', 'udise code', 'code']) || '',
            district: findKey(['district', 'dist']) || 'NAGAPATTINAM',
            contactPerson: findKey(['contact person', 'contact', 'ai', 'teacher', 'person']) || '',
            contactNo: findKey(['contact no', 'phone', 'mobile']) || '',
            issue: findKey(['issue', 'complaint', 'problem', 'description']) || 'Service call',
            dateRegistered: findKey(['date', 'date registered', 'reported date']) || new Date().toISOString().split('T')[0],
            priority: findKey(['priority', 'severity']) || 'Normal'
          };
        }).filter(c => c.schoolName || c.udise);

        if (mapped.length === 0) { alert('No valid calls parsed. Please check headers.'); return; }

        const res = window.adminStore.bulkImportCalls(mapped);
        alert(res.message);
        if (res.success) { this._closeModal('adminBulkCallsModal'); this.render(); }
      }, 'Import Calls');
    }

    handleCallsFileUpload(input) {
      if (!input.files || !input.files[0]) return;
      this.processSpreadsheetFile(input.files[0], 'bulkCallsCsvData', null);
    }

    handleCallsDrop(file) {
      this.processSpreadsheetFile(file, 'bulkCallsCsvData', null);
    }

    // ═══════════════════════════════════════════════════════
    // EXISTING MODALS: District Assign & PIN Reset
    // ═══════════════════════════════════════════════════════

    openAssignDistrictsModal(empId) {
      const store = window.adminStore;
      const eng = (store.state.engineers || []).find(e => e.empId === empId);
      if (!eng) return;

      const allDistricts = store.tnDistricts || [];
      const currentAssigned = eng.assignedDistricts || [];

      let checkboxesHtml = '';
      allDistricts.forEach(d => {
        const isChecked = currentAssigned.includes(d);
        checkboxesHtml += `
          <label style="display: flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.5rem; background: var(--bg-main, #f8fafc); border-radius: 6px; font-size: 0.75rem; cursor: pointer;">
            <input type="checkbox" name="assignDistCheckbox" value="${d}" ${isChecked ? 'checked' : ''}>
            <span>${d}</span>
          </label>
        `;
      });

      const modalHtml = `
        <div id="adminAssignDistModal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 110000; display: flex; align-items: center; justify-content: center; padding: 1rem;">
          <div style="background: var(--bg-card, #ffffff); border-radius: 14px; width: 550px; max-width: 95vw; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
            <div style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-color, #e2e8f0); display: flex; justify-content: space-between; align-items: center;">
              <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-primary, #0f172a);">Assign Districts to ${eng.name} (#${eng.empId})</div>
              <button type="button" onclick="document.getElementById('adminAssignDistModal').remove()" class="btn btn-xs btn-outline" style="border:none; font-size: 1rem; cursor: pointer;">✕</button>
            </div>
            <div style="padding: 1.25rem; overflow-y: auto; flex: 1; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.5rem;">
              ${checkboxesHtml}
            </div>
            <div style="padding: 0.85rem 1.25rem; border-top: 1px solid var(--border-color, #e2e8f0); display: flex; justify-content: flex-end; gap: 0.5rem; background: var(--bg-main, #f8fafc);">
              <button type="button" onclick="document.getElementById('adminAssignDistModal').remove()" class="btn btn-sm btn-outline">Cancel</button>
              <button type="button" onclick="window.adminViews.saveAssignedDistricts('${eng.empId}')" class="btn btn-sm btn-primary">Save Allocations</button>
            </div>
          </div>
        </div>
      `;

      const div = document.createElement('div');
      div.innerHTML = modalHtml;
      document.body.appendChild(div.firstElementChild);
    }

    saveAssignedDistricts(empId) {
      const checkboxes = document.querySelectorAll('input[name="assignDistCheckbox"]:checked');
      const selectedDistricts = Array.from(checkboxes).map(cb => cb.value);

      const res = window.adminStore.assignDistricts(empId, selectedDistricts);
      alert(res.message);
      if (res.success) {
        const modal = document.getElementById('adminAssignDistModal');
        if (modal) modal.remove();
        this.render();
      }
    }

    openResetPinModal(empId) {
      const store = window.adminStore;
      const eng = (store.state.engineers || []).find(e => e.empId === empId);
      if (!eng) return;

      this._showModal('adminResetPinModal', `Reset Login PIN: ${eng.name}`, `
        <div style="display: flex; flex-direction: column; gap: 0.85rem; padding: 0.5rem 0;">
          <p style="font-size: 0.82rem; color: var(--text-secondary);">Engineer <strong>${eng.name}</strong> (#${eng.empId}) currently logs in with PIN: <code style="color: #10b981; font-weight: 800; font-size: 0.95rem;">${eng.pin}</code></p>
          <div>
            <label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">New 4–6 Digit PIN *</label>
            <input type="text" id="resetPinInput" class="form-input" style="width:100%; padding:0.5rem 0.6rem; border-radius:6px; border: 1.5px solid var(--border-color); font-size:1.1rem; font-family: monospace; font-weight: 800; letter-spacing: 0.15em; box-sizing:border-box;" placeholder="e.g. 8899" maxlength="6">
          </div>
        </div>
      `, () => {
        const newPin = document.getElementById('resetPinInput').value.trim();
        if (!newPin || newPin.length < 4) { alert('PIN must be at least 4 digits'); return; }
        const res = window.adminStore.resetPin(empId, newPin);
        alert(res.message);
        if (res.success) { this._closeModal('adminResetPinModal'); this.render(); }
      }, 'Update PIN');
    }

    // ═══════════════════════════════════════════════════════
    // MODALS: DEFECT LOGGING & MANAGEMENT
    // ═══════════════════════════════════════════════════════

    openDefectModal() {
      const store = window.adminStore || {};
      const schools = (store.state && store.state.schoolsMaster) || [];
      const hardwareDefs = store.hardwareDefs || {};
      const hitech = hardwareDefs.HITECH_LAB || [];
      const smart = hardwareDefs.SMART_CLASSROOM || [];

      // Combine equipment items
      const itemOptions = [
        ...hitech.map(i => `<option value="${i.name}">${i.name} (${i.brand})</option>`),
        ...smart.map(i => `<option value="${i.name}">${i.name} (${i.brand})</option>`),
        `<option value="Other Hardware Component">Other Hardware Component</option>`
      ].join('');

      let schoolOptions = '';
      if (schools.length > 0) {
        schoolOptions = schools.map(s => `<option value="${s.udise}">${s.schoolName} (${s.district}) - ${s.udise}</option>`).join('');
      } else {
        schoolOptions = `<option value="">No schools in directory (Enter manually)</option>`;
      }

      this._showModal('adminAddDefectModal', 'Log ICT Hardware Defect / Replacement', `
        <div style="display: flex; flex-direction: column; gap: 0.85rem; padding: 0.5rem 0;">
          <div>
            <label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Select School *</label>
            <select id="defectSchoolSelect" onchange="window.adminViews.onDefectSchoolChange(this.value)" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem;">
              <option value="">-- Choose School from Directory --</option>
              ${schoolOptions}
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
            <div>
              <label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">UDISE Code</label>
              <input type="text" id="defectUdise" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;" placeholder="e.g. 33190400501">
            </div>
            <div>
              <label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">District</label>
              <input type="text" id="defectDistrict" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;" placeholder="e.g. NAGAPATTINAM">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
            <div>
              <label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Lab Selection</label>
              <select id="defectLabNo" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem;">
                <option value="Lab 1">Hi-Tech Lab 1</option>
                <option value="Lab 2">Hi-Tech Lab 2</option>
                <option value="Lab 3">Hi-Tech Lab 3</option>
                <option value="Smart Classroom">Smart Classroom</option>
              </select>
            </div>
            <div>
              <label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Hardware Component *</label>
              <select id="defectItemName" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem;">
                ${itemOptions}
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
            <div>
              <label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Defect Condition *</label>
              <select id="defectType" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem;">
                <option value="Faulty">⚠️ Faulty (Operational with issues)</option>
                <option value="Broken">💥 Broken (Completely Down)</option>
                <option value="Missing">❌ Missing / Stolen</option>
                <option value="Needs Replacement">🔄 Needs Replacement</option>
              </select>
            </div>
            <div>
              <label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Quantity Defective *</label>
              <input type="number" id="defectQty" value="1" min="1" max="100" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;">
            </div>
          </div>

          <div>
            <label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Inspection Remarks / Root Cause</label>
            <textarea id="defectRemarks" rows="3" class="form-input" style="width:100%; padding:0.45rem 0.6rem; border-radius:6px; border: 1px solid var(--border-color); font-size:0.85rem; box-sizing:border-box;" placeholder="Describe physical condition, serial number, error codes, or troubleshooting done..."></textarea>
          </div>
        </div>
      `, () => {
        const udise = document.getElementById('defectUdise').value.trim();
        const schoolSelect = document.getElementById('defectSchoolSelect');
        const selectedSchoolName = schoolSelect.options[schoolSelect.selectedIndex] ? schoolSelect.options[schoolSelect.selectedIndex].text.split('(')[0].trim() : 'School';
        const district = document.getElementById('defectDistrict').value.trim() || 'NAGAPATTINAM';
        const labNo = document.getElementById('defectLabNo').value;
        const itemName = document.getElementById('defectItemName').value;
        const defectType = document.getElementById('defectType').value;
        const qty = parseInt(document.getElementById('defectQty').value) || 1;
        const remarks = document.getElementById('defectRemarks').value.trim();

        if (!itemName) { alert('Please select a hardware component'); return; }

        const defectData = {
          schoolName: selectedSchoolName,
          udise: udise || 'N/A',
          district: district,
          labNo: labNo,
          itemName: itemName,
          defectType: defectType,
          qty: qty,
          remarks: remarks,
          reportedBy: 'State Admin'
        };

        window.adminStore.recordHardwareDefect(udise, defectData);
        alert(`Hardware defect logged for ${qty}x ${itemName} at ${selectedSchoolName}`);
        this._closeModal('adminAddDefectModal');
        this.render();
      }, 'Save Defect Log');
    }

    onDefectSchoolChange(udise) {
      if (!udise) return;
      const store = window.adminStore || {};
      const schools = (store.state && store.state.schoolsMaster) || [];
      const sch = schools.find(s => s.udise === udise);
      if (sch) {
        const uInput = document.getElementById('defectUdise');
        const dInput = document.getElementById('defectDistrict');
        if (uInput) uInput.value = sch.udise;
        if (dInput) dInput.value = sch.district;
      }
    }

    deleteDefect(defectId) {
      if (confirm('Are you sure you want to delete this hardware defect record?')) {
        const res = window.adminStore.deleteDefect(defectId);
        alert(res.message);
        this.render();
      }
    }

    // ═══════════════════════════════════════════════════════
    // UTILITY: Generic Modal Builder & CSV Parser
    // ═══════════════════════════════════════════════════════

    _showModal(id, title, bodyHtml, onSave, saveLabel) {
      const existing = document.getElementById(id);
      if (existing) existing.remove();

      const saveId = id + '_saveBtn';
      const modalHtml = `
        <div id="${id}" style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 110000; display: flex; align-items: center; justify-content: center; padding: 1rem;">
          <div style="background: var(--bg-card, #ffffff); border-radius: 14px; width: 600px; max-width: 95vw; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
            <div style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-color, #e2e8f0); display: flex; justify-content: space-between; align-items: center;">
              <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-primary, #0f172a);">${title}</div>
              <button type="button" onclick="document.getElementById('${id}').remove()" class="btn btn-xs btn-outline" style="border:none; font-size: 1rem; cursor: pointer;">✕</button>
            </div>
            <div style="padding: 1.25rem; overflow-y: auto; flex: 1;">
              ${bodyHtml}
            </div>
            <div style="padding: 0.85rem 1.25rem; border-top: 1px solid var(--border-color, #e2e8f0); display: flex; justify-content: flex-end; gap: 0.5rem; background: var(--bg-main, #f8fafc);">
              <button type="button" onclick="document.getElementById('${id}').remove()" class="btn btn-sm btn-outline">Cancel</button>
              <button type="button" id="${saveId}" class="btn btn-sm btn-primary">${saveLabel || 'Save'}</button>
            </div>
          </div>
        </div>
      `;

      const div = document.createElement('div');
      div.innerHTML = modalHtml;
      document.body.appendChild(div.firstElementChild);

      // Attach save handler
      if (onSave) {
        document.getElementById(saveId).addEventListener('click', onSave);
      }
    }

    _closeModal(id) {
      const el = document.getElementById(id);
      if (el) el.remove();
    }

    _parseCsv(text) {
      if (!text || !text.trim()) return [];
      if (text.startsWith('PK') || /[\x00-\x08\x0E-\x1F\uFFFD]/.test(text.slice(0, 150))) return [];
      const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l);
      if (lines.length < 2) return [];

      const firstLine = lines[0];
      let delimiter = ',';
      if (firstLine.includes('\t')) delimiter = '\t';
      else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';
      else if (firstLine.includes('|') && !firstLine.includes(',')) delimiter = '|';

      const parseLine = (line) => {
        if (delimiter === '\t' || delimiter === '|' || delimiter === ';') {
          return line.split(delimiter).map(v => v.replace(/^["']|["']$/g, '').trim());
        }
        const matches = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            matches.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        matches.push(current.trim());
        return matches.map(v => v.replace(/^["']|["']$/g, '').trim());
      };

      const headers = parseLine(lines[0]);
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const vals = parseLine(lines[i]);
        if (vals.length === 0 || vals.every(v => !v)) continue;
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = vals[idx] !== undefined ? vals[idx] : '';
        });
        data.push(obj);
      }
      return data;
    }
  }

  window.adminViews = new AdminViews();

})(window);
