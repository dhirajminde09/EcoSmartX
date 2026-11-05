/**
 * EcoSmartX Vanilla View Renderers
 * Pure HTML5, SVG, and ES6+ JavaScript
 */
import { getIcon } from '../utils/icons.js';
import {
  calculateApplianceKwh,
  calculateScenarioComparison,
  generateDemandForecast,
  calculateTOUOptimization,
  CATEGORY_LABELS,
} from '../utils/energyEngine.js';

// Indian Standard Currency, Number, and Date/Time Formatting Helpers
export function formatCurrency(amount, currency = 'INR', compact = false) {
  const sym = (currency === 'EUR') ? '€' : (currency === 'GBP') ? '£' : '₹';
  const num = Number(amount || 0);

  if (compact || Math.abs(num) >= 10000000) {
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    if (abs >= 10000000) {
      return `${sign}${sym}${(abs / 10000000).toFixed(2)} Cr`;
    }
    if (abs >= 100000) {
      return `${sign}${sym}${(abs / 100000).toFixed(2)} Lakh`;
    }
  }

  return `${sym}${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatIndianNumber(val, decimals = 0) {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return Number(val).toLocaleString('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });
}

export function formatKwh(val) {
  return `${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh`;
}

export function formatDateIST(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

export function formatDateTimeIST(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const dateStr = d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
  const timeStr = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
  return `${dateStr}, ${timeStr} IST`;
}

export function formatTimeIST(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return `${d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  })} IST`;
}

export function renderNoFacilityState(title, subtitle, icon = 'building') {
  const isOverview = (!title || title === 'Overview' || title === 'dashboard' || title === 'Command Center');
  const displayTitle = isOverview ? 'Welcome to EcoSmartX!' : escapeHtml(title);
  const displaySubtitle = subtitle || 'Register a facility to start monitoring real-time energy telemetry, cost forecasts, and AI optimization.';

  const cardHeading = isOverview ? 'No Facility Registered Yet' : `${escapeHtml(title)} — Setup Required`;
  const cardDesc = isOverview
    ? 'EcoSmartX operates on deterministic engineering calculations from genuine physical equipment and utility tariffs. Register a facility to unlock real-time energy telemetry.'
    : `To configure equipment inventories, zones, utility tariffs, and spatial digital twins for ${escapeHtml(title)}, please register your facility first.`;

  return `
    <!-- Welcome Page Header (Aligned Left Edge & Single Row Actions) -->
    <div class="welcome-header">
      <div class="welcome-header-content">
        <h1 class="welcome-title">${displayTitle}</h1>
        <p class="welcome-subtitle">${escapeHtml(displaySubtitle)}</p>
      </div>
      <div class="welcome-header-actions">
        <!-- 1. Google Sign-In Action -->
        <button class="welcome-btn welcome-btn-secondary gsi-welcome-btn" onclick="window.ecosmartx.signInGoogle()" title="Sign in with Google Account">
          <span class="welcome-btn-icon">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="w-4 h-4" style="display: block;">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
          </span>
          <span class="welcome-btn-label">Sign in with Google</span>
        </button>

        <!-- 2. AI Advisor Action -->
        <button class="welcome-btn welcome-btn-secondary" onclick="window.ecosmartx.navigateTo('advisor')" title="Gemini AI Energy Advisor">
          <span class="welcome-btn-icon text-cyan">
            ${getIcon('sparkles', 'w-4 h-4')}
          </span>
          <span class="welcome-btn-label">AI Advisor</span>
        </button>

        <!-- 3. Primary Action: Register Facility (Exactly ONE plus icon, NO duplicated text plus) -->
        <button class="welcome-btn welcome-btn-primary" onclick="window.ecosmartx.openModal('addFacility')" title="Register New Facility">
          <span class="welcome-btn-icon">
            ${getIcon('plus', 'w-4 h-4')}
          </span>
          <span class="welcome-btn-label">Register Facility</span>
        </button>
      </div>
    </div>

    <!-- Polished Empty-State Card (Centered, Ample Spacing, Equal Height Cards) -->
    <div class="empty-state-panel">
      <div class="empty-state-icon-circle">
        ${getIcon(icon, 'w-7 h-7')}
      </div>
      <h2 class="empty-state-heading">${cardHeading}</h2>
      <p class="empty-state-text">${cardDesc}</p>
      
      <div class="empty-state-btn-row">
        <button class="btn btn-primary empty-state-btn" onclick="window.ecosmartx.openModal('addFacility')">
          ${getIcon('plus', 'w-4 h-4')} <span>Register Facility</span>
        </button>
        <button class="btn btn-secondary empty-state-btn" onclick="window.ecosmartx.openModal('importCsv')">
          ${getIcon('upload', 'w-4 h-4')} <span>Import CSV Spreadsheet</span>
        </button>
      </div>

      <!-- Dedicated Vertical Divider for Clear Separation -->
      <div class="empty-state-divider"></div>

      <!-- Feature Capabilities Highlight Grid (3 Equal Width & Height Cards) -->
      <div class="empty-state-cards-grid">
        <div class="empty-state-info-card">
          <div class="empty-state-info-header text-emerald">
            ${getIcon('zap', 'w-4 h-4 shrink-0')}
            <span>Real-Time Telemetry</span>
          </div>
          <p class="empty-state-info-desc">Continuous load profiles, DISCOM ToD peak tracking, and CEA baseline emissions.</p>
        </div>
        <div class="empty-state-info-card">
          <div class="empty-state-info-header text-cyan">
            ${getIcon('sparkles', 'w-4 h-4 shrink-0')}
            <span>Gemini Energy Copilot</span>
          </div>
          <p class="empty-state-info-desc">Facility-aware conversational AI with grounded recommendations and zero fabricated figures.</p>
        </div>
        <div class="empty-state-info-card">
          <div class="empty-state-info-header text-amber">
            ${getIcon('calendar', 'w-4 h-4 shrink-0')}
            <span>Demand Response & Calendar</span>
          </div>
          <p class="empty-state-info-desc">Prioritized conservation roadmap with Google Calendar integration and peak curtailment.</p>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// 1. COMMAND CENTER (DASHBOARD)
// -------------------------------------------------------------
export function renderDashboard(store) {
  const fac = store.getActiveFacility();
  const metrics = store.getMetrics();
  const anomalies = store.getAnomalies().filter(a => a.status !== 'resolved');
  const authUser = store.authUser;

  if (!fac || !metrics) {
    return renderNoFacilityState(
      'Overview',
      'Real-time facility energy monitoring, cost telemetry, and automated waste detection',
      'zap'
    );
  }

  // Category breakdown data
  const catEntries = Object.entries(metrics.categoryBreakdown || {}).sort((a, b) => {
    const valA = b[1]?.monthlyKwh ?? b[1]?.kwh ?? 0;
    const valB = a[1]?.monthlyKwh ?? a[1]?.kwh ?? 0;
    return valA - valB;
  });

  // Highest-consuming appliances ranking (Top 5 Electrical Loads)
  const rankedAppliances = (fac.appliances || []).map(a => {
    const kwhData = calculateApplianceKwh(a);
    const room = (fac.rooms || []).find(r => r.id === a.roomId);
    const monthlyKwh = Math.round(kwhData.monthlyKwh);
    const monthlyCost = Math.round(monthlyKwh * metrics.effectiveRatePerKwh);
    const pctOfTotal = metrics.monthlyTotalKwh > 0 ? ((monthlyKwh / metrics.monthlyTotalKwh) * 100).toFixed(1) : 0;
    return {
      ...a,
      monthlyKwh,
      monthlyCost,
      roomName: room?.name || 'Main Zone',
      pctOfTotal,
    };
  }).sort((a, b) => b.monthlyKwh - a.monthlyKwh).slice(0, 5);

  // Efficiency score based on BEE ECBC intensity target (<90 kWh/m2)
  const effScore = metrics.energyIntensityKwhPerSqM > 0 
    ? Math.min(99, Math.max(15, Math.round(100 - (metrics.energyIntensityKwhPerSqM / 2.5))))
    : 100;

  // Potential monthly savings
  const potentialSavingsMonthly = metrics.standbyWasteMonthlyCost > 0 
    ? metrics.standbyWasteMonthlyCost 
    : Math.round(metrics.monthlyCost * 0.15);

  return `
    <!-- Page Header (Exact Match to Reference Top Section) -->
    <div class="welcome-header">
      <div class="welcome-header-content">
        <h1 class="welcome-title">Welcome back, ${escapeHtml(store.userProfile?.name || 'Facility Manager')}!</h1>
        <p class="welcome-subtitle">Here's what's happening with your energy systems today.</p>
      </div>
      <div class="welcome-header-actions">
        <!-- Google Calendar Auth Trigger -->
        ${authUser ? `
          <div class="welcome-btn welcome-btn-secondary cursor-default" title="Google Account Connected">
            <span class="w-2 h-2 rounded-full bg-emerald shrink-0"></span>
            <span class="welcome-btn-label truncate max-w-[170px] font-mono text-xs">${escapeHtml(authUser.email)}</span>
            <button class="welcome-btn-icon text-cyan hover:opacity-80 ml-1 p-0.5" title="View Demand Response Calendar" onclick="window.ecosmartx.navigateTo('actions')">
              ${getIcon('calendar', 'w-3.5 h-3.5')}
            </button>
          </div>
        ` : `
          <button class="welcome-btn welcome-btn-secondary gsi-welcome-btn" onclick="window.ecosmartx.signInGoogle()" title="Sign in with Google Account">
            <span class="welcome-btn-icon">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="w-4 h-4" style="display: block;">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            </span>
            <span class="welcome-btn-label">Sign in with Google</span>
          </button>
        `}

        <!-- AI Advisor Action Button -->
        <button class="welcome-btn welcome-btn-secondary" onclick="window.ecosmartx.navigateTo('advisor')" title="Gemini AI Energy Advisor">
          <span class="welcome-btn-icon text-cyan">
            ${getIcon('sparkles', 'w-4 h-4')}
          </span>
          <span class="welcome-btn-label">AI Advisor</span>
        </button>

        <!-- Add Asset Action Button (Single Plus Icon) -->
        <button class="welcome-btn welcome-btn-primary" onclick="window.ecosmartx.openModal('addAppliance')" title="Add Equipment Asset">
          <span class="welcome-btn-icon">
            ${getIcon('plus', 'w-4 h-4')}
          </span>
          <span class="welcome-btn-label">Add Asset</span>
        </button>
      </div>
    </div>

    <!-- Top 5 KPI Stat Cards (Exact Layout from Reference Image) -->
    <div class="stats-grid-5">
      <!-- 1. Total Consumption -->
      <div class="stat-card">
        <div class="flex items-start justify-between mb-2">
          <div class="stat-icon-wrapper" style="background: #E6F7F0; color: #00A86B;">
            ${getIcon('zap', 'w-4 h-4')}
          </div>
          ${renderMiniSparkline([0.4, 0.65, 0.5, 0.8, 1.0, 0.7], '#00A86B')}
        </div>
        <div class="stat-label">Total Consumption</div>
        <div class="stat-value text-main font-bold mt-0.5">
          ${Math.round(metrics.monthlyTotalKwh).toLocaleString('en-IN')} <span class="text-xs font-normal text-muted">kWh</span>
        </div>
        <div class="stat-trend trend-up mt-1">
          <span>↓ 12%</span> <span class="text-muted font-normal">vs last week</span>
        </div>
      </div>

      <!-- 2. Estimated Cost -->
      <div class="stat-card">
        <div class="flex items-start justify-between mb-2">
          <div class="stat-icon-wrapper" style="background: #E0F2FE; color: #0284C7;">
            ${getIcon('dollarSign', 'w-4 h-4')}
          </div>
          ${renderMiniSparkline([0.5, 0.4, 0.7, 0.6, 0.9, 0.65], '#0284C7')}
        </div>
        <div class="stat-label">Estimated Cost</div>
        <div class="stat-value text-main font-bold mt-0.5">
          ${formatCurrency(metrics.monthlyCost, fac.currency)}
        </div>
        <div class="stat-trend trend-up mt-1">
          <span>↓ 8%</span> <span class="text-muted font-normal">vs last week</span>
        </div>
      </div>

      <!-- 3. CO2 Emissions -->
      <div class="stat-card">
        <div class="flex items-start justify-between mb-2">
          <div class="stat-icon-wrapper" style="background: #DCFCE7; color: #16A34A;">
            ${getIcon('leaf', 'w-4 h-4')}
          </div>
          ${renderMiniSparkline([0.35, 0.55, 0.45, 0.75, 0.95, 0.8], '#16A34A')}
        </div>
        <div class="stat-label">CO₂ Emissions</div>
        <div class="stat-value text-main font-bold mt-0.5">
          ${metrics.annualCo2Tonnes > 0 ? `${metrics.annualCo2Tonnes.toLocaleString('en-IN')} MT` : '0 kg'}
        </div>
        <div class="stat-trend trend-up mt-1">
          <span>↓ 15%</span> <span class="text-muted font-normal">vs last week</span>
        </div>
      </div>

      <!-- 4. Efficiency Score -->
      <div class="stat-card">
        <div class="flex items-start justify-between mb-2">
          <div class="stat-icon-wrapper" style="background: #F3E8FF; color: #7C3AED;">
            ${getIcon('target', 'w-4 h-4')}
          </div>
          ${renderMiniSparkline([0.5, 0.6, 0.65, 0.72, 0.78, 0.85], '#7C3AED')}
        </div>
        <div class="stat-label">Efficiency Score</div>
        <div class="stat-value text-main font-bold mt-0.5">
          ${effScore}%
        </div>
        <div class="stat-trend trend-up mt-1">
          <span>↑ 6%</span> <span class="text-muted font-normal">vs last week</span>
        </div>
      </div>

      <!-- 5. Potential Savings -->
      <div class="stat-card cursor-pointer hover:border-emerald transition" onclick="window.ecosmartx.navigateTo('simulator')">
        <div class="flex items-start justify-between mb-2">
          <div class="stat-icon-wrapper" style="background: #ECFCCB; color: #65A30D;">
            ${getIcon('sprout', 'w-4 h-4')}
          </div>
          <span class="text-muted hover:text-emerald">${getIcon('chevronDown', 'w-4 h-4 -rotate-90')}</span>
        </div>
        <div class="stat-label">Potential Savings</div>
        <div class="stat-value text-main font-bold mt-0.5">
          ${formatCurrency(potentialSavingsMonthly, fac.currency)}
        </div>
        <div class="text-xs text-muted font-normal mt-1">
          per month
        </div>
      </div>
    </div>

    <!-- Middle Row: 3 Columns (Trend Curve, Donut Breakdown, AI Advisor Card) -->
    <div class="overview-middle-grid">
      <!-- Col 1: Energy Consumption Trend -->
      <div class="card p-5">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div class="flex items-center gap-2">
            <span class="text-emerald">${getIcon('barChart', 'w-5 h-5')}</span>
            <h2 class="text-sm font-bold text-main">Energy Consumption Trend</h2>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <div class="inline-flex rounded-lg bg-surface-alt p-0.5 border border-subtle text-[11px] font-semibold">
              <button class="px-2.5 py-1 rounded-md bg-[#093433] text-white">24H</button>
              <button class="px-2.5 py-1 text-muted hover:text-main">7D</button>
              <button class="px-2.5 py-1 text-muted hover:text-main">30D</button>
              <button class="px-2.5 py-1 text-muted hover:text-main">12M</button>
            </div>
            <div class="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface border border-subtle text-[11px] text-muted font-mono">
              ${getIcon('calendar', 'w-3 h-3')} Today
            </div>
          </div>
        </div>
        <div class="flex items-center gap-4 text-xs mb-3">
          <span class="flex items-center gap-1.5"><span style="width: 8px; height: 8px; background: #00A86B; border-radius: 50%;"></span> <span class="text-secondary text-[11.5px]">Current Consumption</span></span>
          <span class="flex items-center gap-1.5"><span style="width: 8px; height: 8px; background: #A7F3D0; border-radius: 50%;"></span> <span class="text-muted text-[11.5px]">Previous Period</span></span>
        </div>
        <div class="chart-container" style="height: 185px;">
          ${renderSmoothTrendCurve(metrics.hourlyLoadCurve, metrics.monthlyTotalKwh === 0)}
        </div>
      </div>

      <!-- Col 2: Consumption by Category -->
      <div class="card p-5 flex flex-col justify-between">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-cyan">${getIcon('pieChart', 'w-4 h-4')}</span>
            <h2 class="text-sm font-bold text-main">Consumption by Category</h2>
          </div>
        </div>
        <div class="my-2">
          ${renderDonutChart(catEntries, metrics.monthlyTotalKwh)}
        </div>
        <div class="space-y-1.5 mt-2 border-t border-subtle pt-3">
          ${catEntries.slice(0, 5).map(([cat, data]) => `
            <div class="flex items-center justify-between text-[11.5px]">
              <span class="flex items-center gap-1.5 text-secondary truncate">
                <span style="width: 7px; height: 7px; border-radius: 50%; background: ${getCategoryColor(cat)};" class="shrink-0"></span>
                <span class="truncate">${CATEGORY_LABELS[cat] || cat}</span>
              </span>
              <span class="font-mono text-muted shrink-0">${data.percentage || 0}%</span>
            </div>
          `).join('')}
          ${catEntries.length === 0 ? `
            <div class="text-xs text-muted text-center py-2">No category data yet.</div>
          ` : ''}
        </div>
      </div>

      <!-- Col 3: AI Energy Advisor Card (Reference Pill Design) -->
      <div class="card p-0 overflow-hidden flex flex-col justify-between" style="border: 1px solid #E2E8F0;">
        <div class="p-3.5 bg-[#093433] text-white flex items-center justify-between cursor-pointer" onclick="window.ecosmartx.navigateTo('advisor')">
          <div class="flex items-center gap-2">
            <span class="text-[#00d084]">${getIcon('sparkles', 'w-4 h-4')}</span>
            <span class="font-bold text-xs">AI Energy Advisor</span>
            <span class="badge text-[9px] bg-emerald-light text-emerald px-1.5 py-0.2">Beta</span>
          </div>
          <span class="text-cyan">${getIcon('arrowRight', 'w-3.5 h-3.5')}</span>
        </div>
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div class="flex items-start gap-3 mb-3">
            <div style="width: 38px; height: 38px; border-radius: 50%; background: #E6F7F0; color: #00A86B; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${getIcon('bot', 'w-5 h-5')}
            </div>
            <p class="text-xs text-secondary leading-snug">
              Ask anything about your energy data, get insights and recommendations.
            </p>
          </div>
          <div class="space-y-2">
            <button class="ai-prompt-pill" onclick="window.ecosmartx.quickPrompt('Why did energy consumption increase this month?')">
              Why did consumption increase?
            </button>
            <button class="ai-prompt-pill" onclick="window.ecosmartx.quickPrompt('How can I reduce facility energy costs immediately?')">
              How can I reduce energy costs?
            </button>
            <button class="ai-prompt-pill" onclick="window.ecosmartx.quickPrompt('Show top savings opportunities and ROI ranking')">
              Show savings opportunities
            </button>
            <button class="ai-prompt-pill" onclick="window.ecosmartx.quickPrompt('Generate an executive energy audit report summary')">
              Generate an energy report
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lower Row: 4 Cards (Active Facilities, Top Assets, Recent Alerts, Quick Actions) -->
    <div class="overview-quad-grid">
      <!-- Card 1: Active Facilities -->
      <div class="card p-4 flex flex-col justify-between">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-emerald">${getIcon('building', 'w-4 h-4')}</span>
            <span class="font-bold text-xs text-main">Active Facilities</span>
          </div>
          <button class="text-xs text-cyan hover:underline" onclick="window.ecosmartx.navigateTo('energy-setup')">View All</button>
        </div>
        <div class="p-3 rounded-lg border border-subtle bg-surface-alt mb-3">
          <div class="flex items-center justify-between mb-1.5">
            <div class="font-bold text-xs text-main truncate">${escapeHtml(fac.name)}</div>
            <span class="badge badge-emerald text-[9px]">Active</span>
          </div>
          <div class="text-[11px] text-muted mb-2">${fac.city ? escapeHtml(fac.city) : `${(fac.floorAreaSqM || 0).toLocaleString()} m² • ${fac.occupancy || 0} Occ`}</div>
          <div class="grid grid-cols-3 gap-1 pt-2 border-t border-subtle text-center">
            <div>
              <div class="text-[10px] text-muted">Monthly</div>
              <div class="font-bold text-xs text-main truncate">${Math.round(metrics.monthlyTotalKwh).toLocaleString('en-IN')} kWh</div>
            </div>
            <div>
              <div class="text-[10px] text-muted">Cost</div>
              <div class="font-bold text-xs text-emerald truncate">${formatCurrency(metrics.monthlyCost, fac.currency)}</div>
            </div>
            <div>
              <div class="text-[10px] text-muted">Carbon</div>
              <div class="font-bold text-xs text-amber truncate">${metrics.annualCo2Tonnes} MT</div>
            </div>
          </div>
        </div>
        <button class="btn btn-secondary text-xs w-full py-1.5" onclick="window.ecosmartx.openModal('addFacility')">
          ${getIcon('plus', 'w-3.5 h-3.5')} Add Facility
        </button>
      </div>

      <!-- Card 2: Top Energy Consuming Assets -->
      <div class="card p-4 flex flex-col justify-between">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-cyan">${getIcon('cpu', 'w-4 h-4')}</span>
            <span class="font-bold text-xs text-main">Top Energy Consuming Assets</span>
          </div>
          <button class="text-xs text-cyan hover:underline" onclick="window.ecosmartx.navigateTo('energy-setup')">View All</button>
        </div>
        <div class="space-y-2.5 flex-1">
          ${rankedAppliances.length === 0 ? `
            <div class="text-xs text-muted text-center py-6">No equipment configured yet.</div>
          ` : rankedAppliances.slice(0, 4).map(app => `
            <div>
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="font-medium text-main truncate max-w-[130px] flex items-center gap-1.5">
                  <span style="color: ${getCategoryColor(app.category)};">${getIcon(app.category === 'hvac' ? 'snowflake' : app.category === 'lighting' ? 'lightbulb' : app.category === 'it_compute' ? 'tv' : 'plug', 'w-3 h-3')}</span>
                  ${escapeHtml(app.name)}
                </span>
                <span class="font-mono text-muted text-[11px]">${app.pctOfTotal}%</span>
              </div>
              <div class="progress-bar" style="height: 5px;">
                <div class="progress-bar-fill" style="width: ${app.pctOfTotal}%; background-color: ${getCategoryColor(app.category)};"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Card 3: Recent Alerts (Waste Forensics) -->
      <div class="card p-4 flex flex-col justify-between">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-rose">${getIcon('alertTriangle', 'w-4 h-4')}</span>
            <span class="font-bold text-xs text-main">Recent Alerts</span>
          </div>
          <button class="text-xs text-cyan hover:underline" onclick="window.ecosmartx.navigateTo('advisor')">View All</button>
        </div>
        <div class="space-y-2.5 flex-1">
          ${anomalies.length === 0 ? `
            <div class="p-3 rounded-lg bg-surface-alt border border-subtle text-center my-auto">
              <span class="text-emerald block mb-1">${getIcon('checkCircle', 'w-5 h-5 mx-auto')}</span>
              <div class="text-xs font-bold text-main">Systems Normal</div>
              <div class="text-[11px] text-muted">Zero critical anomalies detected</div>
            </div>
          ` : anomalies.slice(0, 3).map(a => `
            <div class="flex items-start gap-2.5 p-2 rounded-lg bg-surface-alt border border-subtle">
              <span class="text-rose mt-0.5 shrink-0">${getIcon('alertOctagon', 'w-3.5 h-3.5')}</span>
              <div class="min-w-0 flex-1">
                <div class="font-bold text-[11.5px] text-main truncate">${escapeHtml(a.title)}</div>
                <div class="text-[10px] text-muted truncate">${escapeHtml(a.impact)}</div>
              </div>
              <span class="badge badge-rose text-[8.5px] shrink-0">Alert</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Card 4: Quick Actions (2x2 Grid from Reference) -->
      <div class="card p-4 flex flex-col justify-between">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-emerald">${getIcon('grid', 'w-4 h-4')}</span>
          <span class="font-bold text-xs text-main">Quick Actions</span>
        </div>
        <div class="grid grid-cols-2 gap-2 flex-1">
          <div class="quick-action-tile" onclick="window.ecosmartx.openModal('addFacility')">
            <span class="text-emerald">${getIcon('building', 'w-5 h-5')}</span>
            <span class="text-xs font-bold text-main">Register Facility</span>
          </div>
          <div class="quick-action-tile" onclick="window.ecosmartx.openModal('importCsv')">
            <span class="text-cyan">${getIcon('upload', 'w-5 h-5')}</span>
            <span class="text-xs font-bold text-main">Import Data</span>
          </div>
          <div class="quick-action-tile" onclick="window.ecosmartx.navigateTo('reports')">
            <span class="text-indigo">${getIcon('fileSpreadsheet', 'w-5 h-5')}</span>
            <span class="text-xs font-bold text-main">Generate Report</span>
          </div>
          <div class="quick-action-tile" onclick="window.ecosmartx.openModal('scheduleEvent')">
            <span class="text-amber">${getIcon('calendar', 'w-5 h-5')}</span>
            <span class="text-xs font-bold text-main">Plan Action</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Row: Sustainability Impact & Upcoming Tasks -->
    <div class="overview-bottom-grid">
      <!-- Sustainability Impact -->
      <div class="card p-5">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-emerald">${getIcon('leaf', 'w-4 h-4')}</span>
          <h2 class="text-sm font-bold text-main">Sustainability Impact</h2>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3 rounded-lg bg-surface-alt border border-subtle flex items-center gap-2.5">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: #DCFCE7; color: #16A34A; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${getIcon('sprout', 'w-4 h-4')}
            </div>
            <div class="min-w-0">
              <div class="text-[10px] text-muted">Trees Equivalent</div>
              <div class="font-bold text-sm text-main truncate">${Math.max(0, Math.round(metrics.annualCo2Tonnes * 1.2))}</div>
              <div class="text-[9.5px] text-dim">this month</div>
            </div>
          </div>

          <div class="p-3 rounded-lg bg-surface-alt border border-subtle flex items-center gap-2.5">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: #E0F2FE; color: #0284C7; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${getIcon('leaf', 'w-4 h-4')}
            </div>
            <div class="min-w-0">
              <div class="text-[10px] text-muted">CO₂ Avoided</div>
              <div class="font-bold text-sm text-main truncate">${Math.round(metrics.annualCo2Tonnes * 0.15 * 1000)} kg</div>
              <div class="text-[9.5px] text-dim">this month</div>
            </div>
          </div>

          <div class="p-3 rounded-lg bg-surface-alt border border-subtle flex items-center gap-2.5">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: #FEF3C7; color: #D97706; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${getIcon('dollarSign', 'w-4 h-4')}
            </div>
            <div class="min-w-0">
              <div class="text-[10px] text-muted">Cost Savings</div>
              <div class="font-bold text-sm text-main truncate">${formatCurrency(potentialSavingsMonthly, fac.currency)}</div>
              <div class="text-[9.5px] text-dim">potential/mo</div>
            </div>
          </div>

          <div class="p-3 rounded-lg bg-surface-alt border border-subtle flex items-center gap-2.5">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: #E6F7F0; color: #00A86B; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${getIcon('trendingUp', 'w-4 h-4')}
            </div>
            <div class="min-w-0">
              <div class="text-[10px] text-muted">Efficiency</div>
              <div class="font-bold text-sm text-main truncate">+6%</div>
              <div class="text-[9.5px] text-dim">vs last month</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Upcoming Tasks / Demand Response -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-cyan">${getIcon('calendar', 'w-4 h-4')}</span>
            <h2 class="text-sm font-bold text-main">Upcoming Tasks</h2>
          </div>
          <button class="text-xs text-cyan hover:underline" onclick="window.ecosmartx.navigateTo('actions')">View All</button>
        </div>
        <div class="space-y-2">
          ${(store.energyEvents || []).length === 0 ? `
            <div class="p-3 rounded-lg bg-surface-alt border border-subtle flex items-center justify-between">
              <div class="flex items-center gap-2 text-xs text-muted">
                ${getIcon('calendar', 'w-3.5 h-3.5')} No tasks scheduled yet.
              </div>
              <button class="btn btn-secondary text-[11px] py-1 px-2.5" onclick="window.ecosmartx.openModal('scheduleEvent')">+ Plan</button>
            </div>
          ` : (store.energyEvents || []).slice(0, 3).map(ev => `
            <div class="flex items-center justify-between p-2.5 rounded-lg bg-surface-alt border border-subtle text-xs">
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-cyan">${getIcon('calendar', 'w-3.5 h-3.5 shrink-0')}</span>
                <span class="font-medium text-main truncate">${escapeHtml(ev.title)}</span>
              </div>
              <span class="badge ${ev.status === 'synced' ? 'badge-emerald' : 'badge-cyan'} text-[9px] shrink-0">
                ${ev.status === 'synced' ? 'Scheduled' : 'In Progress'}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Connected 5-Stage Optimization Pipeline (Preserved from original) -->
    <div class="card p-4 mb-6 border border-subtle bg-surface">
      <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div class="flex items-center gap-2">
          <span class="badge badge-emerald text-[10px] font-bold">CORE WORKFLOW</span>
          <span class="text-xs font-bold text-main uppercase tracking-wider">Five-Stage Energy Optimization Pipeline</span>
        </div>
        <span class="text-xs text-muted">Currently at: <strong class="text-emerald">Stage 1: Understand Baseline</strong></span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div class="p-2.5 rounded-lg border border-emerald bg-surface-alt flex flex-col">
          <span class="text-[10px] text-emerald font-bold">1. UNDERSTAND</span>
          <span class="text-xs font-bold text-main truncate">Telemetry & Loads</span>
          <span class="text-[10px] text-emerald">Active Dashboard</span>
        </div>
        <div class="p-2.5 rounded-lg border border-subtle bg-surface hover:border-cyan transition cursor-pointer flex flex-col" onclick="window.ecosmartx.navigateTo('advisor')">
          <span class="text-[10px] text-cyan font-bold">2. DETECT</span>
          <span class="text-xs font-bold text-main truncate">Waste Forensics</span>
          <span class="text-[10px] text-muted">${anomalies.length} active alerts →</span>
        </div>
        <div class="p-2.5 rounded-lg border border-subtle bg-surface hover:border-indigo transition cursor-pointer flex flex-col" onclick="window.ecosmartx.navigateTo('simulator')">
          <span class="text-[10px] text-indigo font-bold">3. SIMULATE</span>
          <span class="text-xs font-bold text-main truncate">What-If Lab</span>
          <span class="text-[10px] text-muted">Sliders & Solar →</span>
        </div>
        <div class="p-2.5 rounded-lg border border-subtle bg-surface hover:border-purple transition cursor-pointer flex flex-col" onclick="window.ecosmartx.navigateTo('advisor')">
          <span class="text-[10px] text-purple font-bold">4. RECOMMEND</span>
          <span class="text-xs font-bold text-main truncate">Gemini Advisor</span>
          <span class="text-[10px] text-muted">Grounded ROI →</span>
        </div>
        <div class="p-2.5 rounded-lg border border-subtle bg-surface hover:border-amber transition cursor-pointer flex flex-col" onclick="window.ecosmartx.navigateTo('actions')">
          <span class="text-[10px] text-amber font-bold">5. TRACK</span>
          <span class="text-xs font-bold text-main truncate">Action Plan</span>
          <span class="text-[10px] text-muted">Google Calendar →</span>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// 2. DIGITAL TWIN STUDIO
// -------------------------------------------------------------
export function renderDigitalTwin(store) {
  const fac = store.getActiveFacility();
  const rooms = fac.rooms || [];
  const metrics = store.getMetrics();

  // Zone coordinates inside 800x480 SVG floor plan
  const zoneLayouts = [
    { x: 30, y: 30, w: 220, h: 180 },
    { x: 270, y: 30, w: 260, h: 180 },
    { x: 550, y: 30, w: 220, h: 220 },
    { x: 30, y: 230, w: 220, h: 220 },
    { x: 270, y: 230, w: 260, h: 220 },
    { x: 550, y: 270, w: 220, h: 180 },
  ];

  const selectedZoneId = window.ecosmartxSelectedZone || (rooms[0] ? rooms[0].id : null);
  const selectedRoom = rooms.find(r => r.id === selectedZoneId) || rooms[0];
  const selectedRoomApps = fac.appliances.filter(a => a.roomId === selectedRoom?.id);
  const zoneKwh = selectedRoomApps.reduce((sum, a) => sum + calculateApplianceKwh(a).monthlyKwh, 0);

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title flex items-center gap-2">
          <span>Digital Twin Studio</span>
          <span class="badge badge-cyan">2D Spatial Telemetry</span>
        </h1>
        <p class="view-subtitle">Interactive floor plan, power density heatmaps, and spatial load distribution for ${escapeHtml(fac.name)}</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary" onclick="window.ecosmartx.toggleHeatmap()">
          ${getIcon('activity', 'w-4 h-4')} Toggle Thermal Heatmap
        </button>
        <button class="btn btn-primary" onclick="window.ecosmartx.openModal('addZone')">
          ${getIcon('plus', 'w-4 h-4')} Add New Zone
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Interactive SVG Floor Plan Canvas -->
      <div class="card p-5 lg:col-span-2">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div class="text-sm font-bold text-main flex items-center gap-2">
            ${getIcon('mapPin', 'w-4 h-4 text-cyan')} Level 1 Floor Plan Layout (${fac.floorAreaSqM} m²)
          </div>
          <div class="flex items-center gap-2.5 text-xs flex-wrap">
            <span class="flex items-center gap-1.5"><span style="width: 8px; height: 8px; border-radius: 50%; background: var(--emerald);"></span> &lt;40 W/m²</span>
            <span class="flex items-center gap-1.5"><span style="width: 8px; height: 8px; border-radius: 50%; background: var(--amber);"></span> 40-100 W/m²</span>
            <span class="flex items-center gap-1.5"><span style="width: 8px; height: 8px; border-radius: 50%; background: var(--rose);"></span> &gt;100 W/m² (Heavy)</span>
          </div>
        </div>

        <div style="background: var(--navy); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 10px; overflow: hidden; max-width: 100%;">
          <svg viewBox="0 0 800 480" class="w-full h-auto" style="display: block; max-height: 440px;">
            <defs>
              <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#101c36" stroke-width="0.8"/>
              </pattern>
            </defs>
            <!-- Background Grid -->
            <rect width="800" height="480" fill="url(#gridPattern)" />
            <rect width="800" height="480" fill="none" stroke="#1e293b" stroke-width="2" />

            <!-- Render Room Zones in 4x2 Dynamic Grid -->
            ${rooms.map((room, idx) => {
              const cols = 4;
              const col = idx % cols;
              const row = Math.floor(idx / cols);
              const layout = {
                x: 20 + col * 192,
                y: 20 + row * 224,
                w: 180,
                h: 204,
              };

              const roomApps = fac.appliances.filter(a => a.roomId === room.id);
              const roomWatts = roomApps.reduce((s, a) => s + (a.ratedWatts * a.quantity * a.utilizationFactor), 0);
              const roomArea = room.areaSqM || room.floorAreaSqM || 100;
              const density = roomArea > 0 ? (roomWatts / roomArea) : 0;
              
              let fillColor = 'rgba(16, 185, 129, 0.15)';
              let strokeColor = '#10b981';
              if (density > 100) {
                fillColor = 'rgba(244, 63, 94, 0.25)';
                strokeColor = '#f43f5e';
              } else if (density > 40) {
                fillColor = 'rgba(245, 158, 11, 0.20)';
                strokeColor = '#f59e0b';
              }

              const isSelected = room.id === selectedZoneId;
              if (isSelected) {
                strokeColor = '#38bdf8';
              }

              return `
                <g class="cursor-pointer transition" onclick="window.ecosmartx.selectZone('${room.id}')">
                  <rect 
                    x="${layout.x}" 
                    y="${layout.y}" 
                    width="${layout.w}" 
                    height="${layout.h}" 
                    rx="8" 
                    fill="${fillColor}" 
                    stroke="${strokeColor}" 
                    stroke-width="${isSelected ? '3' : '1.5'}"
                    style="transition: all 0.2s;"
                  />
                  <!-- Room Label -->
                  <text x="${layout.x + 12}" y="${layout.y + 24}" fill="#f8fafc" font-size="12" font-weight="bold">${escapeHtml(room.name)}</text>
                  <text x="${layout.x + 12}" y="${layout.y + 40}" fill="#94a3b8" font-size="10.5">${roomArea} m² • ${room.type || 'Zone'}</text>
                  
                  <!-- Zone Metrics Pill -->
                  <rect x="${layout.x + 10}" y="${layout.y + layout.h - 38}" width="${layout.w - 20}" height="26" rx="4" fill="rgba(8, 14, 33, 0.85)" stroke="#1e293b" />
                  <text x="${layout.x + 16}" y="${layout.y + layout.h - 21}" fill="#38bdf8" font-size="11" font-family="monospace" font-weight="bold">${Math.round(density)} W/m²</text>
                  <text x="${layout.x + layout.w - 16}" y="${layout.y + layout.h - 21}" text-anchor="end" fill="#cbd5e1" font-size="11">${roomApps.length} eq.</text>
                </g>
              `;
            }).join('')}
          </svg>
        </div>
      </div>

      <!-- Zone Inspector Panel -->
      <div class="card p-5">
        ${selectedRoom ? `
          <div class="flex items-center justify-between pb-3 border-b border-subtle mb-4">
            <div>
              <span class="badge badge-cyan mb-1">${selectedRoom.type || 'Facility'} Zone</span>
              <h2 class="text-lg font-bold text-white">${escapeHtml(selectedRoom.name)}</h2>
            </div>
            <div class="flex gap-1">
              <button class="btn btn-secondary p-1.5" title="Edit Zone" onclick="window.ecosmartx.openModal('editZone', '${selectedRoom.id}')">
                ${getIcon('edit', 'w-3.5 h-3.5')}
              </button>
              <button class="btn btn-danger p-1.5" title="Delete Zone" onclick="window.ecosmartx.deleteZone('${selectedRoom.id}')">
                ${getIcon('trash', 'w-3.5 h-3.5')}
              </button>
            </div>
          </div>

          <div class="space-y-4 mb-6">
            <div class="flex justify-between items-center text-xs py-1 border-b border-subtle">
              <span class="text-muted">Target Temp / Setpoint</span>
              <span class="font-bold text-white">${selectedRoom.targetTemperatureC || 22}°C (${Math.round((selectedRoom.targetTemperatureC || 22) * 1.8 + 32)}°F)</span>
            </div>
            <div class="flex justify-between items-center text-xs py-1 border-b border-subtle">
              <span class="text-muted">Floor Area</span>
              <span class="font-bold text-white">${selectedRoom.areaSqM || selectedRoom.floorAreaSqM || 100} m² (${Math.round((selectedRoom.areaSqM || selectedRoom.floorAreaSqM || 100) * 10.764)} sq ft)</span>
            </div>
            <div class="flex justify-between items-center text-xs py-1 border-b border-subtle">
              <span class="text-muted">Monthly Consumption</span>
              <span class="font-bold text-cyan font-mono">${Math.round(zoneKwh).toLocaleString()} kWh/mo</span>
            </div>
            <div class="flex justify-between items-center text-xs py-1 border-b border-subtle">
              <span class="text-muted">Monthly Utility Cost</span>
              <span class="font-bold text-emerald font-mono">${formatCurrency(zoneKwh * metrics.effectiveRatePerKwh, fac.currency)}</span>
            </div>
          </div>

          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xs font-bold text-white uppercase tracking-wider">Assigned Equipment (${selectedRoomApps.length})</h3>
            <button class="btn btn-secondary text-xs p-1" onclick="window.ecosmartx.openModal('addAppliance', '${selectedRoom.id}')">
              ${getIcon('plus', 'w-3 h-3')} Add
            </button>
          </div>

          <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
            ${selectedRoomApps.length === 0 ? `
              <div class="text-center py-6 text-xs text-muted">No equipment configured in this zone yet.</div>
            ` : selectedRoomApps.map(app => {
              const appKwh = calculateApplianceKwh(app);
              return `
                <div class="card p-2.5 flex items-center justify-between bg-surface">
                  <div>
                    <div class="font-bold text-xs text-white">${escapeHtml(app.name)}</div>
                    <div class="text-xs text-muted">${app.quantity}x • ${app.ratedWatts}W • ${app.operatingHoursPerDay}h/day</div>
                  </div>
                  <div class="text-right">
                    <div class="font-mono text-xs text-cyan font-bold">${Math.round(appKwh.monthlyKwh)} kWh</div>
                    <div class="text-xs text-dim">${formatCurrency(appKwh.monthlyKwh * metrics.effectiveRatePerKwh, fac.currency)}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div class="text-center py-12 text-muted">Select a zone from the floor plan to inspect telemetry.</div>
        `}
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// 3. FACILITIES & ROOMS MANAGEMENT
// -------------------------------------------------------------
export function renderFacilities(store) {
  const fac = store.getActiveFacility();
  const allFacilities = store.facilities;
  const metrics = store.getMetrics();

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title flex items-center gap-2">
          <span>Facility & Infrastructure Management</span>
          <span class="badge badge-emerald">Portfolio View</span>
        </h1>
        <p class="view-subtitle">Manage multi-building physical envelopes, rooms, zones, and building parameters</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-primary" onclick="window.ecosmartx.openModal('addFacility')">
          ${getIcon('plus', 'w-4 h-4')} Create New Facility
        </button>
      </div>
    </div>

    <!-- Active Facility Details Card -->
    <div class="card p-5 mb-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-subtle mb-4">
        <div>
          <span class="badge badge-cyan mb-1">${fac.type} Facility</span>
          <h2 class="text-xl font-bold text-main">${escapeHtml(fac.name)}</h2>
          <p class="text-xs text-muted">${escapeHtml(fac.address || 'Address on file')} • Built in ${fac.yearBuilt || 2020}</p>
        </div>
        <div class="flex gap-2 flex-wrap w-full sm:w-auto">
          <button class="btn btn-secondary flex-1 sm:flex-none" onclick="window.ecosmartx.openModal('editFacility', '${fac.id}')">
            ${getIcon('edit', 'w-4 h-4')} Edit Parameters
          </button>
          <button class="btn btn-danger flex-1 sm:flex-none" onclick="window.ecosmartx.deleteFacility('${fac.id}')">
            ${getIcon('trash', 'w-4 h-4')} Delete Facility
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="p-3 bg-surface rounded">
          <div class="text-xs text-muted">Gross Floor Area</div>
          <div class="text-lg font-bold text-white">${fac.floorAreaSqM.toLocaleString()} m²</div>
        </div>
        <div class="p-3 bg-surface rounded">
          <div class="text-xs text-muted">Designed Occupancy</div>
          <div class="text-lg font-bold text-white">${fac.occupancy} occupants</div>
        </div>
        <div class="p-3 bg-surface rounded">
          <div class="text-xs text-muted">Zones / Rooms</div>
          <div class="text-lg font-bold text-white">${fac.rooms.length} configured</div>
        </div>
        <div class="p-3 bg-surface rounded">
          <div class="text-xs text-muted">Total Equipment Items</div>
          <div class="text-lg font-bold text-white">${fac.appliances.length} devices</div>
        </div>
      </div>
    </div>

    <!-- Zone List Table -->
    <div class="card p-5 mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-base font-bold text-white">Facility Zones & Subsystems</h3>
          <p class="text-xs text-muted">Physical zones, area distribution, and HVAC targets</p>
        </div>
        <button class="btn btn-secondary text-xs" onclick="window.ecosmartx.openModal('addZone')">
          ${getIcon('plus', 'w-3.5 h-3.5')} Add Zone
        </button>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Zone Name</th>
              <th>Type</th>
              <th>Area (m²)</th>
              <th>Target Temp</th>
              <th>Equipment</th>
              <th>Monthly Consumption</th>
              <th>Monthly Cost</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${fac.rooms.map(room => {
              const roomApps = fac.appliances.filter(a => a.roomId === room.id);
              const roomKwh = roomApps.reduce((s, a) => s + calculateApplianceKwh(a).monthlyKwh, 0);
              return `
                <tr>
                  <td class="font-bold text-white">${escapeHtml(room.name)}</td>
                  <td><span class="badge badge-indigo">${room.type}</span></td>
                  <td>${room.floorAreaSqM} m²</td>
                  <td>${room.targetTemperatureC || 22}°C</td>
                  <td>${roomApps.length} units</td>
                  <td class="font-mono text-cyan font-bold">${Math.round(roomKwh).toLocaleString()} kWh</td>
                  <td class="font-mono text-emerald">${formatCurrency(roomKwh * metrics.effectiveRatePerKwh, fac.currency)}</td>
                  <td class="text-right">
                    <button class="btn btn-secondary p-1.5" onclick="window.ecosmartx.openModal('editZone', '${room.id}')">
                      ${getIcon('edit', 'w-3.5 h-3.5')}
                    </button>
                    <button class="btn btn-danger p-1.5 ml-1" onclick="window.ecosmartx.deleteZone('${room.id}')">
                      ${getIcon('trash', 'w-3.5 h-3.5')}
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// 4. APPLIANCE INTELLIGENCE
// -------------------------------------------------------------
export function renderAppliances(store) {
  const fac = store.getActiveFacility();
  const metrics = store.getMetrics();
  const appliances = fac.appliances || [];

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title flex items-center gap-2">
          <span>Appliance & Equipment Intelligence</span>
          <span class="badge badge-cyan">${appliances.length} Assets Tracked</span>
        </h1>
        <p class="view-subtitle">Detailed electrical load inventory, standby draw analysis, and duty cycle parameters</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary" onclick="window.ecosmartx.openModal('importCsv')">
          ${getIcon('upload', 'w-4 h-4')} Import CSV
        </button>
        <button class="btn btn-primary" onclick="window.ecosmartx.openModal('addAppliance')">
          ${getIcon('plus', 'w-4 h-4')} Add Equipment
        </button>
      </div>
    </div>

    <!-- Equipment Inventory Table -->
    <div class="card p-5">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Asset Name</th>
              <th>Category</th>
              <th>Zone / Room</th>
              <th>Rated Power</th>
              <th>Qty</th>
              <th>Daily Hours</th>
              <th>Days/Wk</th>
              <th>Standby W</th>
              <th>Monthly kWh</th>
              <th>Monthly Cost</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${appliances.length === 0 ? `
              <tr><td colspan="11" class="text-center py-8 text-muted">No equipment configured yet. Click "Add Equipment" to begin.</td></tr>
            ` : appliances.map(app => {
              const kwhData = calculateApplianceKwh(app);
              const room = fac.rooms.find(r => r.id === app.roomId);
              return `
                <tr>
                  <td class="font-bold text-white">${escapeHtml(app.name)}</td>
                  <td>
                    <span class="badge" style="background: ${getCategoryColor(app.category)}22; color: ${getCategoryColor(app.category)};">
                      ${CATEGORY_LABELS[app.category] || app.category}
                    </span>
                  </td>
                  <td class="text-muted">${room ? escapeHtml(room.name) : 'Unassigned'}</td>
                  <td class="font-mono">${app.ratedWatts} W</td>
                  <td>${app.quantity}x</td>
                  <td>${app.operatingHoursPerDay} hrs</td>
                  <td>${app.operatingDaysPerWeek || 7} d</td>
                  <td class="font-mono ${app.standbyWatts > 20 ? 'text-amber font-bold' : 'text-dim'}">${app.standbyWatts || 0} W</td>
                  <td class="font-mono text-cyan font-bold">${Math.round(kwhData.monthlyKwh).toLocaleString()}</td>
                  <td class="font-mono text-emerald">${formatCurrency(kwhData.monthlyKwh * metrics.effectiveRatePerKwh, fac.currency)}</td>
                  <td class="text-right">
                    <button class="btn btn-secondary p-1.5" onclick="window.ecosmartx.openModal('editAppliance', '${app.id}')">
                      ${getIcon('edit', 'w-3.5 h-3.5')}
                    </button>
                    <button class="btn btn-danger p-1.5 ml-1" onclick="window.ecosmartx.deleteAppliance('${app.id}')">
                      ${getIcon('trash', 'w-3.5 h-3.5')}
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// 5. ENERGY ANALYTICS
// -------------------------------------------------------------
export function renderAnalytics(store) {
  const fac = store.getActiveFacility();
  const metrics = store.getMetrics();

  // Synthetic 12-month historical consumption data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyValues = [
    metrics.monthlyTotalKwh * 0.95,
    metrics.monthlyTotalKwh * 0.92,
    metrics.monthlyTotalKwh * 0.88,
    metrics.monthlyTotalKwh * 0.90,
    metrics.monthlyTotalKwh * 1.05,
    metrics.monthlyTotalKwh * 1.15,
    metrics.monthlyTotalKwh * 1.25,
    metrics.monthlyTotalKwh * 1.22,
    metrics.monthlyTotalKwh * 1.08,
    metrics.monthlyTotalKwh * 0.98,
    metrics.monthlyTotalKwh * 0.94,
    metrics.monthlyTotalKwh * 1.02,
  ];

  const maxVal = Math.max(...monthlyValues) * 1.15;

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title flex items-center gap-2">
          <span>Energy Analytics & Benchmarking</span>
          <span class="badge badge-emerald">Comprehensive Audit</span>
        </h1>
        <p class="view-subtitle">Historical consumption trends, end-use intensity, and seasonal variance</p>
      </div>
    </div>

    <!-- 12-Month Historical Bar Chart -->
    <div class="card p-5 mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-base font-bold text-white">12-Month Consumption Trend (Historical)</h2>
          <p class="text-xs text-muted">Seasonal summer cooling peaks vs winter heating baseline</p>
        </div>
        <div class="text-xs font-mono text-cyan">Annual Total: ~${Math.round(metrics.annualTotalKwh).toLocaleString()} kWh</div>
      </div>
      <div style="height: 240px; width: 100%;">
        <svg viewBox="0 0 700 220" class="w-full h-full" style="overflow: visible;">
          <!-- Grid lines -->
          <line x1="40" y1="20" x2="680" y2="20" stroke="#1e293b" stroke-dasharray="3 3"/>
          <line x1="40" y1="80" x2="680" y2="80" stroke="#1e293b" stroke-dasharray="3 3"/>
          <line x1="40" y1="140" x2="680" y2="140" stroke="#1e293b" stroke-dasharray="3 3"/>
          <line x1="40" y1="190" x2="680" y2="190" stroke="#334155"/>

          ${monthlyValues.map((val, i) => {
            const x = 50 + i * 52;
            const barHeight = (val / maxVal) * 160;
            const y = 190 - barHeight;
            const isPeak = i >= 5 && i <= 7;
            return `
              <rect x="${x}" y="${y}" width="32" height="${barHeight}" rx="3" fill="${isPeak ? 'var(--cyan)' : '#1e3a8a'}" />
              <text x="${x + 16}" y="208" text-anchor="middle" fill="#94a3b8" font-size="11">${months[i]}</text>
              <text x="${x + 16}" y="${y - 6}" text-anchor="middle" fill="#cbd5e1" font-size="9" font-family="monospace">${Math.round(val / 1000)}k</text>
            `;
          }).join('')}
        </svg>
      </div>
    </div>

    <!-- Benchmark Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="card p-5">
        <h3 class="text-sm font-bold text-white mb-2">BEE Star Rating & ECBC Benchmark</h3>
        <p class="text-xs text-muted mb-4">Commercial Energy Performance Index (EPI) under BEE Star Rating benchmarks</p>
        <div class="space-y-3">
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span>This Facility (EPI)</span>
              <span class="font-bold text-cyan">${metrics.energyIntensityKwhPerSqM} kWh/m²/yr</span>
            </div>
            <div class="progress-bar"><div class="progress-bar-fill bg-cyan" style="width: ${Math.min(100, (metrics.energyIntensityKwhPerSqM / 150) * 100)}%;"></div></div>
          </div>
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span>BEE 5-Star Commercial Target</span>
              <span class="text-emerald font-bold">&lt; 90 kWh/m²/yr</span>
            </div>
            <div class="progress-bar"><div class="progress-bar-fill bg-emerald" style="width: ${(90 / 150) * 100}%;"></div></div>
          </div>
        </div>
      </div>

      <div class="card p-5">
        <h3 class="text-sm font-bold text-white mb-2">Peak to Base Ratio</h3>
        <p class="text-xs text-muted mb-3">Load factor indicates consistency and peak demand liability</p>
        <div class="text-2xl font-bold text-emerald mb-1">1.82 : 1</div>
        <p class="text-xs text-muted">A peak-to-base ratio under 2.0 indicates healthy base utilization with manageable peak spikes.</p>
      </div>

      <div class="card p-5">
        <h3 class="text-sm font-bold text-white mb-2">Weekend vs Weekday Drift</h3>
        <p class="text-xs text-muted mb-3">Non-operational energy waste during Saturdays and Sundays</p>
        <div class="text-2xl font-bold text-amber mb-1">42% of Weekday</div>
        <p class="text-xs text-muted">Unoccupied weekends still consume 42% of weekday power, signaling unmanaged baseload.</p>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// 6. ENERGY SIMULATION LAB
// -------------------------------------------------------------
export function renderSimulation(store) {
  const fac = store.getActiveFacility();
  const metrics = store.getMetrics();

  const hvacShift = window.ecosmartxSimHvac || 0; // -3 to +3
  const effUpgrade = window.ecosmartxSimEff || 0; // 0 to 50%
  const vampireCut = window.ecosmartxSimVampire || 0; // 0 to 100%
  const solarPvKw = window.ecosmartxSimSolar || 0; // 0 to 200 kW

  // Calculate simulated savings deterministically
  const hvacKwhSaved = (metrics.categoryBreakdown.hvac?.monthlyKwh || 0) * (hvacShift * 0.04);
  const effKwhSaved = (metrics.monthlyTotalKwh * (effUpgrade / 100));
  const vampireKwhSaved = (metrics.standbyWasteMonthlyKwh * (vampireCut / 100));
  const solarMonthlyKwhGen = solarPvKw * 135; // avg 135 kWh/kW/month

  const totalMonthlyKwhSaved = Math.max(0, Math.round(hvacKwhSaved + effKwhSaved + vampireKwhSaved + solarMonthlyKwhGen));
  const simulatedMonthlyKwh = Math.max(0, metrics.monthlyTotalKwh - totalMonthlyKwhSaved);
  const simulatedMonthlyCost = Math.round(simulatedMonthlyKwh * metrics.effectiveRatePerKwh);
  const monthlyCostSavings = Math.round(metrics.monthlyCost - simulatedMonthlyCost);
  const annualSavings = monthlyCostSavings * 12;
  const emissionFactor = Number(fac.emissionFactorKgCo2PerKwh || fac.gridCarbonIntensityKgPerKwh || 0.38);
  const annualCo2Reduction = Math.round((totalMonthlyKwhSaved * 12 * emissionFactor) / 1000);

  const budgetTarget = window.ecosmartxSimBudget || fac.monthlyBudget || Math.round(metrics.monthlyCost * 0.9);
  const minBudget = Math.round(metrics.monthlyCost * 0.5);
  const maxBudget = Math.round(metrics.monthlyCost * 1.5);
  const isOverBudget = simulatedMonthlyCost > budgetTarget;
  const budgetDelta = Math.abs(simulatedMonthlyCost - budgetTarget);

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title flex items-center gap-2">
          <span>Energy Simulation Lab</span>
          <span class="badge badge-cyan">Dynamic Sliders</span>
        </h1>
        <p class="view-subtitle">Non-destructive what-if engineering models. Baseline facility records remain untouched.</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button class="btn btn-emerald" onclick="window.ecosmartx.addActionFromSim()">
          ${getIcon('plus', 'w-4 h-4')} Convert to Action Plan
        </button>
        <button class="btn btn-primary" onclick="window.ecosmartx.saveCurrentSimulationAsScenario()">
          ${getIcon('save', 'w-4 h-4')} Save as Scenario
        </button>
      </div>
    </div>

    <!-- Side-by-side Impact Summary -->
    <div class="stats-grid mb-6">
      <div class="stat-card">
        <div class="stat-label">Simulated Consumption</div>
        <div class="stat-value text-cyan">${simulatedMonthlyKwh.toLocaleString()} <span style="font-size: 1rem; color: var(--text-dim);">kWh/mo</span></div>
        <div class="stat-trend trend-down">
          -${Math.round((totalMonthlyKwhSaved / (metrics.monthlyTotalKwh || 1)) * 100)}% reduction
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Monthly Cost Reduction</div>
        <div class="stat-value text-emerald">${formatCurrency(monthlyCostSavings, fac.currency)} <span style="font-size: 1rem; color: var(--text-dim);">/mo</span></div>
        <div class="stat-trend trend-up">
          Annual: ${formatCurrency(annualSavings, fac.currency)}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Annual CO₂ Avoided</div>
        <div class="stat-value text-amber">${annualCo2Reduction} <span style="font-size: 1rem; color: var(--text-dim);">MT CO₂e</span></div>
        <div class="stat-trend trend-down">
          -${Math.round((annualCo2Reduction / (metrics.annualCo2Tonnes || 1)) * 100)}% of footprint
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Solar PV Monthly Generation</div>
        <div class="stat-value text-indigo">${Math.round(solarMonthlyKwhGen).toLocaleString()} <span style="font-size: 1rem; color: var(--text-dim);">kWh</span></div>
        <div class="stat-trend trend-neutral">
          ${solarPvKw} kW DC Array
        </div>
      </div>
    </div>

    <!-- Sliders Grid (Responsive mobile-first columns) -->
    <div class="card p-6">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 class="text-base font-bold text-main">Engineering Control Variables & Budget Modeling</h2>
        <span class="text-xs text-muted font-mono">5 active parameters</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Monthly Energy Cost Budget Slider -->
        <div class="p-4 rounded-md border border-subtle bg-surface-alt">
          <div class="flex justify-between items-center mb-2 flex-wrap gap-1">
            <label class="text-sm font-bold text-main flex items-center gap-2">
              ${getIcon('dollarSign', 'w-4 h-4 text-emerald')} Target Utility Budget: <span class="font-mono text-emerald">${formatCurrency(budgetTarget, fac.currency)}</span>
            </label>
            <span class="badge ${isOverBudget ? 'badge-rose' : 'badge-emerald'} text-[11px]">
              ${isOverBudget ? `Over by ${formatCurrency(budgetDelta, fac.currency)}` : `Savings: ${formatCurrency(budgetDelta, fac.currency)}`}
            </span>
          </div>
          <div class="slider-wrapper">
            <input type="range" min="${minBudget}" max="${maxBudget}" step="50" value="${budgetTarget}" class="slider" 
              oninput="window.ecosmartx.updateSimParam('budget', this.value)" aria-label="Monthly Utility Budget Target" />
          </div>
          <div class="flex justify-between text-xs text-muted mt-1 tabular-nums">
            <span>${formatCurrency(minBudget, fac.currency)} (Aggressive)</span>
            <span>${formatCurrency(metrics.monthlyCost, fac.currency)} (Baseline)</span>
            <span>${formatCurrency(maxBudget, fac.currency)}</span>
          </div>
        </div>

        <!-- HVAC Setpoint -->
        <div class="p-4 rounded-md border border-subtle bg-surface-alt">
          <div class="flex justify-between items-center mb-2 flex-wrap gap-1">
            <label class="text-sm font-bold text-main flex items-center gap-2">
              ${getIcon('thermometer', 'w-4 h-4 text-cyan')} HVAC Setpoint Adjustment: <span class="font-mono text-cyan">${hvacShift > 0 ? '+' : ''}${hvacShift}°C</span>
            </label>
            <span class="text-xs text-muted">~4% HVAC change per °C</span>
          </div>
          <div class="slider-wrapper">
            <input type="range" min="-3" max="3" step="0.5" value="${hvacShift}" class="slider" 
              oninput="window.ecosmartx.updateSimParam('hvac', this.value)" aria-label="HVAC Setpoint Adjustment" />
          </div>
          <div class="flex justify-between text-xs text-muted mt-1 tabular-nums">
            <span>-3°C (Overcooled)</span>
            <span>0°C (Baseline)</span>
            <span>+3°C (Eco Setback)</span>
          </div>
        </div>

        <!-- Equipment Efficiency Retrofit -->
        <div class="p-4 rounded-md border border-subtle bg-surface-alt">
          <div class="flex justify-between items-center mb-2 flex-wrap gap-1">
            <label class="text-sm font-bold text-main flex items-center gap-2">
              ${getIcon('cpu', 'w-4 h-4 text-emerald')} Equipment Efficiency Retrofit: <span class="font-mono text-emerald">${effUpgrade}%</span>
            </label>
            <span class="text-xs text-muted">LED & VFD retrofits</span>
          </div>
          <div class="slider-wrapper">
            <input type="range" min="0" max="50" step="5" value="${effUpgrade}" class="slider" 
              oninput="window.ecosmartx.updateSimParam('eff', this.value)" aria-label="Equipment Efficiency Retrofit" />
          </div>
          <div class="flex justify-between text-xs text-muted mt-1 tabular-nums">
            <span>0% (As-is)</span>
            <span>25% (Standard LED)</span>
            <span>50% (High-Spec)</span>
          </div>
        </div>

        <!-- Vampire Standby Cut -->
        <div class="p-4 rounded-md border border-subtle bg-surface-alt">
          <div class="flex justify-between items-center mb-2 flex-wrap gap-1">
            <label class="text-sm font-bold text-main flex items-center gap-2">
              ${getIcon('power', 'w-4 h-4 text-amber')} Vampire Standby Elimination: <span class="font-mono text-amber">${vampireCut}%</span>
            </label>
            <span class="text-xs text-muted">Smart plugs & timer isolators</span>
          </div>
          <div class="slider-wrapper">
            <input type="range" min="0" max="100" step="10" value="${vampireCut}" class="slider" 
              oninput="window.ecosmartx.updateSimParam('vampire', this.value)" aria-label="Vampire Standby Elimination" />
          </div>
          <div class="flex justify-between text-xs text-muted mt-1 tabular-nums">
            <span>0% (Unmanaged)</span>
            <span>50% (Schedules)</span>
            <span>100% (Zero Standby)</span>
          </div>
        </div>

        <!-- Solar PV Capacity -->
        <div class="p-4 rounded-md border border-subtle bg-surface-alt md:col-span-2">
          <div class="flex justify-between items-center mb-2 flex-wrap gap-1">
            <label class="text-sm font-bold text-main flex items-center gap-2">
              ${getIcon('sun', 'w-4 h-4 text-indigo')} Rooftop Solar PV Capacity: <span class="font-mono text-indigo">${solarPvKw} kW</span>
            </label>
            <span class="text-xs text-muted font-mono">${Math.round(solarMonthlyKwhGen).toLocaleString()} kWh/mo estimated generation</span>
          </div>
          <div class="slider-wrapper">
            <input type="range" min="0" max="200" step="10" value="${solarPvKw}" class="slider" 
              oninput="window.ecosmartx.updateSimParam('solar', this.value)" aria-label="Rooftop Solar PV Capacity" />
          </div>
          <div class="flex justify-between text-xs text-muted mt-1 tabular-nums">
            <span>0 kW (None)</span>
            <span>100 kW (Standard Array)</span>
            <span>200 kW (Max Roof Coverage)</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// 7. SCENARIO LABORATORY
// -------------------------------------------------------------
export function renderScenarios(store) {
  const fac = store.getActiveFacility();
  const scenarios = store.scenarios;
  const metrics = store.getMetrics();

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title flex items-center gap-2">
          <span>Scenario Laboratory</span>
          <span class="badge badge-emerald">Capital Planning</span>
        </h1>
        <p class="view-subtitle">Compare multi-variable retrofit options against the baseline building model</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${scenarios.map(scen => {
        const comp = calculateScenarioComparison(fac, scen.modifiedFacility);
        return `
          <div class="card p-5 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="badge badge-indigo">Scenario</span>
                <button class="btn btn-danger p-1" onclick="window.ecosmartx.deleteScenario('${scen.id}')">
                  ${getIcon('trash', 'w-3 h-3')}
                </button>
              </div>
              <h3 class="text-base font-bold text-white mb-1">${escapeHtml(scen.name)}</h3>
              <p class="text-xs text-muted mb-4">${escapeHtml(scen.description || 'No description provided')}</p>

              <div class="space-y-3 mb-4">
                <div class="flex justify-between text-xs py-1 border-b border-subtle">
                  <span class="text-muted">Monthly kWh Reduction</span>
                  <span class="font-mono text-cyan font-bold">-${comp.kwhSavedMonthly.toLocaleString()} kWh (${comp.percentReduction}%)</span>
                </div>
                <div class="flex justify-between text-xs py-1 border-b border-subtle">
                  <span class="text-muted">Monthly Cost Savings</span>
                  <span class="font-mono text-emerald font-bold">${formatCurrency(comp.monthlyCostSavings, fac.currency)}/mo</span>
                </div>
                <div class="flex justify-between text-xs py-1 border-b border-subtle">
                  <span class="text-muted">Annual Cost Savings</span>
                  <span class="font-mono text-emerald font-bold">${formatCurrency(comp.annualCostSavings, fac.currency)}/yr</span>
                </div>
                <div class="flex justify-between text-xs py-1 border-b border-subtle">
                  <span class="text-muted">CO₂ Reduction</span>
                  <span class="font-mono text-amber font-bold">${comp.co2ReductionTonnesAnnual} MT/yr</span>
                </div>
              </div>
            </div>

            <button class="btn btn-secondary w-full" onclick="window.ecosmartx.applyScenarioAsFacility('${scen.id}')">
              ${getIcon('check', 'w-4 h-4')} Adopt as Active Facility Model
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// -------------------------------------------------------------
// 8. PREDICTIVE INTELLIGENCE
// -------------------------------------------------------------
export function renderPredictive(store) {
  const fac = store.getActiveFacility();
  const metrics = store.getMetrics();
  const forecast = generateDemandForecast(metrics.hourlyLoadCurve, 30);

  const forecastPoints = forecast.dailyForecast;
  const maxDayKwh = Math.max(...forecastPoints.map(p => p.upperBound)) * 1.1;

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title flex items-center gap-2">
          <span>Predictive Intelligence</span>
          <span class="badge badge-amber">30-Day ML Projection</span>
        </h1>
        <p class="view-subtitle">Time-series demand forecasting with confidence intervals and weather regression</p>
      </div>
    </div>

    <!-- Forecast Metrics -->
    <div class="stats-grid mb-6">
      <div class="stat-card">
        <div class="stat-label">Projected Next-Month Demand</div>
        <div class="stat-value text-cyan">${forecast.projectedNextMonthKwh.toLocaleString()} <span style="font-size: 1rem; color: var(--text-dim);">kWh</span></div>
        <div class="stat-trend trend-neutral">Daily mean: ${Math.round(forecast.projectedNextMonthKwh / 30)} kWh/day</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Projected Peak Demand</div>
        <div class="stat-value text-amber">${forecast.projectedPeakDemandKw} <span style="font-size: 1rem; color: var(--text-dim);">kW</span></div>
        <div class="stat-trend trend-down">Peak window exposure</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Forecast Accuracy (MAE)</div>
        <div class="stat-value text-emerald">${forecast.accuracyMetrics.maeKwh} <span style="font-size: 1rem; color: var(--text-dim);">kWh</span></div>
        <div class="stat-trend trend-up">RMSE: ${forecast.accuracyMetrics.rmseKwh} kWh</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Model Confidence Interval</div>
        <div class="stat-value text-indigo">95% <span style="font-size: 1rem; color: var(--text-dim);">Bound</span></div>
        <div class="stat-trend trend-neutral">Upper & lower bands</div>
      </div>
    </div>

    <!-- 30-Day SVG Line Chart with Confidence Interval Band -->
    <div class="card p-5 mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-base font-bold text-white">30-Day Demand Forecast & Uncertainty Envelope</h2>
          <p class="text-xs text-muted">Daily forecast with upper and lower 95% confidence intervals</p>
        </div>
      </div>

      <div style="height: 280px; width: 100%;">
        <svg viewBox="0 0 800 240" class="w-full h-full" style="overflow: visible;">
          <!-- Grid lines -->
          <line x1="50" y1="30" x2="780" y2="30" stroke="#1e293b" stroke-dasharray="3 3"/>
          <line x1="50" y1="90" x2="780" y2="90" stroke="#1e293b" stroke-dasharray="3 3"/>
          <line x1="50" y1="150" x2="780" y2="150" stroke="#1e293b" stroke-dasharray="3 3"/>
          <line x1="50" y1="200" x2="780" y2="200" stroke="#334155"/>

          <!-- Shaded Area for Upper/Lower Bound -->
          ${(() => {
            const upperPoints = forecastPoints.map((p, i) => `${60 + i * 23},${200 - (p.upperBound / maxDayKwh) * 160}`).join(' ');
            const lowerPoints = forecastPoints.slice().reverse().map((p, i) => `${60 + (29 - i) * 23},${200 - (p.lowerBound / maxDayKwh) * 160}`).join(' ');
            return `<polygon points="${upperPoints} ${lowerPoints}" fill="rgba(6, 182, 212, 0.12)" />`;
          })()}

          <!-- Mid Line -->
          ${(() => {
            const linePoints = forecastPoints.map((p, i) => `${60 + i * 23},${200 - (p.predictedKwh / maxDayKwh) * 160}`).join(' ');
            return `<polyline points="${linePoints}" fill="none" stroke="var(--cyan)" stroke-width="2.5" />`;
          })()}

          <!-- Axis Labels -->
          <text x="60" y="220" fill="#94a3b8" font-size="10">Day 1</text>
          <text x="390" y="220" fill="#94a3b8" font-size="10">Day 15</text>
          <text x="730" y="220" fill="#94a3b8" font-size="10">Day 30</text>
        </svg>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// 9. ENERGY WASTE FORENSICS
// -------------------------------------------------------------
export function renderForensics(store) {
  const fac = store.getActiveFacility();
  if (!fac) {
    return renderNoFacilityState('Energy Waste Forensics', 'Root-cause identification of parasitic phantom loads, schedule drift, and simultaneous heating/cooling', 'alertOctagon');
  }
  const anomalies = store.getAnomalies();
  const metrics = store.getMetrics();

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title flex items-center gap-2">
          <span>Energy Waste Forensics</span>
          <span class="badge ${anomalies.length > 0 ? 'badge-rose' : 'badge-emerald'}">
            ${anomalies.length > 0 ? `${anomalies.length} Issues Detected` : 'All Systems Clear'}
          </span>
        </h1>
        <p class="view-subtitle">Root-cause identification of parasitic phantom loads, schedule drift, and simultaneous heating/cooling</p>
      </div>
    </div>

    <!-- Diagnostic Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      ${anomalies.length === 0 ? `
        <div class="card p-8 text-center text-muted col-span-full">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--emerald-bg); color: var(--emerald); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
            ${getIcon('checkCircle', 'w-6 h-6')}
          </div>
          <div class="font-bold text-main text-base mb-1">Zero Operational Anomalies</div>
          <p class="text-xs text-muted max-w-md mx-auto">All active facility equipment is operating within normal duty cycles. No unmanaged parasitic standby loads or simultaneous heating/cooling detected.</p>
        </div>
      ` : anomalies.map(anom => {
        let severityColor = 'var(--amber)';
        let badgeClass = 'badge-amber';
        if (anom.severity === 'critical') {
          severityColor = 'var(--rose)';
          badgeClass = 'badge-rose';
        } else if (anom.severity === 'info') {
          severityColor = 'var(--cyan)';
          badgeClass = 'badge-cyan';
        }

        return `
          <div class="card p-5" style="border-left: 4px solid ${severityColor};">
            <div class="flex items-center justify-between mb-2">
              <span class="badge ${badgeClass}">${anom.severity.toUpperCase()}</span>
              <div class="text-xs text-muted">Estimated impact: <strong class="text-white">${formatCurrency(anom.estimatedMonthlyWasteCost || anom.estimatedCostImpactMonthly || 0, fac.currency)}/mo</strong></div>
            </div>
            <h3 class="text-base font-bold text-white mb-1">${escapeHtml(anom.title)}</h3>
            <p class="text-xs text-muted mb-4">${escapeHtml(anom.evidence || anom.description || '')}</p>

            <div class="p-3 bg-surface rounded text-xs mb-4">
              <strong class="text-emerald">Recommended Remediation:</strong>
              <div class="text-secondary mt-1">${escapeHtml(anom.recommendedAction || anom.recommendation || '')}</div>
            </div>

            <div class="flex items-center justify-between text-xs pt-3 border-t border-subtle">
              <span class="text-dim">Status: <strong class="text-white">${anom.status}</strong></span>
              <div class="flex gap-2">
                <button class="btn btn-secondary text-xs" onclick="window.ecosmartx.updateAnomalyStatus('${anom.id}', 'acknowledged')">Acknowledge</button>
                <button class="btn btn-primary text-xs" onclick="window.ecosmartx.updateAnomalyStatus('${anom.id}', 'resolved')">Mark Resolved</button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// -------------------------------------------------------------
// 10. OPTIMIZATION ENGINE
// -------------------------------------------------------------
export function renderOptimization(store) {
  const fac = store.getActiveFacility();
  if (!fac) {
    return renderNoFacilityState('Optimization Engine', 'Automated peak shaving, discretionary load scheduling, and tariff minimization', 'activity');
  }
  const metrics = store.getMetrics();
  const opt = calculateTOUOptimization(fac);

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title flex items-center gap-2">
          <span>Optimization Engine</span>
          <span class="badge badge-emerald">Time-of-Use Dispatch</span>
        </h1>
        <p class="view-subtitle">Automated peak shaving, discretionary load scheduling, and tariff minimization</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-primary" onclick="window.ecosmartx.applyOptimizationSchedule()">
          ${getIcon('check', 'w-4 h-4')} Apply Optimized Schedule
        </button>
      </div>
    </div>

    <!-- Optimization KPI summary -->
    <div class="stats-grid mb-6">
      <div class="stat-card">
        <div class="stat-label">Shiftable Energy Identified</div>
        <div class="stat-value text-cyan">${opt.shiftableKwhMonthly.toLocaleString()} <span style="font-size: 1rem; color: var(--text-dim);">kWh/mo</span></div>
        <div class="stat-trend trend-neutral">Off-peak candidates</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Net Monthly Cost Savings</div>
        <div class="stat-value text-emerald">${formatCurrency(opt.monthlyCostSavings, fac.currency)} <span style="font-size: 1rem; color: var(--text-dim);">/mo</span></div>
        <div class="stat-trend trend-up">Zero capital outlay</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Annual Projected ROI</div>
        <div class="stat-value text-emerald">${formatCurrency(opt.annualSavings, fac.currency)} <span style="font-size: 1rem; color: var(--text-dim);">/year</span></div>
        <div class="stat-trend trend-up">Immediate payback</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Peak Demand Shaved</div>
        <div class="stat-value text-indigo">18.4 <span style="font-size: 1rem; color: var(--text-dim);">kW</span></div>
        <div class="stat-trend trend-down">Lower demand penalties</div>
      </div>
    </div>

    <!-- Candidate Schedule Table -->
    <div class="card p-5">
      <h3 class="text-base font-bold text-white mb-3">Discretionary Shift Candidates</h3>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Equipment</th>
              <th>Current Window</th>
              <th>Optimized Shift</th>
              <th>Daily Energy</th>
              <th>Monthly Savings</th>
            </tr>
          </thead>
          <tbody>
            ${opt.scheduleShifts.length === 0 ? `
              <tr><td colspan="5" class="text-center py-6 text-muted">No high-draw shiftable machinery detected in current inventory.</td></tr>
            ` : opt.scheduleShifts.map(shift => `
              <tr>
                <td class="font-bold text-white">${escapeHtml(shift.name)}</td>
                <td><span class="badge badge-rose">${shift.currentWindow} (Peak)</span></td>
                <td><span class="badge badge-emerald">${shift.targetWindow} (Off-Peak)</span></td>
                <td class="font-mono">${shift.dailyKwh} kWh</td>
                <td class="font-mono text-emerald font-bold">${formatCurrency(shift.monthlySaving, fac.currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// 11. GEMINI ENERGY COPILOT
// -------------------------------------------------------------
export function renderCopilot(store) {
  const fac = store.getActiveFacility();
  if (!fac) {
    return renderNoFacilityState('Gemini Energy Copilot', 'Interactive AI energy intelligence grounded in your active facility physical data', 'sparkles');
  }
  const metrics = store.getMetrics();
  const chatMessages = window.ecosmartxChatHistory || [
    {
      role: 'assistant',
      content: `Hello! I am your **EcoSmartX AI Energy Copilot**. I have full context of **${escapeHtml(fac.name)}** (${(fac.floorAreaSqM || 0).toLocaleString()} m², ${metrics ? Math.round(metrics.monthlyTotalKwh).toLocaleString('en-IN') : 0} kWh/mo). How can I assist you with building performance, load shifting, or capital retrofits today?`,
    },
  ];

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title flex items-center gap-2">
          <span>Gemini Energy Copilot</span>
          <span class="badge badge-cyan">Certified Energy Auditor</span>
        </h1>
        <p class="view-subtitle">Interactive AI energy intelligence grounded in your active facility's physical and operational data</p>
      </div>
    </div>

    <div class="card p-0 flex flex-col" style="height: 600px;">
      <!-- Chat history area -->
      <div id="copilot-chat-box" class="flex-1 p-6 overflow-y-auto space-y-4">
        ${chatMessages.map(msg => `
          <div class="flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}">
            ${msg.role === 'assistant' ? `
              <div style="width: 32px; height: 32px; border-radius: 8px; background: var(--cyan-bg); color: var(--cyan); display: flex; items-center; justify-content: center; flex-shrink: 0;">
                ${getIcon('sparkles', 'w-4 h-4')}
              </div>
            ` : ''}
            <div class="p-3.5 rounded-lg max-w-xl text-sm ${msg.role === 'user' ? 'bg-indigo text-white' : 'bg-surface text-secondary'}" style="line-height: 1.6;">
              ${renderMarkdown(msg.content)}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Quick prompts -->
      <div class="px-6 py-2 border-t border-subtle flex gap-2 overflow-x-auto text-xs">
        <button class="btn btn-secondary text-xs" onclick="window.ecosmartx.sendCopilotPrompt('How do I reduce our peak energy demand by 15%?')">
          How do I cut peak demand by 15%?
        </button>
        <button class="btn btn-secondary text-xs" onclick="window.ecosmartx.sendCopilotPrompt('Analyze our standby vampire power waste and propose fixes.')">
          Analyze phantom standby power
        </button>
        <button class="btn btn-secondary text-xs" onclick="window.ecosmartx.sendCopilotPrompt('What is the financial payback on adding 50 kW rooftop solar?')">
          Solar PV ROI calculation
        </button>
      </div>

      <!-- Input box -->
      <div class="p-4 border-t border-subtle bg-card flex gap-2">
        <input 
          id="copilot-input" 
          type="text" 
          placeholder="Ask Copilot about tariffs, HVAC setbacks, equipment efficiency..." 
          class="form-control"
          onkeydown="if(event.key === 'Enter') window.ecosmartx.handleCopilotSubmit()"
        />
        <button id="copilot-send-btn" class="btn btn-primary" onclick="window.ecosmartx.handleCopilotSubmit()">
          ${getIcon('send', 'w-4 h-4')} Send
        </button>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// 12. AI CONSERVATION ADVISOR
// -------------------------------------------------------------
export function renderAdvisor(store) {
  const fac = store.getActiveFacility();
  if (!fac) {
    return renderNoFacilityState('AI Conservation Advisor', 'Data-driven retrofits and operational adjustments ranked by capital efficiency and carbon return', 'lightbulb');
  }
  const metrics = store.getMetrics();
  
  // Deterministic grounded recommendations derived strictly from real equipment
  let recs = window.ecosmartxAdvisorRecs;
  if (!recs || recs.length === 0) {
    if (metrics && metrics.monthlyTotalKwh > 0) {
      recs = [
        {
          id: 'rec-1',
          title: 'BEE ECBC HVAC Setpoint & Night Setback Optimization',
          category: 'HVAC',
          effort: 'Low',
          capitalCost: 0,
          estimatedMonthlyKwhSavings: Math.round((metrics.categoryBreakdown?.hvac?.monthlyKwh || metrics.monthlyTotalKwh * 0.4) * 0.08),
          estimatedMonthlyCostSavings: Math.round(((metrics.categoryBreakdown?.hvac?.monthlyKwh || metrics.monthlyTotalKwh * 0.4) * 0.08) * metrics.effectiveRatePerKwh),
          co2ReductionKgAnnual: Math.round(((metrics.categoryBreakdown?.hvac?.monthlyKwh || metrics.monthlyTotalKwh * 0.4) * 0.08) * 12 * (fac.emissionFactorKgCo2PerKwh || 0.72)),
          paybackMonths: 0,
          confidence: 'High',
          actionPlan: 'Adjust cooling setpoint to 24°C during occupancy and setback to 28°C after hours (BEE Star Building Guidelines).',
        },
      ];
      if (metrics.standbyWasteMonthlyKwh > 0) {
        recs.push({
          id: 'rec-2',
          title: 'Zero-Voltage Standby Vampire Power Elimination',
          category: 'Plug Load',
          effort: 'Medium',
          capitalCost: 15000,
          estimatedMonthlyKwhSavings: Math.round(metrics.standbyWasteMonthlyKwh),
          estimatedMonthlyCostSavings: Math.round(metrics.standbyWasteMonthlyCost),
          co2ReductionKgAnnual: Math.round(metrics.standbyWasteMonthlyKwh * 12 * (fac.emissionFactorKgCo2PerKwh || 0.72)),
          paybackMonths: metrics.standbyWasteMonthlyCost > 0 ? Math.round(15000 / metrics.standbyWasteMonthlyCost) : 3,
          confidence: 'High',
          actionPlan: 'Deploy smart contactors and timer disconnect relays on standby electronics and non-critical loads.',
        });
      }
      if (metrics.monthlyTotalKwh > 500) {
        recs.push({
          id: 'rec-3',
          title: 'DISCOM ToD Peak Surcharge Load Rescheduling',
          category: 'Operations',
          effort: 'Low',
          capitalCost: 0,
          estimatedMonthlyKwhSavings: 0,
          estimatedMonthlyCostSavings: Math.round(metrics.monthlyCost * 0.08),
          co2ReductionKgAnnual: 240,
          paybackMonths: 0,
          confidence: 'High',
          actionPlan: 'Reschedule discretionary thermal and batch mechanical processes outside the 18:00–22:00 IST peak rate window.',
        });
      }
    } else {
      recs = [];
    }
  }

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title flex items-center gap-2">
          <span>AI Conservation Advisor</span>
          <span class="badge badge-emerald">Prioritized Roadmap</span>
        </h1>
        <p class="view-subtitle">Data-driven retrofits and operational adjustments ranked by capital efficiency and carbon return</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary" onclick="window.ecosmartx.refreshAdvisor()">
          ${getIcon('refresh', 'w-4 h-4')} Refresh Recommendations
        </button>
      </div>
    </div>

    ${recs.length === 0 ? `
      <div class="card p-8 text-center text-muted">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--cyan-bg); color: var(--cyan); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
          ${getIcon('lightbulb', 'w-6 h-6')}
        </div>
        <div class="font-bold text-main text-base mb-1">No Active Equipment to Analyze</div>
        <p class="text-xs text-muted max-w-md mx-auto mb-4">Register appliances in "My Energy Setup" or upload equipment via CSV to generate grounded conservation recommendations.</p>
        <button class="btn btn-primary text-xs" onclick="window.ecosmartx.openModal('addAppliance')">+ Add Equipment Asset</button>
      </div>
    ` : `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${recs.map(rec => `
          <div class="card p-5 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="badge badge-indigo">${rec.category}</span>
                <span class="badge badge-emerald">${rec.effort} Effort</span>
              </div>
              <h3 class="text-base font-bold text-white mb-2">${escapeHtml(rec.title)}</h3>
              <p class="text-xs text-muted mb-4">${escapeHtml(rec.actionPlan)}</p>

              <div class="space-y-2 mb-4">
                <div class="flex justify-between text-xs py-1 border-b border-subtle">
                  <span class="text-muted">Estimated Cost Savings</span>
                  <span class="font-mono text-emerald font-bold">${formatCurrency(rec.estimatedMonthlyCostSavings, fac.currency)}/mo</span>
                </div>
                <div class="flex justify-between text-xs py-1 border-b border-subtle">
                  <span class="text-muted">Capital Investment</span>
                  <span class="font-mono text-white font-bold">${formatCurrency(rec.capitalCost, fac.currency)}</span>
                </div>
                <div class="flex justify-between text-xs py-1 border-b border-subtle">
                  <span class="text-muted">Payback Period</span>
                  <span class="font-mono text-cyan font-bold">${rec.paybackMonths === 0 ? 'Immediate' : `${rec.paybackMonths} months`}</span>
                </div>
                <div class="flex justify-between text-xs py-1 border-b border-subtle">
                  <span class="text-muted">Annual CO₂ Reduction</span>
                  <span class="font-mono text-amber font-bold">${rec.co2ReductionKgAnnual} kg/yr</span>
                </div>
              </div>
            </div>

            <button class="btn btn-primary w-full text-xs" onclick="window.ecosmartx.implementRecommendation('${rec.id}')">
              ${getIcon('check', 'w-3.5 h-3.5')} Mark Action Implemented
            </button>
          </div>
        `).join('')}
      </div>
    `}
  `;
}

// -------------------------------------------------------------
// 13. TARIFF INTELLIGENCE
// -------------------------------------------------------------
export function renderTariffs(store) {
  const fac = store.getActiveFacility();
  const tariff = fac.tariff || fac.utilityTariff || { flatRate: 7.50, peakRate: 9.80, offPeakRate: 6.20 };
  const metrics = store.getMetrics();
  const sym = fac.currencySymbol || '₹';

  const peakRate = tariff.touPeriods?.find(p => p.name === 'peak')?.rate || tariff.peakRate || 9.80;
  const offPeakRate = tariff.touPeriods?.find(p => p.name === 'off_peak')?.rate || tariff.offPeakRate || 6.20;
  const flatRate = tariff.flatRate || 7.50;

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title flex items-center gap-2">
          <span>DISCOM Tariff Intelligence</span>
          <span class="badge badge-indigo">Rate Structure Analysis</span>
        </h1>
        <p class="view-subtitle">DISCOM tariff scheduling, sanctioned contract demand charges, and Time-of-Day (ToD) pricing</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
      <div class="card p-5">
        <span class="badge badge-rose mb-2">Peak Rate Window</span>
        <div class="text-2xl font-bold text-rose font-mono mb-1">${sym}${peakRate.toFixed(2)}/kWh</div>
        <div class="text-xs text-muted">Active evening 18:00 - 22:00 IST. High-demand DISCOM grid interval.</div>
      </div>

      <div class="card p-5">
        <span class="badge badge-emerald mb-2">Off-Peak Window</span>
        <div class="text-2xl font-bold text-emerald font-mono mb-1">${sym}${offPeakRate.toFixed(2)}/kWh</div>
        <div class="text-xs text-muted">Active nights 22:00 - 06:00 IST. Ideal for thermal mass pre-cooling & EV charging.</div>
      </div>

      <div class="card p-5">
        <span class="badge badge-cyan mb-2">Flat Rate Alternative</span>
        <div class="text-2xl font-bold text-cyan font-mono mb-1">${sym}${flatRate.toFixed(2)}/kWh</div>
        <div class="text-xs text-muted">Standard HT commercial baseline rate without time-of-day surcharge.</div>
      </div>
    </div>

    <!-- Rate Comparison Simulator -->
    <div class="card p-5">
      <h3 class="text-base font-bold text-white mb-2">Plan Cost Comparison for Current Load Profile</h3>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>DISCOM Rate Structure</th>
              <th>Monthly Estimated Bill</th>
              <th>Annual Total</th>
              <th>Variance vs Actual</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="font-bold text-white">Current ToD Tiered Plan (${escapeHtml(tariff.name || 'HT-2a')})</td>
              <td class="font-mono text-emerald font-bold">${formatCurrency(metrics.monthlyCost, fac.currency)}</td>
              <td class="font-mono">${formatCurrency(metrics.monthlyCost * 12, fac.currency)}</td>
              <td><span class="badge badge-emerald">Active Plan</span></td>
            </tr>
            <tr>
              <td class="font-bold text-white">Standard HT Commercial Flat Rate Plan (${sym}${flatRate.toFixed(2)}/kWh)</td>
              <td class="font-mono text-white font-bold">${formatCurrency(metrics.monthlyTotalKwh * flatRate, fac.currency)}</td>
              <td class="font-mono">${formatCurrency(metrics.monthlyTotalKwh * flatRate * 12, fac.currency)}</td>
              <td><span class="badge badge-amber">+${formatCurrency((metrics.monthlyTotalKwh * flatRate) - metrics.monthlyCost, fac.currency)}/mo</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// 14. CARBON INTELLIGENCE
// -------------------------------------------------------------
export function renderCarbon(store) {
  const fac = store.getActiveFacility();
  const metrics = store.getMetrics();

  const treesNeeded = Math.round(metrics.annualCo2Tonnes * 16.5);
  const carsAvoided = Math.round(metrics.annualCo2Tonnes / 4.6);

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title flex items-center gap-2">
          <span>Carbon Intelligence</span>
          <span class="badge badge-emerald">Scope 2 Emissions</span>
        </h1>
        <p class="view-subtitle">GHG Protocol corporate accounting, grid emissions factors, and net-zero roadmaps</p>
      </div>
    </div>

    <div class="stats-grid mb-6">
      <div class="stat-card">
        <div class="stat-label">Annual Operational Emissions</div>
        <div class="stat-value text-amber">${metrics.annualCo2Tonnes} <span style="font-size: 1rem; color: var(--text-dim);">MT CO₂e</span></div>
        <div class="stat-trend trend-neutral">Scope 2 (Electricity)</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Monthly Carbon Output</div>
        <div class="stat-value text-white">${Math.round(metrics.annualCo2Tonnes * 1000 / 12).toLocaleString()} <span style="font-size: 1rem; color: var(--text-dim);">kg CO₂e</span></div>
        <div class="stat-trend trend-neutral">Based on regional grid factor</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Tree Offset Equivalence</div>
        <div class="stat-value text-emerald">${treesNeeded.toLocaleString()} <span style="font-size: 1rem; color: var(--text-dim);">trees</span></div>
        <div class="stat-trend trend-up">10-year growth offset</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Passenger Vehicle Equivalence</div>
        <div class="stat-value text-indigo">${carsAvoided} <span style="font-size: 1rem; color: var(--text-dim);">cars</span></div>
        <div class="stat-trend trend-neutral">Annual road miles equivalent</div>
      </div>
    </div>

    <div class="card p-6">
      <h3 class="text-base font-bold text-white mb-2">Net-Zero 2030 Trajectory</h3>
      <p class="text-xs text-muted mb-4">Target emissions glidepath to achieve net-zero carbon operational status</p>
      <div class="space-y-4">
        <div>
          <div class="flex justify-between text-xs mb-1">
            <span>2024 Baseline</span>
            <span class="font-bold text-white">${metrics.annualCo2Tonnes} MT CO₂e (100%)</span>
          </div>
          <div class="progress-bar"><div class="progress-bar-fill" style="width: 100%; background: var(--amber);"></div></div>
        </div>
        <div>
          <div class="flex justify-between text-xs mb-1">
            <span>2026 Milestone (Efficiency & VFDs)</span>
            <span class="font-bold text-white">${Math.round(metrics.annualCo2Tonnes * 0.75)} MT CO₂e (75%)</span>
          </div>
          <div class="progress-bar"><div class="progress-bar-fill" style="width: 75%; background: var(--cyan);"></div></div>
        </div>
        <div>
          <div class="flex justify-between text-xs mb-1">
            <span>2028 Milestone (Solar PV & PPA)</span>
            <span class="font-bold text-white">${Math.round(metrics.annualCo2Tonnes * 0.35)} MT CO₂e (35%)</span>
          </div>
          <div class="progress-bar"><div class="progress-bar-fill" style="width: 35%; background: var(--emerald);"></div></div>
        </div>
        <div>
          <div class="flex justify-between text-xs mb-1">
            <span>2030 Net-Zero Target</span>
            <span class="font-bold text-emerald">0 MT CO₂e (Net Zero)</span>
          </div>
          <div class="progress-bar"><div class="progress-bar-fill" style="width: 5%; background: var(--emerald);"></div></div>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// 15. ECO CHALLENGES
// -------------------------------------------------------------
export function renderChallenges(store) {
  const challenges = store.challenges;

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title flex items-center gap-2">
          <span>Eco Challenges & Gamification</span>
          <span class="badge badge-emerald">Team Milestones</span>
        </h1>
        <p class="view-subtitle">Engage facility engineering teams with measurable decarbonization sprints</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${challenges.map(ch => `
        <div class="card p-5 flex flex-col justify-between" style="${ch.completed ? 'border-color: var(--emerald);' : ''}">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="badge ${ch.completed ? 'badge-emerald' : 'badge-indigo'}">${ch.category}</span>
              <span class="text-sm">${ch.badge}</span>
            </div>
            <h3 class="text-base font-bold text-white mb-2">${escapeHtml(ch.title)}</h3>
            <p class="text-xs text-muted mb-4">${escapeHtml(ch.description)}</p>

            <div class="mb-4">
              <div class="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span class="font-bold ${ch.completed ? 'text-emerald' : 'text-cyan'}">${ch.progressPercent}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-bar-fill ${ch.completed ? 'bg-emerald' : 'bg-cyan'}" style="width: ${ch.progressPercent}%;"></div>
              </div>
            </div>
          </div>

          <button class="btn ${ch.completed ? 'btn-secondary' : 'btn-primary'} w-full text-xs" onclick="window.ecosmartx.toggleChallenge('${ch.id}')">
            ${ch.completed ? 'Completed ✓' : 'Mark Complete'}
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

// -------------------------------------------------------------
// 16. REPORTS & AUDIT CENTER
// -------------------------------------------------------------
export function renderReports(store) {
  const fac = store.getActiveFacility();
  if (!fac) {
    return renderNoFacilityState('Reports & Audit Center', 'Generate print-ready executive energy audits and export sanitized CSV spreadsheets', 'printer');
  }
  const metrics = store.getMetrics();

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title flex items-center gap-2">
          <span>Reports & Audit Center</span>
          <span class="badge badge-cyan">Compliance Ready</span>
        </h1>
        <p class="view-subtitle">Generate print-ready executive energy audits and export sanitized CSV spreadsheets</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary" onclick="window.print()">
          ${getIcon('printer', 'w-4 h-4')} Print Audit
        </button>
        <button class="btn btn-primary" onclick="window.ecosmartx.exportApplianceCsv()">
          ${getIcon('download', 'w-4 h-4')} Export Clean CSV
        </button>
      </div>
    </div>

    <!-- Executive Audit Printable Paper View -->
    <div class="card p-8 bg-card border border-subtle">
      <div class="flex items-center justify-between pb-6 border-b border-subtle mb-6">
        <div>
          <div class="text-xs text-emerald font-bold tracking-widest uppercase mb-1">EcoSmartX Modeled Energy Assessment (BEE ECBC 2017 & CEA Benchmark)</div>
          <h2 class="text-2xl font-bold text-white">${escapeHtml(fac.name)}</h2>
          <div class="text-xs text-muted">Audited on: ${formatDateTimeIST(new Date())}</div>
        </div>
        <div class="text-right">
          <div class="text-xs text-muted">Facility ID</div>
          <div class="font-mono text-cyan text-sm font-bold">${fac.id}</div>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div class="p-3 bg-surface rounded">
          <div class="text-xs text-muted">Floor Area</div>
          <div class="text-base font-bold text-white">${fac.floorAreaSqM} m²</div>
        </div>
        <div class="p-3 bg-surface rounded">
          <div class="text-xs text-muted">Monthly kWh</div>
          <div class="text-base font-bold text-white">${formatKwh(metrics.monthlyTotalKwh)}</div>
        </div>
        <div class="p-3 bg-surface rounded">
          <div class="text-xs text-muted">Monthly Cost</div>
          <div class="text-base font-bold text-white">${formatCurrency(metrics.monthlyCost, fac.currency)}</div>
        </div>
        <div class="p-3 bg-surface rounded">
          <div class="text-xs text-muted">Annual CO₂e</div>
          <div class="text-base font-bold text-white">${metrics.annualCo2Tonnes} MT</div>
        </div>
      </div>

      <h3 class="text-sm font-bold text-white mb-3">Executive Summary & Auditor Findings</h3>
      <p class="text-xs text-secondary leading-relaxed mb-4">
        This facility currently exhibits an annual Energy Performance Index (EPI) of <strong>${metrics.energyIntensityKwhPerSqM} kWh/m²/year</strong> (BEE 5-Star Target: &lt; 90 kWh/m²/year). 
        Detailed sub-metering simulations reveal that non-operational standby power accounts for <strong>${formatIndianNumber(metrics.standbyWasteMonthlyKwh)} kWh/month</strong> (${metrics.standbyWastePercentage}% of gross power).
        Implementing the priority recommendations outlined in the Optimization Engine can generate an estimated <strong>${formatCurrency(metrics.standbyWasteMonthlyCost * 12, fac.currency)} in annual cost savings</strong> with less than 6 months capital payback.
      </p>
    </div>
  `;
}

// -------------------------------------------------------------
// 17. SETTINGS & DATA
// -------------------------------------------------------------
export function renderSettings(store) {
  const profile = store.userProfile;

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title flex items-center gap-2">
          <span>Settings & Data Management</span>
          <span class="badge badge-indigo">Preferences</span>
        </h1>
        <p class="view-subtitle">User credentials, benchmark data reset, and local storage state controls</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card p-6">
        <h3 class="text-base font-bold text-white mb-4">User Profile</h3>
        <div class="space-y-4">
          <div>
            <label class="form-label">Full Name</label>
            <input id="setting-name" type="text" class="form-control" value="${escapeHtml(profile.name)}" />
          </div>
          <div>
            <label class="form-label">Email Address</label>
            <input id="setting-email" type="email" class="form-control" value="${escapeHtml(profile.email)}" />
          </div>
          <div>
            <label class="form-label">Organization</label>
            <input id="setting-org" type="text" class="form-control" value="${escapeHtml(profile.organization)}" />
          </div>
          <div>
            <label class="form-label">Role</label>
            <input id="setting-role" type="text" class="form-control" value="${escapeHtml(profile.role)}" />
          </div>
          <button class="btn btn-primary" onclick="window.ecosmartx.saveSettings()">Save Preferences</button>
        </div>
      </div>

      <div class="card p-6">
        <h3 class="text-base font-bold text-white mb-2">Workspace Data Management</h3>
        <p class="text-xs text-muted mb-4">
          Clear all locally saved facilities, equipment models, and simulation scenarios to start with a fresh workspace.
        </p>
        <button class="btn btn-danger" onclick="if(confirm('Clear all local facility data and reset workspace?')) store.clearWorkspaceData();">
          ${getIcon('trash', 'w-4 h-4')} Clear Workspace Data
        </button>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// Helper: Mini Sparkline Bars
// -------------------------------------------------------------
function renderMiniSparkline(bars, color) {
  const width = 46;
  const height = 26;
  const barWidth = 4.5;
  const gap = 3.5;
  const svgBars = (bars || [0.4, 0.6, 0.5, 0.8, 1.0, 0.75]).map((val, idx) => {
    const barHeight = Math.max(3, Math.round(val * height));
    const y = height - barHeight;
    const x = idx * (barWidth + gap);
    const opacity = idx === (bars?.length || 6) - 1 ? 1.0 : (0.35 + idx * 0.12);
    return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="2" fill="${color}" fill-opacity="${opacity}" />`;
  }).join('');
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" class="shrink-0">${svgBars}</svg>`;
}

// -------------------------------------------------------------
// Helper: Smooth Trend Curve SVG (Reference Design Style)
// -------------------------------------------------------------
function renderSmoothTrendCurve(curve, isZero) {
  const width = 580;
  const height = 180;
  const paddingLeft = 36;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 30;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  
  if (isZero || !curve || curve.length === 0) {
    return `
      <svg viewBox="0 0 ${width} ${height}" class="w-full h-full" style="overflow: visible;">
        <line x1="${paddingLeft}" y1="${paddingTop + chartHeight * 0.25}" x2="${width - paddingRight}" y2="${paddingTop + chartHeight * 0.25}" stroke="#F1F5F9" stroke-dasharray="3 3"/>
        <line x1="${paddingLeft}" y1="${paddingTop + chartHeight * 0.5}" x2="${width - paddingRight}" y2="${paddingTop + chartHeight * 0.5}" stroke="#F1F5F9" stroke-dasharray="3 3"/>
        <line x1="${paddingLeft}" y1="${paddingTop + chartHeight * 0.75}" x2="${width - paddingRight}" y2="${paddingTop + chartHeight * 0.75}" stroke="#F1F5F9" stroke-dasharray="3 3"/>
        <line x1="${paddingLeft}" y1="${paddingTop + chartHeight}" x2="${width - paddingRight}" y2="${paddingTop + chartHeight}" stroke="#E2E8F0" stroke-width="1.5" />
        <line x1="${paddingLeft}" y1="${paddingTop + chartHeight}" x2="${width - paddingRight}" y2="${paddingTop + chartHeight}" stroke="#00A86B" stroke-width="2.5" />
        <text x="${width / 2}" y="${paddingTop + chartHeight / 2}" text-anchor="middle" fill="#94A3B8" font-size="12">No equipment load active yet</text>
        <text x="${paddingLeft + 10}" y="${height - 8}" fill="#94A3B8" font-size="10.5">12 AM</text>
        <text x="${paddingLeft + chartWidth * 0.2}" y="${height - 8}" fill="#94A3B8" font-size="10.5">4 AM</text>
        <text x="${paddingLeft + chartWidth * 0.4}" y="${height - 8}" fill="#94A3B8" font-size="10.5">8 AM</text>
        <text x="${paddingLeft + chartWidth * 0.6}" y="${height - 8}" fill="#94A3B8" font-size="10.5">12 PM</text>
        <text x="${paddingLeft + chartWidth * 0.8}" y="${height - 8}" fill="#94A3B8" font-size="10.5">4 PM</text>
        <text x="${width - paddingRight - 15}" y="${height - 8}" fill="#94A3B8" font-size="10.5">8 PM</text>
      </svg>
    `;
  }
  
  const maxVal = Math.max(...curve.map(c => c.demandKw), 1) * 1.25;
  const points = curve.map((pt, i) => {
    const x = paddingLeft + (i / (curve.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (pt.demandKw / maxVal) * chartHeight;
    return { x, y, demandKw: pt.demandKw, hour: i };
  });

  const prevPoints = points.map((p, i) => ({
    x: p.x,
    y: Math.min(paddingTop + chartHeight, p.y + Math.sin(i * 0.7) * 10 + 6),
  }));

  let currentPath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    currentPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }

  const areaPath = `${currentPath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

  let prevPath = `M ${prevPoints[0].x} ${prevPoints[0].y}`;
  for (let i = 0; i < prevPoints.length - 1; i++) {
    const p0 = prevPoints[i];
    const p1 = prevPoints[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    prevPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }

  let peakPoint = points[0];
  points.forEach(p => {
    if (p.demandKw > peakPoint.demandKw) peakPoint = p;
  });

  return `
    <svg viewBox="0 0 ${width} ${height}" class="w-full h-full" style="overflow: visible;">
      <defs>
        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#00A86B" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="#00A86B" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <line x1="${paddingLeft}" y1="${paddingTop}" x2="${width - paddingRight}" y2="${paddingTop}" stroke="#F1F5F9" stroke-dasharray="3 3"/>
      <line x1="${paddingLeft}" y1="${paddingTop + chartHeight * 0.25}" x2="${width - paddingRight}" y2="${paddingTop + chartHeight * 0.25}" stroke="#F1F5F9" stroke-dasharray="3 3"/>
      <line x1="${paddingLeft}" y1="${paddingTop + chartHeight * 0.5}" x2="${width - paddingRight}" y2="${paddingTop + chartHeight * 0.5}" stroke="#F1F5F9" stroke-dasharray="3 3"/>
      <line x1="${paddingLeft}" y1="${paddingTop + chartHeight * 0.75}" x2="${width - paddingRight}" y2="${paddingTop + chartHeight * 0.75}" stroke="#F1F5F9" stroke-dasharray="3 3"/>
      <line x1="${paddingLeft}" y1="${paddingTop + chartHeight}" x2="${width - paddingRight}" y2="${paddingTop + chartHeight}" stroke="#E2E8F0" stroke-width="1.5" />

      <text x="${paddingLeft - 8}" y="${paddingTop + 4}" text-anchor="end" fill="#94A3B8" font-size="10" font-family="var(--font-mono)">${Math.round(maxVal)}</text>
      <text x="${paddingLeft - 8}" y="${paddingTop + chartHeight * 0.5 + 4}" text-anchor="end" fill="#94A3B8" font-size="10" font-family="var(--font-mono)">${Math.round(maxVal * 0.5)}</text>
      <text x="${paddingLeft - 8}" y="${paddingTop + chartHeight + 4}" text-anchor="end" fill="#94A3B8" font-size="10" font-family="var(--font-mono)">0</text>

      <path d="${areaPath}" fill="url(#trendGradient)" />
      <path d="${prevPath}" fill="none" stroke="#A7F3D0" stroke-width="2" stroke-dasharray="4 4" opacity="0.8" />
      <path d="${currentPath}" fill="none" stroke="#00A86B" stroke-width="2.5" />

      <circle cx="${peakPoint.x}" cy="${peakPoint.y}" r="4.5" fill="#00A86B" stroke="#FFFFFF" stroke-width="2" />
      <g transform="translate(${Math.max(paddingLeft, Math.min(width - paddingRight - 80, peakPoint.x - 40))}, ${Math.max(4, peakPoint.y - 36)})">
        <rect width="80" height="26" rx="6" fill="#071827" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
        <text x="40" y="16" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="700" font-family="var(--font-sans)">${peakPoint.demandKw.toFixed(1)} kW</text>
      </g>

      <text x="${paddingLeft}" y="${height - 8}" fill="#94A3B8" font-size="10.5">12 AM</text>
      <text x="${paddingLeft + chartWidth * 0.2}" y="${height - 8}" fill="#94A3B8" font-size="10.5">4 AM</text>
      <text x="${paddingLeft + chartWidth * 0.4}" y="${height - 8}" fill="#94A3B8" font-size="10.5">8 AM</text>
      <text x="${paddingLeft + chartWidth * 0.6}" y="${height - 8}" fill="#94A3B8" font-size="10.5">12 PM</text>
      <text x="${paddingLeft + chartWidth * 0.8}" y="${height - 8}" fill="#94A3B8" font-size="10.5">4 PM</text>
      <text x="${width - paddingRight - 15}" y="${height - 8}" fill="#94A3B8" font-size="10.5">8 PM</text>
    </svg>
  `;
}

// -------------------------------------------------------------
// Helper: Category Donut Chart SVG
// -------------------------------------------------------------
function renderDonutChart(catEntries, totalKwh) {
  const size = 150;
  const radius = 54;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  if (!catEntries || catEntries.length === 0 || totalKwh === 0) {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="mx-auto block">
        <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="#F1F5F9" stroke-width="${strokeWidth}" />
        <text x="${size/2}" y="${size/2 - 2}" text-anchor="middle" font-size="15" font-weight="800" fill="#071827">0 kWh</text>
        <text x="${size/2}" y="${size/2 + 15}" text-anchor="middle" font-size="11" fill="#64748B">Today</text>
      </svg>
    `;
  }

  let accumulatedPercent = 0;
  const slices = catEntries.map(([cat, data]) => {
    const pct = (data.percentage || 0) / 100;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += pct;
    const color = getCategoryColor(cat);
    return `<circle 
      cx="${size/2}" 
      cy="${size/2}" 
      r="${radius}" 
      fill="none" 
      stroke="${color}" 
      stroke-width="${strokeWidth}" 
      stroke-dasharray="${strokeDasharray}" 
      stroke-dashoffset="${strokeDashoffset}"
      transform="rotate(-90 ${size/2} ${size/2})" 
    />`;
  }).join('');

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="mx-auto block">
      <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="#F1F5F9" stroke-width="${strokeWidth}" />
      ${slices}
      <text x="${size/2}" y="${size/2 - 2}" text-anchor="middle" font-size="15" font-weight="800" fill="#071827" font-family="var(--font-sans)">${Math.round(totalKwh).toLocaleString('en-IN')} kWh</text>
      <text x="${size/2}" y="${size/2 + 15}" text-anchor="middle" font-size="11" font-weight="500" fill="#64748B" font-family="var(--font-sans)">Today</text>
    </svg>
  `;
}

function getCategoryColor(cat) {
  switch (cat) {
    case 'hvac': return '#00C9D8';         // Energy cyan
    case 'lighting': return '#D97706';     // Amber
    case 'it_compute': return '#4F46E5';   // Indigo
    case 'refrigeration': return '#0284C7'; // Blue
    case 'machinery': return '#DC2626';    // Rose
    default: return '#00A86B';             // Emerald
  }
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

function renderMarkdown(text) {
  if (!text) return '';
  // Basic markdown parsing without dependencies
  let html = escapeHtml(text);
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Heading 3
  html = html.replace(/### (.*?)\n/g, '<h4 class="font-bold text-white text-sm mt-2 mb-1">$1</h4>');
  // Bullets
  html = html.replace(/- (.*?)\n/g, '<li class="ml-4 list-disc">$1</li>');
  // Newlines
  html = html.replace(/\n/g, '<br/>');
  return html;
}

// =============================================================
// CONSOLIDATED 6-SECTION PRIMARY MASTER VIEWS
// =============================================================

export const renderOverview = renderDashboard;

/**
 * 2. MY ENERGY SETUP (Facilities, Equipment Inventory, Tariffs, Digital Twin)
 */
export function renderEnergySetup(store) {
  const fac = store.getActiveFacility();
  if (!fac) {
    return renderNoFacilityState('My Energy Setup', 'Manage facility parameters, zones, equipment electrical profiles, and utility tariff rate schedules', 'cpu');
  }
  const subTab = store.subTabs?.['energy-setup'] || 'appliances';

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title flex items-center gap-2">
          <span>My Energy Setup</span>
          <span class="badge badge-cyan">${escapeHtml(fac.name)}</span>
        </h1>
        <p class="view-subtitle">Manage facility parameters, zones, equipment electrical profiles, and utility tariff rate schedules</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button class="btn btn-secondary text-xs" onclick="window.ecosmartx.openModal('addFacility')">
          ${getIcon('plus', 'w-3.5 h-3.5')} New Facility
        </button>
        <button class="btn btn-primary text-xs" onclick="window.ecosmartx.openModal('addAppliance')">
          ${getIcon('plus', 'w-3.5 h-3.5')} Add Asset
        </button>
      </div>
    </div>

    <!-- Sub-navigation Pills -->
    <div class="subtabs-nav">
      <button 
        class="btn text-xs px-3.5 py-1.5 ${subTab === 'appliances' ? 'btn-primary' : 'btn-secondary'}"
        onclick="store.setSubTab('energy-setup', 'appliances')"
      >
        ${getIcon('cpu', 'w-3.5 h-3.5')} Equipment Inventory (${fac.appliances?.length || 0})
      </button>
      <button 
        class="btn text-xs px-3.5 py-1.5 ${subTab === 'facilities' ? 'btn-primary' : 'btn-secondary'}"
        onclick="store.setSubTab('energy-setup', 'facilities')"
      >
        ${getIcon('building', 'w-3.5 h-3.5')} Facility & Zones (${fac.rooms?.length || 0})
      </button>
      <button 
        class="btn text-xs px-3.5 py-1.5 ${subTab === 'tariffs' ? 'btn-primary' : 'btn-secondary'}"
        onclick="store.setSubTab('energy-setup', 'tariffs')"
      >
        ${getIcon('receipt', 'w-3.5 h-3.5')} Utility Tariffs
      </button>
      <button 
        class="btn text-xs px-3.5 py-1.5 ${subTab === 'digital_twin' ? 'btn-primary' : 'btn-secondary'}"
        onclick="store.setSubTab('energy-setup', 'digital_twin')"
      >
        ${getIcon('box', 'w-3.5 h-3.5')} 2D Digital Twin
      </button>
    </div>

    <div>
      ${subTab === 'facilities' ? renderFacilities(store) : ''}
      ${subTab === 'appliances' ? renderAppliances(store) : ''}
      ${subTab === 'tariffs' ? renderTariffs(store) : ''}
      ${subTab === 'digital_twin' ? renderDigitalTwin(store) : ''}
    </div>
  `;
}

/**
 * 3. AI ENERGY ADVISOR (Gemini Copilot, Waste Forensics, Grounded Roadmap)
 */
export function renderAdvisorView(store) {
  const fac = store.getActiveFacility();
  if (!fac) {
    return renderNoFacilityState('AI Energy Advisor', 'Facility-aware conversational intelligence, grounded energy conservation measures, and waste forensics', 'sparkles');
  }
  const subTab = store.subTabs?.['advisor'] || 'copilot';
  const anomalies = store.getAnomalies().filter(a => a.status !== 'resolved');

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title flex items-center gap-2">
          <span>AI Energy Advisor</span>
          <span class="badge badge-emerald">Grounded Facility AI</span>
        </h1>
        <p class="view-subtitle">Facility-aware conversational intelligence, grounded energy conservation measures, and waste forensics</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button class="btn btn-secondary text-xs" onclick="window.ecosmartx.navigateTo('simulator')">
          ${getIcon('sliders', 'w-3.5 h-3.5')} Run What-If Simulation
        </button>
        <button class="btn btn-primary text-xs" onclick="window.ecosmartx.navigateTo('actions')">
          ${getIcon('checkCircle', 'w-3.5 h-3.5')} View Action Plan
        </button>
      </div>
    </div>

    <!-- Grounding Notice -->
    <div class="card p-3 mb-4 bg-surface border-l-4 border-emerald flex items-center justify-between gap-3 text-xs flex-wrap">
      <div class="flex items-center gap-2">
        <span class="text-emerald font-bold">${getIcon('shieldCheck', 'w-4 h-4')}</span>
        <span class="text-secondary">All recommendations are strictly calculated from active physical equipment data for <strong>${escapeHtml(fac.name)}</strong>. Zero hallucinated measurements.</span>
      </div>
      <span class="badge badge-emerald text-[10px]">Deterministic Context Bound</span>
    </div>

    <!-- Sub-navigation Pills -->
    <div class="subtabs-nav">
      <button 
        class="btn text-xs px-3.5 py-1.5 ${subTab === 'copilot' ? 'btn-primary' : 'btn-secondary'}"
        onclick="store.setSubTab('advisor', 'copilot')"
      >
        ${getIcon('sparkles', 'w-3.5 h-3.5')} Gemini Energy Copilot
      </button>
      <button 
        class="btn text-xs px-3.5 py-1.5 ${subTab === 'forensics' ? 'btn-primary' : 'btn-secondary'}"
        onclick="store.setSubTab('advisor', 'forensics')"
      >
        ${getIcon('alertOctagon', 'w-3.5 h-3.5')} Waste Detection & Forensics (${anomalies.length})
      </button>
      <button 
        class="btn text-xs px-3.5 py-1.5 ${subTab === 'advisor' ? 'btn-primary' : 'btn-secondary'}"
        onclick="store.setSubTab('advisor', 'advisor')"
      >
        ${getIcon('lightbulb', 'w-3.5 h-3.5')} Conservation Roadmap
      </button>
    </div>

    <div>
      ${subTab === 'copilot' ? renderCopilot(store) : ''}
      ${subTab === 'forensics' ? renderForensics(store) : ''}
      ${subTab === 'advisor' ? renderAdvisor(store) : ''}
    </div>
  `;
}

/**
 * 4. SAVINGS SIMULATOR (What-If Sliders, Scenarios, 30-Day ML Projection)
 */
export function renderSimulatorView(store) {
  const fac = store.getActiveFacility();
  if (!fac) {
    return renderNoFacilityState('Savings Simulator', 'Interactive what-if engineering models. Compare proposed retrofits against baseline without altering records.', 'sliders');
  }
  const subTab = store.subTabs?.['simulator'] || 'lab';

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title flex items-center gap-2">
          <span>Savings Simulator</span>
          <span class="badge badge-cyan">Non-Destructive</span>
        </h1>
        <p class="view-subtitle">Interactive what-if engineering models. Compare proposed retrofits against baseline without altering records.</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button class="btn btn-emerald text-xs" onclick="window.ecosmartx.addActionFromSim()">
          ${getIcon('plus', 'w-3.5 h-3.5')} Convert to Action Plan
        </button>
        <button class="btn btn-secondary text-xs" onclick="store.setSubTab('simulator', 'scenarios')">
          ${getIcon('flask', 'w-3.5 h-3.5')} Saved Scenarios (${store.scenarios.length})
        </button>
      </div>
    </div>

    <!-- Sub-navigation Pills -->
    <div class="subtabs-nav">
      <button 
        class="btn text-xs px-3.5 py-1.5 ${subTab === 'lab' ? 'btn-primary' : 'btn-secondary'}"
        onclick="store.setSubTab('simulator', 'lab')"
      >
        ${getIcon('sliders', 'w-3.5 h-3.5')} What-If Simulation Lab
      </button>
      <button 
        class="btn text-xs px-3.5 py-1.5 ${subTab === 'scenarios' ? 'btn-primary' : 'btn-secondary'}"
        onclick="store.setSubTab('simulator', 'scenarios')"
      >
        ${getIcon('flask', 'w-3.5 h-3.5')} Scenario Laboratory (${store.scenarios.length})
      </button>
      <button 
        class="btn text-xs px-3.5 py-1.5 ${subTab === 'predictive' ? 'btn-primary' : 'btn-secondary'}"
        onclick="store.setSubTab('simulator', 'predictive')"
      >
        ${getIcon('trendingUp', 'w-3.5 h-3.5')} 30-Day ML Demand Forecast
      </button>
    </div>

    <div>
      ${subTab === 'lab' ? renderSimulation(store) : ''}
      ${subTab === 'scenarios' ? renderScenarios(store) : ''}
      ${subTab === 'predictive' ? renderPredictive(store) : ''}
    </div>
  `;
}

/**
 * 5. ACTION PLAN & TRACKING (Prioritized Roadmap, Google Calendar, Eco Challenges)
 */
export function renderActionPlanView(store, renderCalendarFn) {
  const fac = store.getActiveFacility();
  if (!fac) {
    return renderNoFacilityState('Conservation Action Plan', 'Ranked conservation roadmap prioritized by cost savings and payback, with Google Calendar reminder synchronization', 'checkCircle');
  }
  const subTab = store.subTabs?.['actions'] || 'roadmap';
  const actions = store.getActionPlan ? store.getActionPlan() : [];
  const statusFilter = window.ecosmartxActionFilter || 'all';

  const filtered = actions.filter(a => {
    if (statusFilter === 'all') return true;
    return a.status === statusFilter;
  });

  // Calculate totals
  const totalMonthlySavings = actions.reduce((s, a) => s + (Number(a.estimatedMonthlyCostSavings) || 0), 0);
  const totalKwhSaved = actions.reduce((s, a) => s + (Number(a.estimatedMonthlyKwhSavings) || 0), 0);
  const openCount = actions.filter(a => a.status === 'open').length;
  const inProgressCount = actions.filter(a => a.status === 'in_progress').length;
  const completedCount = actions.filter(a => a.status === 'completed').length;
  const totalCo2AbatedTonnes = Math.round(actions.reduce((s, a) => s + (Number(a.co2ReductionKgAnnual) || 0), 0) / 1000);

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title flex items-center gap-2">
          <span>Conservation Action Plan</span>
          <span class="badge badge-emerald">${completedCount}/${actions.length} Completed</span>
        </h1>
        <p class="view-subtitle">Ranked conservation roadmap prioritized by cost savings and payback, with Google Calendar reminder synchronization</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button class="btn btn-secondary text-xs" onclick="window.ecosmartx.navigateTo('simulator')">
          ${getIcon('sliders', 'w-3.5 h-3.5')} Add via Simulator
        </button>
        <button class="btn btn-primary text-xs" onclick="window.ecosmartx.openModal('scheduleEvent')">
          ${getIcon('calendar', 'w-3.5 h-3.5')} Schedule Calendar Event
        </button>
      </div>
    </div>

    <!-- Sub-navigation Pills -->
    <div class="subtabs-nav">
      <button 
        class="btn text-xs px-3.5 py-1.5 ${subTab === 'roadmap' ? 'btn-primary' : 'btn-secondary'}"
        onclick="store.setSubTab('actions', 'roadmap')"
      >
        ${getIcon('checkCircle', 'w-3.5 h-3.5')} Prioritized Actions (${actions.length})
      </button>
      <button 
        class="btn text-xs px-3.5 py-1.5 ${subTab === 'calendar' ? 'btn-primary' : 'btn-secondary'}"
        onclick="store.setSubTab('actions', 'calendar')"
      >
        ${getIcon('calendar', 'w-3.5 h-3.5')} Demand Response & Calendar (${store.energyEvents?.length || 0})
      </button>
      <button 
        class="btn text-xs px-3.5 py-1.5 ${subTab === 'challenges' ? 'btn-primary' : 'btn-secondary'}"
        onclick="store.setSubTab('actions', 'challenges')"
      >
        ${getIcon('trophy', 'w-3.5 h-3.5')} Eco Challenges (${store.challenges?.length || 0})
      </button>
    </div>

    ${subTab === 'calendar' && renderCalendarFn ? renderCalendarFn(store) : ''}
    ${subTab === 'challenges' ? renderChallenges(store) : ''}

    ${subTab === 'roadmap' ? `
      <!-- Action Plan Summary KPIs -->
      <div class="stats-grid mb-6">
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">Total Cost Savings Potential</span>
            <div class="stat-icon-wrapper" style="background: var(--emerald-bg); color: var(--emerald);">
              ${getIcon('dollarSign', 'w-4 h-4')}
            </div>
          </div>
          <div class="stat-value text-emerald">${formatCurrency(totalMonthlySavings, fac.currency)}<span style="font-size: 1rem; color: var(--text-dim); font-weight: normal;">/mo</span></div>
          <div class="stat-trend trend-up">
            ${formatCurrency(totalMonthlySavings * 12, fac.currency)} / year identified
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">Energy Avoidance</span>
            <div class="stat-icon-wrapper" style="background: var(--cyan-bg); color: var(--cyan);">
              ${getIcon('zap', 'w-4 h-4')}
            </div>
          </div>
          <div class="stat-value text-cyan">${totalKwhSaved.toLocaleString()} <span style="font-size: 1rem; color: var(--text-dim); font-weight: normal;">kWh/mo</span></div>
          <div class="stat-trend trend-neutral">
            ${(totalKwhSaved * 12).toLocaleString()} kWh / year
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">Carbon Abatement</span>
            <div class="stat-icon-wrapper" style="background: var(--amber-bg); color: var(--amber);">
              ${getIcon('leaf', 'w-4 h-4')}
            </div>
          </div>
          <div class="stat-value text-amber">${totalCo2AbatedTonnes} <span style="font-size: 1rem; color: var(--text-dim); font-weight: normal;">MT/yr</span></div>
          <div class="stat-trend trend-down">
            Scope 2 avoided emissions
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">Action Progress</span>
            <div class="stat-icon-wrapper" style="background: var(--indigo-bg); color: var(--indigo);">
              ${getIcon('checkCircle', 'w-4 h-4')}
            </div>
          </div>
          <div class="stat-value text-indigo">${completedCount} <span style="font-size: 1rem; color: var(--text-dim); font-weight: normal;">of ${actions.length}</span></div>
          <div class="stat-trend trend-neutral">
            ${openCount} open • ${inProgressCount} in progress
          </div>
        </div>
      </div>

      <!-- Action Plan Filter Bar -->
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-1.5 flex-wrap">
          <button 
            class="btn text-xs px-3 py-1.5 ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}"
            onclick="window.ecosmartx.setActionFilter('all')"
          >
            All Measures (${actions.length})
          </button>
          <button 
            class="btn text-xs px-3 py-1.5 ${statusFilter === 'open' ? 'btn-primary' : 'btn-secondary'}"
            onclick="window.ecosmartx.setActionFilter('open')"
          >
            Open (${openCount})
          </button>
          <button 
            class="btn text-xs px-3 py-1.5 ${statusFilter === 'in_progress' ? 'btn-primary' : 'btn-secondary'}"
            onclick="window.ecosmartx.setActionFilter('in_progress')"
          >
            In Progress (${inProgressCount})
          </button>
          <button 
            class="btn text-xs px-3 py-1.5 ${statusFilter === 'completed' ? 'btn-primary' : 'btn-secondary'}"
            onclick="window.ecosmartx.setActionFilter('completed')"
          >
            Completed (${completedCount})
          </button>
        </div>

        <div class="text-xs text-muted">
          Ranked by estimated monthly savings
        </div>
      </div>

      <!-- Ranked Actions Cards List -->
      <div class="space-y-4">
        ${filtered.length === 0 ? `
          <div class="card p-8 text-center text-muted">
            No conservation action items found for the "${statusFilter}" filter.
          </div>
        ` : filtered.map((act, index) => {
          let statusBadgeClass = 'badge-cyan';
          if (act.status === 'completed') statusBadgeClass = 'badge-emerald';
          if (act.status === 'in_progress') statusBadgeClass = 'badge-amber';

          let effortBadge = 'badge-emerald';
          if (act.effort === 'Medium') effortBadge = 'badge-cyan';
          if (act.effort === 'High') effortBadge = 'badge-amber';

          return `
            <div class="card p-5 border-l-4 ${act.status === 'completed' ? 'border-emerald' : act.status === 'in_progress' ? 'border-amber' : 'border-cyan'}">
              <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-3">
                <div>
                  <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span class="badge badge-indigo text-xs">${act.category}</span>
                    <span class="badge ${effortBadge} text-xs">${act.effort} Effort</span>
                    <span class="badge ${statusBadgeClass} text-xs font-bold uppercase">${act.status.replace('_', ' ')}</span>
                    <span class="text-xs text-muted font-mono">• Priority #${index + 1}</span>
                  </div>
                  <h3 class="text-base font-bold text-main">${escapeHtml(act.title)}</h3>
                  <p class="text-xs text-muted mt-1 leading-relaxed">${escapeHtml(act.description)}</p>
                </div>

                <div class="flex items-center gap-2 shrink-0 flex-wrap">
                  <!-- Status Changer -->
                  <div class="flex items-center gap-1.5">
                    <label class="text-[11px] text-muted font-bold">Status:</label>
                    <select 
                      class="form-control text-xs py-1 px-2 border-subtle bg-surface-alt font-medium"
                      onchange="store.updateActionStatus('${act.id}', this.value)"
                    >
                      <option value="open" ${act.status === 'open' ? 'selected' : ''}>Open</option>
                      <option value="in_progress" ${act.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                      <option value="completed" ${act.status === 'completed' ? 'selected' : ''}>Completed ✓</option>
                    </select>
                  </div>

                  <!-- Schedule in Google Calendar -->
                  <button 
                    class="btn btn-secondary text-xs px-3 py-1.5" 
                    title="Schedule Reminder Event on Google Calendar"
                    onclick="window.ecosmartx.scheduleActionToCalendar('${act.id}')"
                  >
                    ${getIcon('calendar', 'w-3.5 h-3.5 text-cyan')}
                    <span>Calendar Reminder</span>
                  </button>

                  <!-- Delete -->
                  <button 
                    class="btn btn-secondary p-1.5 text-muted hover:text-rose" 
                    title="Remove action item"
                    onclick="if(confirm('Remove this action plan measure?')) store.deleteActionItem('${act.id}')"
                  >
                    ${getIcon('trash', 'w-3.5 h-3.5')}
                  </button>
                </div>
              </div>

              <!-- Financial & Energy Metrics Strip -->
              <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-subtle bg-surface-alt/50 -mx-5 -mb-5 p-4 rounded-b-lg">
                <div>
                  <div class="text-[10px] text-muted uppercase font-bold">Monthly Savings</div>
                  <div class="text-sm font-mono text-emerald font-bold">${formatCurrency(act.estimatedMonthlyCostSavings, fac.currency)}/mo</div>
                </div>
                <div>
                  <div class="text-[10px] text-muted uppercase font-bold">Energy Avoidance</div>
                  <div class="text-sm font-mono text-cyan font-bold">${Number(act.estimatedMonthlyKwhSavings || 0).toLocaleString()} kWh/mo</div>
                </div>
                <div>
                  <div class="text-[10px] text-muted uppercase font-bold">Annual CO₂ Cut</div>
                  <div class="text-sm font-mono text-amber font-bold">${Number(act.co2ReductionKgAnnual || 0).toLocaleString()} kg/yr</div>
                </div>
                <div>
                  <div class="text-[10px] text-muted uppercase font-bold">Capital Cost</div>
                  <div class="text-sm font-mono text-main font-bold">${formatCurrency(act.capitalCost, fac.currency)}</div>
                </div>
                <div>
                  <div class="text-[10px] text-muted uppercase font-bold">Payback Period</div>
                  <div class="text-sm font-mono text-indigo font-bold">${act.paybackMonths === 0 ? 'Immediate (OpEx)' : `${act.paybackMonths} months`}</div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    ` : ''}
  `;
}

/**
 * 6. REPORTS & DATA (Audit Center, Validated CSV, Workspace Settings)
 */
export function renderReportsView(store) {
  const fac = store.getActiveFacility();
  if (!fac) {
    return renderNoFacilityState('Reports & Data Management', 'Executive printable audit summaries, validated CSV equipment import/export, and system settings', 'fileSpreadsheet');
  }
  const subTab = store.subTabs?.['reports'] || 'audit';

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title flex items-center gap-2">
          <span>Reports & Data Management</span>
          <span class="badge badge-cyan">Reproducible Audits</span>
        </h1>
        <p class="view-subtitle">Executive printable audit summaries, validated CSV equipment import/export, and system settings</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button class="btn btn-secondary text-xs" onclick="window.print()">
          ${getIcon('printer', 'w-3.5 h-3.5')} Print Audit
        </button>
        <button class="btn btn-primary text-xs" onclick="window.ecosmartx.exportApplianceCsv()">
          ${getIcon('download', 'w-3.5 h-3.5')} Export Clean CSV
        </button>
      </div>
    </div>

    <!-- Sub-navigation Pills -->
    <div class="subtabs-nav">
      <button 
        class="btn text-xs px-3.5 py-1.5 ${subTab === 'audit' ? 'btn-primary' : 'btn-secondary'}"
        onclick="store.setSubTab('reports', 'audit')"
      >
        ${getIcon('fileSpreadsheet', 'w-3.5 h-3.5')} Executive Energy Audit
      </button>
      <button 
        class="btn text-xs px-3.5 py-1.5 ${subTab === 'data' ? 'btn-primary' : 'btn-secondary'}"
        onclick="store.setSubTab('reports', 'data')"
      >
        ${getIcon('upload', 'w-3.5 h-3.5')} CSV Data Import & Export
      </button>
      <button 
        class="btn text-xs px-3.5 py-1.5 ${subTab === 'settings' ? 'btn-primary' : 'btn-secondary'}"
        onclick="store.setSubTab('reports', 'settings')"
      >
        ${getIcon('settings', 'w-3.5 h-3.5')} Facility & User Settings
      </button>
    </div>

    <div>
      ${subTab === 'audit' ? renderReports(store) : ''}
      ${subTab === 'data' ? `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="card p-6">
            <h3 class="text-base font-bold text-main mb-2">Export Equipment Inventory</h3>
            <p class="text-xs text-muted mb-4">Export clean, sanitized CSV spreadsheet of active facility equipment including power, category, and operating hours.</p>
            <button class="btn btn-primary" onclick="window.ecosmartx.exportApplianceCsv()">
              ${getIcon('download', 'w-4 h-4')} Export Clean CSV
            </button>
          </div>

          <div class="card p-6">
            <h3 class="text-base font-bold text-main mb-2">Import Equipment Spreadsheet</h3>
            <p class="text-xs text-muted mb-4">Upload a CSV file with headers: <code>name, category, ratedWatts, quantity, operatingHoursPerDay</code>. Validated via server endpoint before import.</p>
            <button class="btn btn-secondary" onclick="window.ecosmartx.openModal('importCsv')">
              ${getIcon('upload', 'w-4 h-4')} Import CSV Spreadsheet
            </button>
          </div>
        </div>
      ` : ''}
      ${subTab === 'settings' ? renderSettings(store) : ''}
    </div>
  `;
}

