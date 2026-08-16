class CCCMirrorDashboard {
    constructor() {
        this.data = [];
        this.containerId = null;
        this.stats = { total: 0, live: 0, down: 0 };
        this.districtData = {};
        this.currentView = 'hitech'; // 'hitech' or 'smart'
        this.currentPhase = 'all'; // 'phase1', 'phase2', 'all'
        
        // Auto load if data exists
        if (typeof window.receiveCCCScrapedData === 'function') {
            const data = window.receiveCCCScrapedData();
            if (data && data.length > 0) {
                this.updateFromScrapedData(data);
            }
        }
    }

    updateFromScrapedData(schoolsArray) {
        if (!Array.isArray(schoolsArray)) return;
        this.data = schoolsArray;
        this.calculateStats();
        if (this.containerId) {
            this.render(this.containerId);
        }
    }

    calculateStats() {
        this.stats = { total: 0, live: 0, down: 0 };
        this.districtData = {};

        this.data.forEach(school => {
            this.stats.total++;
            let status = (school.status && school.status.toLowerCase() === 'live') ? 'live' : 'down';
            
            if (status === 'live') this.stats.live++;
            else this.stats.down++;

            const district = school.district || 'UNKNOWN';
            if (!this.districtData[district]) {
                this.districtData[district] = { total: 0, live: 0, down: 0 };
            }
            this.districtData[district].total++;
            this.districtData[district][status]++;
        });
    }

    getDistrictBreakdown() {
        return this.districtData;
    }

    render(containerId) {
        this.containerId = containerId;
        const container = document.getElementById(containerId);
        if (!container) return;

        // Container styles
        container.style.backgroundColor = '#f4f6f9';
        container.style.fontFamily = 'Arial, sans-serif';
        container.style.padding = '20px';
        container.style.boxSizing = 'border-box';

        container.innerHTML = `
            ${this.renderTopBar()}
            ${this.renderKPICards()}
            ${this.renderChartSection()}
            ${this.renderTableSection()}
        `;

        this.initChart();
        this.initTableInteractions();
    }

    renderTopBar() {
        return `
            <div style="background: #fff; padding: 15px; border-bottom: 3px solid #007bff; display: flex; flex-wrap: wrap; gap: 15px; justify-content: space-between; align-items: center; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div>
                    <select style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <option>Today So Far</option>
                    </select>
                </div>
                <div>
                    <button style="padding: 8px 15px; border: 1px solid #ccc; background: #fff; cursor: pointer;">◼ Smart Class</button>
                    <button style="padding: 8px 15px; border: none; background: #007bff; color: white; cursor: pointer; margin-left: -5px;">🖥️ HiTech Labs</button>
                </div>
                <div>
                    <select style="padding: 8px; border: 1px solid #ccc; border-radius: 4px; min-width: 150px;">
                        <option>All Districts</option>
                        ${Object.keys(this.districtData).sort().map(d => `<option>${d}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <button style="padding: 8px 15px; border: 1px solid #007bff; background: #fff; color: #007bff; cursor: pointer;">PHASE 1</button>
                    <button style="padding: 8px 15px; border: 1px solid #ccc; background: #fff; cursor: pointer; margin-left: -5px;">PHASE 2</button>
                </div>
            </div>
        `;
    }

    renderKPICards() {
        const livePct = this.stats.total ? ((this.stats.live / this.stats.total) * 100).toFixed(1) : 0;
        const downPct = this.stats.total ? ((this.stats.down / this.stats.total) * 100).toFixed(1) : 0;

        return `
            <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
                <div style="flex: 1; min-width: 250px; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center;">
                    <div style="background: #e0f2f1; color: #00897b; width: 50px; height: 50px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 24px; margin-right: 15px;">🏫</div>
                    <div>
                        <div style="color: #666; font-size: 14px; text-transform: uppercase;">Number of Labs</div>
                        <div style="color: #1976d2; font-size: 28px; font-weight: bold;">${this.stats.total}</div>
                    </div>
                </div>
                <div style="flex: 1; min-width: 250px; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center;">
                    <div style="background: #e8f5e9; color: #4caf50; width: 50px; height: 50px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 24px; margin-right: 15px;">👍</div>
                    <div>
                        <div style="color: #666; font-size: 14px; text-transform: uppercase;">Labs - Live</div>
                        <div style="color: #4caf50; font-size: 28px; font-weight: bold;">${this.stats.live} <span style="font-size: 16px; font-weight: normal;">(${livePct}%)</span></div>
                    </div>
                </div>
                <div style="flex: 1; min-width: 250px; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center;">
                    <div style="background: #fff3e0; color: #ff9800; width: 50px; height: 50px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 24px; margin-right: 15px;">👎</div>
                    <div>
                        <div style="color: #666; font-size: 14px; text-transform: uppercase;">Labs - Down</div>
                        <div style="color: #ff9800; font-size: 28px; font-weight: bold;">${this.stats.down} <span style="font-size: 16px; font-weight: normal;">(${downPct}%)</span></div>
                    </div>
                </div>
            </div>
        `;
    }

    renderChartSection() {
        return `
            <div style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #333; font-size: 16px;">District-wise Status</h3>
                    <div>
                        <label style="cursor: pointer;"><input type="radio" name="chartType" value="bar" checked> Bar</label>
                        <label style="margin-left: 15px; cursor: pointer;"><input type="radio" name="chartType" value="stacked"> Stacked</label>
                    </div>
                </div>
                <div style="position: relative; height: 300px; width: 100%;">
                    <canvas id="cccDistrictChart"></canvas>
                </div>
            </div>
        `;
    }

    renderTableSection() {
        let rows = this.data.slice(0, 25).map((school, index) => {
            const statusColor = (school.status && school.status.toLowerCase() === 'live') ? '#4caf50' : '#f44336';
            const statusText = (school.status && school.status.toLowerCase() === 'live') ? 'Live' : 'Down';
            // Store IPs securely as part of the JSON object parsed later if clicked
            return `
                <tr style="border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f9f9f9'" onmouseout="this.style.background='white'" onclick="if(window.tracker && window.tracker.openCccSchoolDashboard) window.tracker.openCccSchoolDashboard(${JSON.stringify(school).replace(/"/g, '&quot;')})">
                    <td style="padding: 12px 10px;">${index + 1}</td>
                    <td style="padding: 12px 10px;">${school.district || ''}</td>
                    <td style="padding: 12px 10px;">${school.ed_district || ''}</td>
                    <td style="padding: 12px 10px;">${school.block || ''}</td>
                    <td style="padding: 12px 10px;">${school.lab_id || school.udise || ''}</td>
                    <td style="padding: 12px 10px;">${school.school_name || ''}</td>
                    <td style="padding: 12px 10px;">${school.school_type || ''}</td>
                    <td style="padding: 12px 10px;"><span style="background: ${statusColor}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold;">${statusText}</span></td>
                </tr>
            `;
        }).join('');

        if (this.data.length === 0) {
            rows = '<tr><td colspan="8" style="padding: 20px; text-align: center; color: #666;">No data available</td></tr>';
        }

        return `
            <div style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow-x: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                    <h3 style="margin: 0; color: #333; font-size: 16px;">Report Data</h3>
                    <div>
                        <input type="text" placeholder="Search..." style="padding: 8px; border: 1px solid #ccc; border-radius: 4px; margin-right: 10px; min-width: 200px;">
                        <button style="padding: 8px 15px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer;">Export as Excel</button>
                    </div>
                </div>
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                    <thead>
                        <tr style="background: #1976d2; color: white;">
                            <th style="padding: 12px 10px; border-radius: 4px 0 0 0;">S.No</th>
                            <th style="padding: 12px 10px;">DISTRICT</th>
                            <th style="padding: 12px 10px;">ED. DISTRICT</th>
                            <th style="padding: 12px 10px;">BLOCK</th>
                            <th style="padding: 12px 10px;">LAB ID</th>
                            <th style="padding: 12px 10px;">SCHOOL NAME</th>
                            <th style="padding: 12px 10px;">SCHOOL TYPE</th>
                            <th style="padding: 12px 10px; border-radius: 0 4px 0 0;">STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
                <div style="margin-top: 15px; color: #666; font-size: 14px; display: flex; justify-content: space-between;">
                    <div>Showing 1 to ${Math.min(25, this.data.length)} of ${this.data.length} entries</div>
                    <div style="display: flex; gap: 5px;">
                        <button style="padding: 5px 10px; border: 1px solid #ccc; background: #fff; cursor: pointer; border-radius: 4px;">Previous</button>
                        <button style="padding: 5px 10px; border: 1px solid #007bff; background: #007bff; color: white; cursor: pointer; border-radius: 4px;">1</button>
                        <button style="padding: 5px 10px; border: 1px solid #ccc; background: #fff; cursor: pointer; border-radius: 4px;">Next</button>
                    </div>
                </div>
            </div>
        `;
    }

    initChart() {
        const ctx = document.getElementById('cccDistrictChart');
        if (!ctx || typeof Chart === 'undefined') return;

        const districts = Object.keys(this.districtData).sort();
        const liveData = districts.map(d => this.districtData[d].live);
        const downData = districts.map(d => this.districtData[d].down);

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: districts,
                datasets: [
                    {
                        label: 'Live',
                        data: liveData,
                        backgroundColor: '#4caf50',
                        barPercentage: 0.7
                    },
                    {
                        label: 'Down',
                        data: downData,
                        backgroundColor: '#e91e63', // Pink/Red matching CCC portal
                        barPercentage: 0.7
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: false, grid: { display: false } },
                    y: { stacked: false, beginAtZero: true }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end'
                    }
                }
            }
        });

        // Add event listeners for chart type toggle
        const radios = document.querySelectorAll('input[name="chartType"]');
        radios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const isStacked = e.target.value === 'stacked';
                this.chart.options.scales.x.stacked = isStacked;
                this.chart.options.scales.y.stacked = isStacked;
                this.chart.update();
            });
        });
    }

    initTableInteractions() {
        // Implement search and export logic here if needed
    }
}

window.cccMirror = new CCCMirrorDashboard();
