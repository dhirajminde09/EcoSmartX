/**
 * EcoSmartX Google Calendar & Demand Response View
 * Pure vanilla JavaScript + HTML5 + CSS3
 */
import { getIcon } from '../utils/icons.js';
import { formatCurrency, formatDateIST, formatTimeIST } from './views.js';

export function renderCalendar(store) {
  const fac = store.getActiveFacility();
  const isAuth = !!store.authUser;
  const authUser = store.authUser;
  const events = store.getEnergyEvents();
  const calendarEvents = store.calendarEvents || [];
  const isSyncing = store.isCalendarSyncing;

  // Filter state stored in window namespace
  const activeFilter = window.ecosmartxCalendarFilter || 'all';

  const filteredEvents = events.filter(e => {
    if (activeFilter === 'all') return true;
    return e.eventType === activeFilter;
  });

  // Calculate total scheduled peak reduction
  const totalReductionKw = events
    .filter(e => e.eventType === 'demand_response' || e.eventType === 'peak_shaving')
    .reduce((sum, e) => sum + (Number(e.targetReductionKw) || 0), 0);

  // Approximate peak tariff savings (₹260/kVA contract demand charge benchmark)
  const demandChargeRate = Number(fac.utilityTariff?.demandChargePerKw) || 260;
  const estDemandChargeSavings = totalReductionKw * demandChargeRate;

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title flex items-center gap-2">
          <span>Google Calendar & Demand Response</span>
          <span class="badge ${isAuth ? 'badge-emerald' : 'badge-amber'}">
            ${isAuth ? 'Google Account Connected' : 'Authorization Required'}
          </span>
        </h1>
        <p class="view-subtitle">
          Synchronize DISCOM peak load curtailment, HVAC maintenance intervals, and BEE / ECBC compliance audits directly to your Google Calendar.
        </p>
      </div>

      <div class="flex items-center gap-2">
        ${isAuth ? `
          <button class="btn btn-secondary text-xs" onclick="window.ecosmartx.syncCalendar()" ${isSyncing ? 'disabled' : ''}>
            ${getIcon('refresh', `w-3.5 h-3.5 ${isSyncing ? 'spin' : ''}`)}
            ${isSyncing ? 'Syncing...' : 'Sync Calendar'}
          </button>
          <button class="btn btn-primary text-xs" onclick="window.ecosmartx.openModal('scheduleEvent')">
            ${getIcon('plus', 'w-3.5 h-3.5')} Schedule Energy Event
          </button>
        ` : `
          <button class="gsi-material-button" onclick="window.ecosmartx.signInGoogle()">
            <div class="gsi-material-button-state"></div>
            <div class="gsi-material-button-content-wrapper">
              <div class="gsi-material-button-icon">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style="display: block;">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span class="gsi-material-button-contents">Sign in with Google</span>
            </div>
          </button>
        `}
      </div>
    </div>

    <!-- Google Workspace & Firebase Banner -->
    <div class="card p-5 mb-6" style="border: 1px solid var(--border-color); background: #FFFFFF;">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(0, 201, 216, 0.12); display: flex; align-items: center; justify-content: center; color: var(--cyan); flex-shrink: 0;">
            ${getIcon('calendar', 'w-6 h-6')}
          </div>
          <div>
            <div class="font-bold text-main text-sm flex items-center gap-2">
              <span>Google Calendar API & Firebase Firestore Integration</span>
              <span class="badge ${isAuth ? 'badge-emerald' : 'badge-amber'} text-xs">
                ${isAuth ? 'OAuth Active' : 'Authorization Required'}
              </span>
            </div>
            <p class="text-xs text-muted mt-0.5">
              ${isAuth 
                ? `Connected as <span class="text-emerald font-mono font-bold">${escapeHtml(authUser.email || authUser.displayName || 'Authorized User')}</span>. Events are mirrored real-time in Google Calendar and persisted in Firestore.`
                : 'Connect your Google account to automatically schedule peak-demand shaving intervals, maintenance windows, and energy audit reviews directly into your Google Calendar.'}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          ${isAuth ? `
            <div class="text-right hidden sm:block">
              <div class="text-xs text-dim">Cloud Storage</div>
              <div class="text-xs text-emerald font-mono font-bold">Firestore Live</div>
            </div>
            <button class="btn btn-secondary text-xs" onclick="window.ecosmartx.signOutGoogle()">
              ${getIcon('logOut', 'w-3.5 h-3.5')} Disconnect
            </button>
          ` : `
            <button class="gsi-material-button" onclick="window.ecosmartx.signInGoogle()">
              <div class="gsi-material-button-state"></div>
              <div class="gsi-material-button-content-wrapper">
                <div class="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style="display: block;">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span class="gsi-material-button-contents">Connect Google Calendar</span>
              </div>
            </button>
          `}
        </div>
      </div>
    </div>

    <!-- Telemetry Summary Cards -->
    <div class="stats-grid mb-6">
      <div class="stat-card">
        <div class="flex items-center justify-between">
          <span class="stat-label">Scheduled Energy Events</span>
          <div class="stat-icon-wrapper text-cyan">${getIcon('calendar', 'w-4 h-4')}</div>
        </div>
        <div class="stat-value">${events.length}</div>
        <div class="stat-trend text-muted">
          <span>${calendarEvents.length} synced to Google Calendar</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="flex items-center justify-between">
          <span class="stat-label">Target Peak Curtailment</span>
          <div class="stat-icon-wrapper text-emerald">${getIcon('zap', 'w-4 h-4')}</div>
        </div>
        <div class="stat-value">${totalReductionKw} kW</div>
        <div class="stat-trend text-emerald">
          <span>Active demand response capacity</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="flex items-center justify-between">
          <span class="stat-label">Est. Demand Savings</span>
          <div class="stat-icon-wrapper text-indigo">${getIcon('dollarSign', 'w-4 h-4')}</div>
        </div>
        <div class="stat-value">${formatCurrency(estDemandChargeSavings, fac.currency)}</div>
        <div class="stat-trend text-dim">
          <span>Monthly peak charge avoidance</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="flex items-center justify-between">
          <span class="stat-label">DISCOM Peak Window (ToD)</span>
          <div class="stat-icon-wrapper text-amber">${getIcon('clock', 'w-4 h-4')}</div>
        </div>
        <div class="stat-value">${fac.utilityTariff?.peakStartHour || 18}:00 – ${fac.utilityTariff?.peakEndHour || 22}:00 IST</div>
        <div class="stat-trend text-amber">
          <span>${formatCurrency(fac.utilityTariff?.peakRate || 9.80, fac.currency)}/kWh peak rate</span>
        </div>
      </div>
    </div>

    <!-- Quick Schedule Templates -->
    <div class="card mb-6">
      <div class="card-header">
        <div>
          <h3 class="card-title">1-Click Optimization Presets</h3>
          <p class="card-subtitle">Instantly dispatch demand-response and maintenance events into your Google Calendar</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="p-3.5 rounded-lg border border-subtle bg-surface hover:border-cyan transition flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="badge badge-rose text-xs">Peak Shaving</span>
              <span class="text-xs font-mono text-dim">-45 kW Curtailment</span>
            </div>
            <h4 class="font-bold text-white text-xs mb-1">DISCOM Evening Peak Curtailment Window</h4>
            <p class="text-xs text-muted mb-3">Pre-cools facility before 18:00 IST, then dials back non-critical chillers and elevator banks during DISCOM peak tariff hours (18:00–22:00 IST).</p>
          </div>
          <button class="btn btn-secondary text-xs w-full justify-center" onclick="window.ecosmartx.quickSchedule('peak_shaving')">
            ${getIcon('calendar', 'w-3.5 h-3.5 text-cyan')} Schedule for Today
          </button>
        </div>

        <div class="p-3.5 rounded-lg border border-subtle bg-surface hover:border-emerald transition flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="badge badge-amber text-xs">HVAC Maintenance</span>
              <span class="text-xs font-mono text-dim">+12% COP Gain</span>
            </div>
            <h4 class="font-bold text-white text-xs mb-1">Chiller & Air Handler Inspection</h4>
            <p class="text-xs text-muted mb-3">Filter replacement, condenser coil chemical wash, and refrigerant pressure check to prevent efficiency degradation.</p>
          </div>
          <button class="btn btn-secondary text-xs w-full justify-center" onclick="window.ecosmartx.quickSchedule('maintenance')">
            ${getIcon('calendar', 'w-3.5 h-3.5 text-emerald')} Schedule for Tomorrow
          </button>
        </div>

        <div class="p-3.5 rounded-lg border border-subtle bg-surface hover:border-indigo transition flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="badge badge-indigo text-xs">BEE Energy Audit</span>
              <span class="text-xs font-mono text-dim">BEE / ECBC 2017</span>
            </div>
            <h4 class="font-bold text-white text-xs mb-1">Quarterly BEE ECBC Compliance Audit</h4>
            <p class="text-xs text-muted mb-3">Comprehensive on-site walk-through audit, thermal imaging inspection for building envelope leaks, and sub-meter calibration review.</p>
          </div>
          <button class="btn btn-secondary text-xs w-full justify-center" onclick="window.ecosmartx.quickSchedule('energy_audit')">
            ${getIcon('calendar', 'w-3.5 h-3.5 text-indigo')} Schedule Next Week
          </button>
        </div>
      </div>
    </div>

    <!-- Event Schedule Filter and List -->
    <div class="card">
      <div class="card-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 class="card-title">Scheduled Energy Events</h3>
          <p class="card-subtitle">Managed intervals synced to Google Calendar and stored in Firebase</p>
        </div>

        <!-- Filter Tabs -->
        <div class="flex items-center gap-1.5 p-1 rounded-md bg-surface border border-subtle text-xs">
          <button class="px-2.5 py-1 rounded ${activeFilter === 'all' ? 'btn-primary text-xs' : 'text-muted hover:text-main'}" onclick="window.ecosmartx.setCalendarFilter('all')">
            All (${events.length})
          </button>
          <button class="px-2.5 py-1 rounded ${activeFilter === 'demand_response' || activeFilter === 'peak_shaving' ? 'btn-primary text-xs' : 'text-muted hover:text-main'}" onclick="window.ecosmartx.setCalendarFilter('demand_response')">
            Demand Response
          </button>
          <button class="px-2.5 py-1 rounded ${activeFilter === 'maintenance' ? 'btn-primary text-xs' : 'text-muted hover:text-main'}" onclick="window.ecosmartx.setCalendarFilter('maintenance')">
            Maintenance
          </button>
          <button class="px-2.5 py-1 rounded ${activeFilter === 'energy_audit' ? 'btn-primary text-xs' : 'text-muted hover:text-main'}" onclick="window.ecosmartx.setCalendarFilter('energy_audit')">
            Audits
          </button>
        </div>
      </div>

      ${filteredEvents.length === 0 ? `
        <div class="text-center py-12 text-dim">
          <div class="mb-2 text-muted">${getIcon('calendar', 'w-8 h-8 mx-auto')}</div>
          <p class="text-sm">No scheduled events matching filter</p>
          <button class="btn btn-secondary text-xs mt-3" onclick="window.ecosmartx.openModal('scheduleEvent')">
            Create First Energy Event
          </button>
        </div>
      ` : `
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Event Title</th>
                <th>Category</th>
                <th>Scheduled Window</th>
                <th>Target Curtailment</th>
                <th>Calendar Sync</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEvents.map(evt => {
                const start = new Date(evt.startTime);
                const end = new Date(evt.endTime);
                const dateStr = formatDateIST(start);
                const timeStr = `${formatTimeIST(start)} – ${formatTimeIST(end)}`;
                
                let badgeClass = 'badge-cyan';
                let typeLabel = 'Energy Event';
                if (evt.eventType === 'demand_response' || evt.eventType === 'peak_shaving') {
                  badgeClass = 'badge-rose';
                  typeLabel = 'Demand Response';
                } else if (evt.eventType === 'maintenance') {
                  badgeClass = 'badge-amber';
                  typeLabel = 'Maintenance';
                } else if (evt.eventType === 'energy_audit') {
                  badgeClass = 'badge-indigo';
                  typeLabel = 'Energy Audit';
                }

                return `
                  <tr>
                    <td>
                      <div class="font-bold text-white text-xs">${escapeHtml(evt.title)}</div>
                      <div class="text-dim text-xs truncate max-w-xs">${escapeHtml(evt.description || 'Facility optimization window')}</div>
                    </td>
                    <td>
                      <span class="badge ${badgeClass} text-xs">${typeLabel}</span>
                    </td>
                    <td>
                      <div class="text-xs font-mono text-white">${dateStr}</div>
                      <div class="text-dim text-xs font-mono">${timeStr}</div>
                    </td>
                    <td>
                      ${evt.targetReductionKw ? `
                        <span class="font-mono text-xs text-emerald font-bold">-${evt.targetReductionKw} kW</span>
                      ` : `
                        <span class="text-dim text-xs font-mono">—</span>
                      `}
                    </td>
                    <td>
                      ${evt.calendarEventId ? `
                        <span class="badge badge-emerald text-xs flex items-center gap-1 w-fit">
                          ${getIcon('checkCircle', 'w-3 h-3')} Synced
                        </span>
                      ` : `
                        <span class="badge badge-slate text-xs flex items-center gap-1 w-fit">
                          ${getIcon('clock', 'w-3 h-3')} Local Record
                        </span>
                      `}
                    </td>
                    <td style="text-align: right;">
                      <div class="flex items-center justify-end gap-1.5">
                        ${evt.calendarEventId ? `
                          <a href="https://calendar.google.com/calendar" target="_blank" rel="noopener noreferrer" class="btn btn-secondary p-1.5 text-xs" title="Open in Google Calendar">
                            ${getIcon('arrowUpRight', 'w-3.5 h-3.5')}
                          </a>
                        ` : ''}
                        <button class="btn btn-secondary p-1.5 text-xs text-rose hover:bg-rose/20" title="Delete Event" onclick="window.ecosmartx.deleteEvent('${evt.id}', '${escapeHtml(evt.title)}')">
                          ${getIcon('trash2', 'w-3.5 h-3.5')}
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
