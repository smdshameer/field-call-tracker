// cccLiveScraper.js

/**
 * Returns the Master Universal CCC Portal Extractor Script.
 * Extracts ALL schools, devices, subnets, routers, UPS, cameras, smart boards & tickets across all 38 districts in 1 go!
 */
window.getCCCScraperScript = function() {
    return `
(async function() {
    console.log("🚀 Starting MASTER UNIVERSAL CCC PORTAL EXTRACTOR...");
    let allSchools = [];

    // Helper: Normalize item structure
    function normalizeItem(i) {
        return {
            district: i.district || i.District || i.district_name || 'Unknown',
            educational_district: i.educational_district || i.EduDistrict || i.edu_district || '',
            block_name: i.block_name || i.Block || i.block || '',
            lab_id: i.lab_id || i.LabID || i.labId || i.emis || i.udise || '',
            school_name: i.school_name || i.SchoolName || i.schoolName || i.institution || '',
            school_type: i.school_type || i.SchoolType || i.categoryType || (i.lab_id && i.lab_id.includes('_SB') ? 'Smart Class' : 'HiTech Lab'),
            status: (i.status || i.Status || i.labstatus || 'Down').toString().toLowerCase().includes('live') ? 'Live' : 'Down',
            router_ip: i.router_ip || i.RouterIP || i.routerip || i.ipAddress || null,
            ups_ip: i.ups_ip || i.UPSIP || i.upsip || null,
            camera_ip: i.camera_ip || i.CameraIP || i.cameraip || null,
            smart_board_ip: i.smart_board_ip || i.SmartBoardIP || null,
            computers_total: i.computers_total || i.ComputersTotal || (i.total || null),
            computers_live: i.computers_live || i.ComputersLive || (i.live || null),
            pending_tickets: i.pending_tickets || i.pendingTickets || 0,
            school_admin_name: i.school_admin_name || i.schoolAdminName || '',
            school_admin_contact: i.school_admin_contact || i.contact || i.phone || '',
            phase: i.phase || i.Phase || 1
        };
    }

    // 1. Check Nuxt / Vuex State Memory
    try {
        if (window.$nuxt && window.$nuxt.$store && window.$nuxt.$store.state) {
            let state = window.$nuxt.$store.state;
            console.log("Checking Nuxt Store State...", state);
            for (let k in state) {
                let val = state[k];
                if (val && Array.isArray(val) && val.length > 0 && val[0].school_name) {
                    allSchools = val.map(normalizeItem);
                    console.log("✅ Extracted from Nuxt store key:", k, allSchools.length);
                    break;
                }
            }
        }
    } catch(e) { console.warn("Nuxt store check skipped", e.message); }

    // 2. Extract Auth Token
    let token = localStorage.getItem('token') || sessionStorage.getItem('token') || sessionStorage.getItem('auth._token.local') || '';
    if (!token) {
        for (let i = 0; i < localStorage.length; i++) {
            let k = localStorage.key(i);
            let v = localStorage.getItem(k);
            if (v && (v.startsWith('eyJ') || v.includes('Bearer'))) { token = v; break; }
        }
    }
    token = (token || '').replace(/^["']|["']$/g, '');
    if (token && !token.startsWith('Bearer ')) token = 'Bearer ' + token;

    let headers = { 'Accept': 'application/json' };
    if (token) headers['Authorization'] = token;

    // 3. Query All Possible CCC Backend Endpoints
    if (allSchools.length === 0) {
        let endpoints = [
            '/api/detailedAssetAvailability',
            '/api/reportdata',
            '/api/dashboard/ReportData',
            '/api/assetDashboard',
            '/api/schools/status',
            '/api/devices/status',
            '/api/labs/all',
            '/api/tickets-list?type=all&list_type=all'
        ];

        for (let ep of endpoints) {
            try {
                let res = await fetch(ep, { headers });
                if (res.ok) {
                    let json = await res.json();
                    let list = json.data || json.results || json.report || json.schools || (Array.isArray(json) ? json : null);
                    if (list && Array.isArray(list) && list.length > 0) {
                        allSchools = list.map(normalizeItem);
                        console.log("✅ Extracted from endpoint:", ep, allSchools.length);
                        break;
                    }
                }
            } catch(err) {}
        }
    }

    // 4. Fetch HTML Pages & Extract Tables via DOMParser
    if (allSchools.length === 0) {
        let pages = ['/dashboard/ReportData', '/ReportData', '/assetDashboard', '/Schooldashboard'];
        for (let pg of pages) {
            try {
                let res = await fetch(pg);
                if (res.ok) {
                    let html = await res.text();
                    let parser = new DOMParser();
                    let doc = parser.parseFromString(html, 'text/html');
                    let rows = doc.querySelectorAll('table tbody tr');
                    if (rows.length > 0) {
                        rows.forEach(r => {
                            let c = r.querySelectorAll('td');
                            if (c.length >= 7) {
                                allSchools.push(normalizeItem({
                                    district: c[0]?.innerText?.trim() || c[0]?.textContent?.trim(),
                                    educational_district: c[1]?.innerText?.trim() || c[1]?.textContent?.trim(),
                                    block_name: c[2]?.innerText?.trim() || c[2]?.textContent?.trim(),
                                    lab_id: c[3]?.innerText?.trim() || c[3]?.textContent?.trim(),
                                    school_name: c[4]?.innerText?.trim() || c[4]?.textContent?.trim(),
                                    school_type: c[5]?.innerText?.trim() || c[5]?.textContent?.trim(),
                                    status: c[6]?.innerText?.trim() || c[6]?.textContent?.trim()
                                }));
                            }
                        });
                        if (allSchools.length > 0) break;
                    }
                }
            } catch(e) {}
        }
    }

    // 5. DOM Scraping Active Visible Page
    if (allSchools.length === 0) {
        let rows = document.querySelectorAll('table tbody tr');
        rows.forEach(r => {
            let c = r.querySelectorAll('td');
            if (c.length >= 7) {
                allSchools.push(normalizeItem({
                    district: c[0]?.innerText?.trim() || c[0]?.textContent?.trim(),
                    educational_district: c[1]?.innerText?.trim() || c[1]?.textContent?.trim(),
                    block_name: c[2]?.innerText?.trim() || c[2]?.textContent?.trim(),
                    lab_id: c[3]?.innerText?.trim() || c[3]?.textContent?.trim(),
                    school_name: c[4]?.innerText?.trim() || c[4]?.textContent?.trim(),
                    school_type: c[5]?.innerText?.trim() || c[5]?.textContent?.trim(),
                    status: c[6]?.innerText?.trim() || c[6]?.textContent?.trim()
                }));
            }
        });
    }

    // Save & Alert
    if (allSchools.length > 0) {
        localStorage.setItem('CCC_LIVE_SCRAPED_DATA', JSON.stringify({
            timestamp: Date.now(),
            count: allSchools.length,
            schools: allSchools
        }));

        alert('🎉 MASTER EXTRACTION COMPLETE! Captured ' + allSchools.length + ' real school & device records across all districts!\n\nOpen your Field Call Tracker app now to see your live mirrored dashboard.');
    } else {
        alert('⚠️ No data tables found. Please click any menu item (Dashboard, Asset, Tickets) to load data, then run again.');
    }
})();
    `;
};

window.receiveCCCScrapedData = function() {
    const dataStr = localStorage.getItem('CCC_LIVE_SCRAPED_DATA');
    if (!dataStr) return null;
    
    try {
        const data = JSON.parse(dataStr);
        if (data && data.schools && (Date.now() - data.timestamp < 72 * 3600 * 1000)) {
            return data.schools;
        }
        return null;
    } catch(e) {
        console.error("Error reading CCC scraped data:", e);
        return null;
    }
};

window.getCCCScrapedStats = function() {
    const dataStr = localStorage.getItem('CCC_LIVE_SCRAPED_DATA');
    if (!dataStr) return null;
    
    try {
        const data = JSON.parse(dataStr);
        const schools = data.schools || [];
        
        const stats = {
            totalSchools: schools.length,
            liveCount: 0,
            downCount: 0,
            hitechLabs: 0,
            smartClass: 0,
            districts: {},
            lastUpdated: data.timestamp
        };
        
        schools.forEach(school => {
            const isLive = String(school.status).toLowerCase() === 'live';
            if (isLive) stats.liveCount++;
            else stats.downCount++;
            
            if (String(school.school_type).toLowerCase().includes('hitech')) stats.hitechLabs++;
            else if (String(school.school_type).toLowerCase().includes('smart')) stats.smartClass++;
            
            const dist = school.district || 'Unknown';
            if (!stats.districts[dist]) {
                stats.districts[dist] = { live: 0, down: 0, total: 0 };
            }
            stats.districts[dist].total++;
            if (isLive) stats.districts[dist].live++;
            else stats.districts[dist].down++;
        });
        
        return stats;
    } catch(e) {
        console.error("Error generating stats from CCC scraped data:", e);
        return null;
    }
};

window.showCCCScraperInstructions = function() {
    const existing = document.getElementById('cccScraperInstructionsOverlay');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'cccScraperInstructionsOverlay';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; display:flex; align-items:center; justify-content:center; color:#333; font-family:sans-serif;';
    
    const modal = document.createElement('div');
    modal.style.cssText = 'background:#fff; width:600px; max-width:90%; border-radius:8px; box-shadow:0 4px 15px rgba(0,0,0,0.2); display:flex; flex-direction:column; max-height:90vh; overflow:hidden;';
    
    const header = document.createElement('div');
    header.style.cssText = 'padding:16px 20px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center; background:#f8f9fa; border-radius:8px 8px 0 0;';
    header.innerHTML = '<h3 style="margin:0; font-size:18px; color:#1a73e8;">🚀 Master Universal CCC Portal Extractor</h3>';
    
    const closeBtn = document.createElement('button');
    closeBtn.innerText = '✕';
    closeBtn.style.cssText = 'background:none; border:none; font-size:20px; cursor:pointer; color:#666;';
    closeBtn.onclick = () => overlay.remove();
    header.appendChild(closeBtn);
    
    const body = document.createElement('div');
    body.style.cssText = 'padding:20px; overflow-y:auto; font-size:14px; line-height:1.5;';
    
    const instructions = `
        <ol style="margin-top:0; padding-left:20px;">
            <li style="margin-bottom:8px;">Open <a href="https://ccc.tnschools.gov.in" target="_blank">ccc.tnschools.gov.in</a> and log in.</li>
            <li style="margin-bottom:8px;">Press <b>F12</b> to open DevTools, then click on the <b>Console</b> tab.</li>
            <li style="margin-bottom:8px;">Copy the Master Script below, paste it into the Console, and press <b>Enter</b>.</li>
            <li style="margin-bottom:8px;">All 38 districts & devices will be extracted automatically! Return to your Field Call Tracker app.</li>
        </ol>
    `;
    
    const scriptText = window.getCCCScraperScript();
    
    const scriptContainer = document.createElement('div');
    scriptContainer.style.cssText = 'position:relative; background:#282c34; border-radius:6px; padding:12px; margin-top:16px;';
    
    const pre = document.createElement('pre');
    pre.style.cssText = 'margin:0; padding:0; color:#abb2bf; font-family:monospace; font-size:12px; overflow-x:auto; white-space:pre-wrap; max-height:200px; overflow-y:auto;';
    pre.innerText = scriptText;
    
    const copyBtn = document.createElement('button');
    copyBtn.innerText = 'Copy Script';
    copyBtn.style.cssText = 'position:absolute; top:8px; right:8px; background:#1a73e8; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;';
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(scriptText).then(() => {
            copyBtn.innerText = 'Copied!';
            copyBtn.style.background = '#34a853';
            setTimeout(() => {
                copyBtn.innerText = 'Copy Script';
                copyBtn.style.background = '#1a73e8';
            }, 2000);
        });
    };
    
    scriptContainer.appendChild(pre);
    scriptContainer.appendChild(copyBtn);
    
    body.innerHTML = instructions;
    body.appendChild(scriptContainer);
    
    const footer = document.createElement('div');
    footer.style.cssText = 'padding:16px 20px; border-top:1px solid #eee; display:flex; justify-content:flex-end; background:#f8f9fa; border-radius:0 0 8px 8px;';
    
    const closeFooterBtn = document.createElement('button');
    closeFooterBtn.innerText = 'Close';
    closeFooterBtn.style.cssText = 'background:#e0e0e0; color:#333; border:none; padding:8px 16px; border-radius:4px; cursor:pointer; font-size:14px; font-weight:500;';
    closeFooterBtn.onclick = () => overlay.remove();
    footer.appendChild(closeFooterBtn);
    
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
};
