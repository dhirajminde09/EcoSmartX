/**
 * EcoSmartX Vanilla JavaScript Application Driver
 * Fully integrated with Firebase Firestore & Google Calendar API
 */
import { store } from './state.js';
import { getIcon } from './utils/icons.js';
import { auth, getIdToken } from './services/firebase.js';
import {
  renderOverview,
  renderEnergySetup,
  renderAdvisorView,
  renderSimulatorView,
  renderActionPlanView,
  renderReportsView,
  renderDashboard,
  renderDigitalTwin,
  renderFacilities,
  renderAppliances,
  renderAnalytics,
  renderSimulation,
  renderScenarios,
  renderPredictive,
  renderForensics,
  renderOptimization,
  renderCopilot,
  renderAdvisor,
  renderTariffs,
  renderCarbon,
  renderChallenges,
  renderReports,
  renderSettings,
  formatCurrency,
  formatIndianNumber,
} from './views/views.js';
import { renderCalendar } from './views/calendarView.js';

// Global reference for inline event handlers
window.store = store;

// State for active modal, mobile menu, and sidebar collapsed
let activeModal = null;
let modalPayload = null;
window.ecosmartxSidebarCollapsed = false;

// Initialize EcoSmartX global helper namespace
window.ecosmartx = {
  navigateTo(tabId) {
    window.ecosmartxMobileOpen = false;
    store.setCurrentTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  openSettings() {
    this.navigateTo('settings');
  },

  toggleNavigation() {
    if (window.innerWidth <= 768) {
      window.ecosmartxMobileOpen = !window.ecosmartxMobileOpen;
    } else {
      window.ecosmartxSidebarCollapsed = !window.ecosmartxSidebarCollapsed;
    }
    renderApp();
  },

  toggleMobileMenu() {
    this.toggleNavigation();
  },

  closeMobileMenu() {
    window.ecosmartxMobileOpen = false;
    renderApp();
  },

  handleGlobalSearch(query) {
    if (!query || !query.trim()) return;
    const q = query.toLowerCase().trim();
    if (q.includes('setup') || q.includes('asset') || q.includes('equipment') || q.includes('room') || q.includes('appliance') || q.includes('twin') || q.includes('zone')) {
      this.navigateTo('energy-setup');
    } else if (q.includes('sim') || q.includes('solar') || q.includes('scenario') || q.includes('what-if') || q.includes('forecast') || q.includes('predict')) {
      this.navigateTo('simulator');
    } else if (q.includes('action') || q.includes('calendar') || q.includes('plan') || q.includes('dr') || q.includes('task') || q.includes('challenge')) {
      this.navigateTo('actions');
    } else if (q.includes('report') || q.includes('csv') || q.includes('export') || q.includes('import') || q.includes('audit') || q.includes('setting')) {
      this.navigateTo('reports');
    } else {
      this.navigateTo('advisor');
      setTimeout(() => {
        const input = document.getElementById('copilot-chat-input');
        if (input) {
          input.value = query;
          window.ecosmartx.handleCopilotSubmit();
        }
      }, 150);
    }
  },

  quickPrompt(promptText) {
    this.navigateTo('advisor');
    if (store.subTabs) store.subTabs['advisor'] = 'copilot';
    setTimeout(() => {
      const input = document.getElementById('copilot-chat-input');
      if (input) {
        input.value = promptText;
        window.ecosmartx.handleCopilotSubmit();
      }
    }, 150);
  },

  // Google Calendar and Authentication
  signInGoogle() {
    store.signInWithGoogle().catch(() => {});
  },

  signOutGoogle() {
    store.signOut();
  },

  syncCalendar() {
    store.syncGoogleCalendar();
  },

  setCalendarFilter(filter) {
    window.ecosmartxCalendarFilter = filter;
    renderApp();
  },

  quickSchedule(presetType) {
    const today = new Date();
    const todayYmd = today.toISOString().split('T')[0];
    const tomorrow = new Date(today.getTime() + 86400000);
    const tomorrowYmd = tomorrow.toISOString().split('T')[0];
    const nextWeek = new Date(today.getTime() + 6 * 86400000);
    const nextWeekYmd = nextWeek.toISOString().split('T')[0];

    if (presetType === 'peak_shaving') {
      store.createEnergyEvent({
        title: 'DISCOM Evening Peak Curtailment Window',
        eventType: 'peak_shaving',
        startTime: `${todayYmd}T18:00`,
        endTime: `${todayYmd}T22:00`,
        targetReductionKw: 45,
        description: 'Pre-cool building before 18:00 IST, then dial back non-critical chillers and elevator banks during DISCOM peak tariff hours (18:00–22:00 IST).',
      });
    } else if (presetType === 'maintenance') {
      store.createEnergyEvent({
        title: 'Chiller & Air Handler Preventative Inspection',
        eventType: 'maintenance',
        startTime: `${tomorrowYmd}T08:30`,
        endTime: `${tomorrowYmd}T11:30`,
        targetReductionKw: 0,
        description: 'Filter replacement, condenser coil chemical wash, and refrigerant pressure baseline check.',
      });
    } else if (presetType === 'energy_audit') {
      store.createEnergyEvent({
        title: 'Quarterly BEE ECBC Compliance Walkthrough Audit',
        eventType: 'energy_audit',
        startTime: `${nextWeekYmd}T09:00`,
        endTime: `${nextWeekYmd}T15:00`,
        targetReductionKw: 0,
        description: 'On-site engineering inspection of building envelope air leakage, BEE star equipment compliance, and sub-meter calibration.',
      });
    }
  },

  deleteEvent(id, title) {
    store.deleteEnergyEvent(id, title);
  },

  selectZone(zoneId) {
    window.ecosmartxSelectedZone = zoneId;
    renderApp();
  },

  toggleHeatmap() {
    window.ecosmartxHeatmapOn = !window.ecosmartxHeatmapOn;
    renderApp();
  },

  updateSimParam(param, value) {
    if (param === 'hvac') window.ecosmartxSimHvac = parseFloat(value);
    if (param === 'eff') window.ecosmartxSimEff = parseFloat(value);
    if (param === 'vampire') window.ecosmartxSimVampire = parseFloat(value);
    if (param === 'solar') window.ecosmartxSimSolar = parseFloat(value);
    if (param === 'budget') {
      window.ecosmartxSimBudget = parseFloat(value);
      const fac = store.getActiveFacility();
      if (fac) {
        fac.monthlyBudget = parseFloat(value);
        store.updateFacility(fac);
      }
    }
    renderApp();
  },

  saveCurrentSimulationAsScenario() {
    const fac = store.getActiveFacility();
    const hvacShift = window.ecosmartxSimHvac || 0;
    const effUpgrade = window.ecosmartxSimEff || 0;
    const vampireCut = window.ecosmartxSimVampire || 0;

    const modifiedFacility = {
      ...fac,
      appliances: fac.appliances.map(a => {
        let watts = a.ratedWatts;
        let standby = a.standbyWatts || 0;
        if (a.category === 'hvac' && hvacShift !== 0) {
          watts = Math.round(watts * (1 - hvacShift * 0.04));
        }
        if (effUpgrade > 0) {
          watts = Math.round(watts * (1 - effUpgrade / 100));
        }
        if (vampireCut > 0) {
          standby = Math.round(standby * (1 - vampireCut / 100));
        }
        return { ...a, ratedWatts: Math.max(1, watts), standbyWatts: Math.max(0, standby) };
      }),
    };

    const name = `Sim: ${effUpgrade}% Eff, ${hvacShift > 0 ? '+' : ''}${hvacShift}°C, ${vampireCut}% Vampire Cut`;
    store.createScenario(name, 'Generated from active simulation laboratory settings', modifiedFacility);
    this.navigateTo('scenarios');
  },

  applyScenarioAsFacility(scenId) {
    const scen = store.scenarios.find(s => s.id === scenId);
    if (scen && scen.modifiedFacility) {
      store.updateFacility({ ...scen.modifiedFacility, id: store.activeFacilityId });
      store.showNotification(`Applied scenario "${scen.name}" as active facility parameters!`, 'success');
      this.navigateTo('dashboard');
    }
  },

  deleteScenario(scenId) {
    if (confirm('Delete this saved scenario?')) {
      store.deleteScenario(scenId);
    }
  },

  updateAnomalyStatus(anomId, status) {
    store.updateAnomalyStatus(anomId, status);
  },

  toggleChallenge(chId) {
    store.toggleChallenge(chId);
  },

  setActionFilter(filter) {
    window.ecosmartxActionFilter = filter;
    renderApp();
  },

  updateActionStatus(actionId, status) {
    store.updateActionStatus(actionId, status);
  },

  scheduleActionToCalendar(actionId) {
    store.scheduleActionInCalendar(actionId);
  },

  addActionFromSim() {
    const fac = store.getActiveFacility();
    const metrics = store.getMetrics();
    const hvacShift = window.ecosmartxSimHvac || 0;
    const effUpgrade = window.ecosmartxSimEff || 0;
    const vampireCut = window.ecosmartxSimVampire || 0;
    const solarPvKw = window.ecosmartxSimSolar || 0;

    const hvacKwhSaved = (metrics.categoryBreakdown.hvac?.monthlyKwh || 0) * (hvacShift * 0.04);
    const effKwhSaved = (metrics.monthlyTotalKwh * (effUpgrade / 100));
    const vampireKwhSaved = (metrics.standbyWasteMonthlyKwh * (vampireCut / 100));
    const solarMonthlyKwhGen = solarPvKw * 135;

    const totalMonthlyKwhSaved = Math.max(25, Math.round(hvacKwhSaved + effKwhSaved + vampireKwhSaved + solarMonthlyKwhGen));
    const monthlyCostSavings = Math.max(10, Math.round(totalMonthlyKwhSaved * metrics.effectiveRatePerKwh));
    const emissionFactor = Number(fac.emissionFactorKgCo2PerKwh || fac.gridCarbonIntensityKgPerKwh || 0.72);
    const annualCo2Kg = Math.round(totalMonthlyKwhSaved * 12 * emissionFactor);

    let capitalCost = 0;
    if (effUpgrade > 0) capitalCost += effUpgrade * 3500; // ₹3,500 per % efficiency equipment upgrade
    if (solarPvKw > 0) capitalCost += solarPvKw * 45000; // ₹45,000 per kW rooftop solar in India
    if (vampireCut > 0) capitalCost += 15000; // ₹15,000 for smart timer switches / contactors

    const paybackMonths = capitalCost > 0 ? Math.round(capitalCost / monthlyCostSavings) : 0;
    const effort = (effUpgrade > 25 || solarPvKw > 0) ? 'High' : (effUpgrade > 10 || vampireCut > 30) ? 'Medium' : 'Low';

    const tags = [];
    if (hvacShift !== 0) tags.push(`${hvacShift > 0 ? '+' : ''}${hvacShift}°C HVAC`);
    if (effUpgrade > 0) tags.push(`${effUpgrade}% Efficiency`);
    if (vampireCut > 0) tags.push(`${vampireCut}% Standby Cut`);
    if (solarPvKw > 0) tags.push(`${solarPvKw} kW Solar PV`);
    const title = tags.length > 0 ? `Simulated Retrofit: ${tags.join(', ')}` : 'Comprehensive Efficiency Optimization';

    store.addActionItem({
      title,
      category: solarPvKw > 0 ? 'Solar PV' : effUpgrade > 0 ? 'Retrofit' : 'Operations',
      effort,
      capitalCost,
      estimatedMonthlyKwhSavings: totalMonthlyKwhSaved,
      estimatedMonthlyCostSavings: monthlyCostSavings,
      co2ReductionKgAnnual: annualCo2Kg,
      paybackMonths,
      confidence: 'High',
      description: `Grounded in What-If Simulation: yields ${formatIndianNumber(totalMonthlyKwhSaved)} kWh/mo avoided load (${formatCurrency(monthlyCostSavings, fac.currency)}/mo savings) and abates ${(annualCo2Kg/1000).toFixed(2)} MT CO₂e annually.`,
    });

    this.navigateTo('actions');
  },

  applyOptimizationSchedule() {
    const fac = store.getActiveFacility();
    if (!fac) {
      store.showNotification('Please configure a facility to generate optimization schedules.', 'error');
      return;
    }
    store.addActionItem({
      title: 'DISCOM ToD Peak Load Shift Schedule',
      category: 'Operations',
      effort: 'Low',
      capitalCost: 0,
      estimatedMonthlyKwhSavings: 0,
      estimatedMonthlyCostSavings: Math.round(fac.monthlyBudget ? fac.monthlyBudget * 0.08 : 3500),
      co2ReductionKgAnnual: 240,
      paybackMonths: 0,
      confidence: 'High',
      description: 'Shift high-draw batch processes (dishwashers, ovens, pump cycles) outside the 18:00–22:00 IST peak ToD tariff surcharge window.',
    });
    store.showNotification('Added ToD load shift measure to Conservation Action Plan.', 'success');
  },

  async sendCopilotPrompt(promptText) {
    const input = document.getElementById('copilot-input');
    if (input) input.value = promptText;
    await this.handleCopilotSubmit();
  },

  async handleCopilotSubmit() {
    const input = document.getElementById('copilot-input');
    const sendBtn = document.getElementById('copilot-send-btn');
    if (!input || !input.value.trim()) return;

    const userText = input.value.trim();
    input.value = '';

    if (!window.ecosmartxChatHistory) {
      window.ecosmartxChatHistory = [];
    }

    window.ecosmartxChatHistory.push({ role: 'user', content: userText });
    renderApp();

    if (sendBtn) sendBtn.disabled = true;

    // Security Enforcement: Require authenticated identity for Gemini Copilot
    if (!store.authUser || !auth.currentUser) {
      window.ecosmartxChatHistory.push({
        role: 'assistant',
        content: '🔒 **Authentication Required:** Please sign in with your Google Account using the "Sign in with Google" button to access the Gemini AI Energy Copilot.',
      });
      store.showNotification('Please sign in with Google to use Gemini AI Copilot', 'info');
      if (sendBtn) sendBtn.disabled = false;
      renderApp();
      return;
    }

    try {
      const fac = store.getActiveFacility();
      const metrics = store.getMetrics();

      if (!fac) {
        window.ecosmartxChatHistory.push({
          role: 'assistant',
          content: 'No active facility configured. Please register a facility in "My Energy Setup" to enable grounded AI energy analysis.',
        });
        return;
      }

      const idToken = await getIdToken();
      if (!idToken) {
        window.ecosmartxChatHistory.push({
          role: 'assistant',
          content: '🔒 **Authentication Error:** Could not obtain valid session token. Please sign in again.',
        });
        return;
      }

      const response = await fetch('/api/gemini/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          messages: window.ecosmartxChatHistory,
          facilityId: fac.id,
          facilityContext: {
            id: fac.id,
            ownerId: store.authUser.uid,
            name: fac.name,
            type: fac.type,
            floorAreaSqM: fac.floorAreaSqM,
            occupancy: fac.occupancy,
            monthlyTotalKwh: metrics ? metrics.monthlyTotalKwh : 0,
            monthlyCost: metrics ? metrics.monthlyCost : 0,
            currencySymbol: fac.currencySymbol || '₹',
            regionalStandards: 'BEE ECBC 2017 Commercial Star Rating & CEA Baseline v19 (0.72 kg CO2/kWh)',
            timezone: 'Asia/Kolkata (IST)',
            annualCo2Tonnes: metrics ? metrics.annualCo2Tonnes : 0,
            standbyWasteMonthlyKwh: metrics ? metrics.standbyWasteMonthlyKwh : 0,
            standbyWasteMonthlyCost: metrics ? metrics.standbyWasteMonthlyCost : 0,
            categoryBreakdown: metrics ? metrics.categoryBreakdown : {},
            activeAnomalies: store.getAnomalies().filter(a => a.status !== 'resolved'),
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429) {
          window.ecosmartxChatHistory.push({
            role: 'assistant',
            content: `⏳ **Rate Limit Notice:** ${data.error || 'Too many requests. Please wait a moment before sending another prompt.'}`,
          });
        } else if (response.status === 401) {
          window.ecosmartxChatHistory.push({
            role: 'assistant',
            content: `🔒 **Session Expired:** ${data.error || 'Your authentication session has expired. Please sign in again.'}`,
          });
        } else if (response.status === 403) {
          window.ecosmartxChatHistory.push({
            role: 'assistant',
            content: `🚫 **Access Denied:** ${data.error || 'You are not authorized to analyze this facility.'}`,
          });
        } else {
          window.ecosmartxChatHistory.push({
            role: 'assistant',
            content: `**Gemini Service Notice:** ${data.error || 'The Gemini AI service is currently unavailable.'}`,
          });
        }
      } else {
        window.ecosmartxChatHistory.push({
          role: 'assistant',
          content: data.reply || 'No analysis generated.',
        });
      }
    } catch (e) {
      window.ecosmartxChatHistory.push({
        role: 'assistant',
        content: `**Connection Error:** Unable to reach backend service (${e.message}). Please check server connectivity.`,
      });
    } finally {
      if (sendBtn) sendBtn.disabled = false;
      renderApp();
      const chatBox = document.getElementById('copilot-chat-box');
      if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    }
  },

  async refreshAdvisor() {
    // Security Enforcement: Require authenticated identity for Gemini Advisor
    if (!store.authUser || !auth.currentUser) {
      store.showNotification('Please sign in with Google to use Gemini AI Conservation Advisor', 'info');
      return;
    }

    const fac = store.getActiveFacility();
    const metrics = store.getMetrics();
    if (!fac || !metrics || metrics.monthlyTotalKwh === 0) {
      store.showNotification('Please register facility equipment to generate grounded recommendations.', 'error');
      return;
    }

    store.showNotification('Contacting Gemini AI Advisor...', 'info');
    try {
      const idToken = await getIdToken();
      if (!idToken) {
        store.showNotification('Authentication session expired. Please sign in again.', 'error');
        return;
      }

      const res = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          facilityId: fac.id,
          facilityContext: {
            id: fac.id,
            ownerId: store.authUser.uid,
            name: fac.name,
            type: fac.type,
            floorAreaSqM: fac.floorAreaSqM,
            occupancy: fac.occupancy,
            monthlyTotalKwh: metrics.monthlyTotalKwh,
            monthlyCost: metrics.monthlyCost,
            standbyWasteMonthlyKwh: metrics.standbyWasteMonthlyKwh,
            standbyWasteMonthlyCost: metrics.standbyWasteMonthlyCost,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          store.showNotification(data.error || 'Rate limit reached. Please wait before refreshing recommendations.', 'error');
        } else if (res.status === 401) {
          store.showNotification('Session expired. Please sign in again.', 'error');
        } else if (res.status === 403) {
          store.showNotification('Access denied for this facility record.', 'error');
        } else {
          store.showNotification(`AI Advisor: ${data.error || 'Gemini service unavailable'}`, 'error');
        }
        return;
      }
      if (data.recommendations && data.recommendations.length > 0) {
        window.ecosmartxAdvisorRecs = data.recommendations;
        store.showNotification('Updated energy conservation roadmap from Gemini AI.', 'success');
        renderApp();
      } else {
        store.showNotification('No new recommendations generated for this profile.', 'info');
      }
    } catch (err) {
      store.showNotification(`Advisor network error: ${err.message}`, 'error');
    }
  },

  implementRecommendation(recId) {
    store.showNotification(`Milestone action marked as implemented!`, 'success');
  },

  async exportApplianceCsv() {
    const fac = store.getActiveFacility();
    const rows = fac.appliances.map(a => ({
      Name: a.name,
      Category: a.category,
      ZoneId: a.roomId,
      RatedWatts: a.ratedWatts,
      Quantity: a.quantity,
      OperatingHoursPerDay: a.operatingHoursPerDay,
      OperatingDaysPerWeek: a.operatingDaysPerWeek || 7,
      UtilizationFactor: a.utilizationFactor || 1.0,
      StandbyWatts: a.standbyWatts || 0,
    }));

    try {
      const idToken = await getIdToken();
      const headers = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/export/csv', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: rows,
          filename: `${fac.name.toLowerCase().replace(/\s+/g, '-')}-equipment.csv`,
        }),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fac.name.toLowerCase().replace(/\s+/g, '-')}-equipment.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      store.showNotification('Exported sanitized CSV file successfully', 'success');
    } catch (e) {
      store.showNotification('Failed to export CSV', 'error');
    }
  },

  saveSettings() {
    const name = document.getElementById('setting-name')?.value;
    const email = document.getElementById('setting-email')?.value;
    const org = document.getElementById('setting-org')?.value;
    const role = document.getElementById('setting-role')?.value;

    store.updateUserProfile({ name, email, organization: org, role });
  },

  openModal(type, payload = null) {
    activeModal = type;
    modalPayload = payload;
    renderModal();
  },

  closeModal() {
    activeModal = null;
    modalPayload = null;
    renderModal();
  },

  deleteZone(roomId) {
    if (confirm('Delete this zone and all its equipment?')) {
      store.deleteRoom(roomId);
    }
  },

  deleteAppliance(appId) {
    if (confirm('Remove this equipment?')) {
      store.deleteAppliance(appId);
    }
  },

  deleteFacility(facId) {
    if (confirm('Are you sure you want to delete this facility?')) {
      store.deleteFacility(facId);
    }
  },
};

// Main DOM Render Function
function renderApp() {
  const root = document.getElementById('app-root');
  if (!root) return;

  const currentTab = store.currentTab;
  const activeFac = store.getActiveFacility();
  const authUser = store.authUser;
  const anomalies = store.getAnomalies ? store.getAnomalies().filter(a => a.status !== 'resolved') : [];

  // Canonical route mapping to keep active sidebar navigation 100% in sync
  const activeNavId = (() => {
    if (!currentTab || currentTab === 'dashboard' || currentTab === 'overview') return 'dashboard';
    if (['energy-setup', 'facilities', 'appliances', 'tariffs', 'digital_twin'].includes(currentTab)) return 'energy-setup';
    if (['advisor', 'copilot', 'forensics'].includes(currentTab)) return 'advisor';
    if (['simulator', 'simulation', 'scenarios', 'predictive'].includes(currentTab)) return 'simulator';
    if (['actions', 'calendar', 'challenges'].includes(currentTab)) return 'actions';
    if (['reports', 'audit', 'data', 'settings', 'optimization', 'analytics', 'carbon'].includes(currentTab)) return 'reports';
    return currentTab;
  })();

  // Consolidated 6 Primary Navigation Sections
  const navGroups = [
    {
      group: 'EcoSmartX Platform',
      items: [
        { id: 'dashboard', label: 'Overview', icon: 'overview' },
        { id: 'energy-setup', label: 'My Energy Setup', icon: 'cpu' },
        { id: 'advisor', label: 'AI Energy Advisor', icon: 'sparkles' },
        { id: 'simulator', label: 'Savings Simulator', icon: 'sliders' },
        { id: 'actions', label: 'Action Plan', icon: 'checkCircle' },
        { id: 'reports', label: 'Reports & Data', icon: 'fileSpreadsheet' },
      ],
    },
  ];

  // Dispatch current view
  let viewContent = '';
  switch (currentTab) {
    case 'dashboard':
    case 'overview':
      viewContent = renderOverview(store);
      break;
    case 'energy-setup':
      viewContent = renderEnergySetup(store);
      break;
    case 'advisor':
      viewContent = renderAdvisorView(store);
      break;
    case 'simulator':
    case 'simulation':
      viewContent = renderSimulatorView(store);
      break;
    case 'actions':
      viewContent = renderActionPlanView(store, renderCalendar);
      break;
    case 'reports':
      viewContent = renderReportsView(store);
      break;

    // Direct / Backwards-compatible deep routes (activates corresponding sub-tab)
    case 'facilities':
      if (store.subTabs) store.subTabs['energy-setup'] = 'facilities';
      viewContent = renderEnergySetup(store);
      break;
    case 'appliances':
      if (store.subTabs) store.subTabs['energy-setup'] = 'appliances';
      viewContent = renderEnergySetup(store);
      break;
    case 'tariffs':
      if (store.subTabs) store.subTabs['energy-setup'] = 'tariffs';
      viewContent = renderEnergySetup(store);
      break;
    case 'digital_twin':
      if (store.subTabs) store.subTabs['energy-setup'] = 'digital_twin';
      viewContent = renderEnergySetup(store);
      break;
    case 'copilot':
      if (store.subTabs) store.subTabs['advisor'] = 'copilot';
      viewContent = renderAdvisorView(store);
      break;
    case 'forensics':
      if (store.subTabs) store.subTabs['advisor'] = 'forensics';
      viewContent = renderAdvisorView(store);
      break;
    case 'scenarios':
      if (store.subTabs) store.subTabs['simulator'] = 'scenarios';
      viewContent = renderSimulatorView(store);
      break;
    case 'predictive':
      if (store.subTabs) store.subTabs['simulator'] = 'predictive';
      viewContent = renderSimulatorView(store);
      break;
    case 'calendar':
      if (store.subTabs) store.subTabs['actions'] = 'calendar';
      viewContent = renderActionPlanView(store, renderCalendar);
      break;
    case 'challenges':
      if (store.subTabs) store.subTabs['actions'] = 'challenges';
      viewContent = renderActionPlanView(store, renderCalendar);
      break;
    case 'optimization':
      viewContent = renderOptimization(store);
      break;
    case 'analytics':
      viewContent = renderAnalytics(store);
      break;
    case 'carbon':
      viewContent = renderCarbon(store);
      break;
    case 'settings':
      if (store.subTabs) store.subTabs['reports'] = 'settings';
      viewContent = renderReportsView(store);
      break;
    default:
      viewContent = renderOverview(store);
      break;
  }

  // Authentication-aware user profile resolution for sidebar (Strict Zero-Demo-Data / No Fabricated Identity)
  const isAuthLoading = !!store.authLoading;
  const isGuest = !authUser;

  let sidebarUserAvatarHtml = '';
  let sidebarUserName = '';
  let sidebarUserSub = '';
  let sidebarUserTooltip = '';
  let initials = 'G';

  if (isAuthLoading && !authUser) {
    // Session restoration state (subtle, avoid flickering between Guest and Authenticated)
    sidebarUserName = 'Authenticating...';
    sidebarUserSub = 'Verifying session';
    sidebarUserTooltip = 'EcoSmartX Session Verification';
    sidebarUserAvatarHtml = `
      <div class="sidebar-avatar sidebar-avatar-neutral" title="Verifying session">
        ${getIcon('user', 'w-4 h-4 text-slate-400')}
      </div>
    `;
  } else if (authUser) {
    // Authenticated user: display real name, real photo/initials, and verified role or account label
    sidebarUserName = authUser.displayName || (authUser.email ? authUser.email.split('@')[0] : 'User');
    
    // Only display assigned role when verified through permissions/profile, never invent 'Facility Manager'
    const verifiedRole = (store.userProfile && store.userProfile.roleVerified && store.userProfile.role)
      ? store.userProfile.role
      : null;
    sidebarUserSub = verifiedRole || 'Google Account';
    sidebarUserTooltip = `${escapeHtml(sidebarUserName)} (${escapeHtml(sidebarUserSub)})`;

    // Calculate genuine initials
    const parts = (sidebarUserName || 'User').trim().split(/\s+/);
    initials = parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : (sidebarUserName || 'U').slice(0, 2).toUpperCase();

    if (authUser.photoURL) {
      sidebarUserAvatarHtml = `
        <div class="sidebar-avatar sidebar-avatar-photo" title="${escapeHtml(sidebarUserName)}">
          <img 
            src="${escapeHtml(authUser.photoURL)}" 
            alt="${escapeHtml(sidebarUserName)}" 
            class="sidebar-avatar-img" 
            referrerpolicy="no-referrer"
            onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';"
          />
          <span class="sidebar-avatar-initials" style="display:none;">${initials}</span>
        </div>
      `;
    } else {
      sidebarUserAvatarHtml = `
        <div class="sidebar-avatar sidebar-avatar-initials" title="${escapeHtml(sidebarUserName)}">
          ${initials}
        </div>
      `;
    }
  } else {
    // Unauthenticated visitor (Strictly "Guest User" and "Not signed in", no fake Local User / Facility Manager)
    sidebarUserName = 'Guest User';
    sidebarUserSub = 'Not signed in';
    sidebarUserTooltip = 'Guest User (Not signed in) — Click to Sign In';
    initials = 'G';
    sidebarUserAvatarHtml = `
      <div class="sidebar-avatar sidebar-avatar-neutral" title="Guest User">
        ${getIcon('user', 'w-4 h-4 text-slate-300')}
      </div>
    `;
  }

  root.innerHTML = `
    <!-- Mobile Backdrop Overlay -->
    <div class="mobile-overlay ${window.ecosmartxMobileOpen ? 'active' : ''}" onclick="window.ecosmartx.closeMobileMenu()"></div>

    <!-- Sidebar Navigation (Midnight Navy #071827) -->
    <aside class="sidebar ${window.ecosmartxMobileOpen ? 'mobile-open' : ''} ${window.ecosmartxSidebarCollapsed ? 'sidebar-collapsed' : ''}" aria-label="Main Navigation">
      <!-- A. Branding Header -->
      <div class="sidebar-header">
        <div class="sidebar-brand" onclick="window.ecosmartx.navigateTo('dashboard')" title="EcoSmartX Platform Overview" role="button" tabindex="0" onkeydown="if(event.key === 'Enter') window.ecosmartx.navigateTo('dashboard')">
          <img src="/assets/ecosmartx-logo-dark.png" alt="EcoSmartX Energy Intelligence" class="sidebar-logo-full" />
          <img src="/assets/ecosmartx-emblem-dark.png" alt="EcoSmartX" class="sidebar-logo-compact" />
        </div>
        <button class="btn-icon-dark mobile-close-btn" onclick="window.ecosmartx.closeMobileMenu()" aria-label="Close Navigation Menu">
          ${getIcon('x', 'w-4 h-4')}
        </button>
      </div>

      <!-- B. Active Facility Section (Compact Enterprise Selector, No Prominent +Add Button) -->
      <div class="sidebar-facility-section">
        ${activeFac ? `
          <div class="sidebar-facility-card ${store.facilities.length > 1 ? 'has-dropdown' : ''}" title="${escapeHtml(activeFac.name)} (${escapeHtml(activeFac.type || 'Commercial')})">
            <div class="sidebar-facility-icon">
              ${getIcon('building', 'w-4 h-4')}
            </div>
            <div class="sidebar-facility-info min-w-0 flex-1">
              <span class="sidebar-facility-badge">ACTIVE FACILITY</span>
              <div class="sidebar-facility-name truncate">${escapeHtml(activeFac.name)}</div>
            </div>
            ${store.facilities.length > 1 ? `
              <div class="sidebar-facility-select-container">
                <select 
                  class="sidebar-facility-native-select" 
                  onchange="store.setActiveFacilityId(this.value)" 
                  title="Switch Active Facility"
                  aria-label="Switch Active Facility"
                >
                  ${store.facilities.map(f => `
                    <option value="${f.id}" ${f.id === activeFac.id ? 'selected' : ''}>${escapeHtml(f.name)}</option>
                  `).join('')}
                </select>
                <span class="sidebar-facility-chevron">${getIcon('chevronDown', 'w-3 h-3')}</span>
              </div>
            ` : `
              <span class="sidebar-facility-dot active" title="Active"></span>
            `}
            <div class="sidebar-facility-tooltip">${escapeHtml(activeFac.name)}</div>
          </div>
        ` : `
          <div class="sidebar-facility-card empty" title="No facility registered. Register a facility via the topbar or Overview.">
            <div class="sidebar-facility-icon empty">
              ${getIcon('building', 'w-4 h-4')}
            </div>
            <div class="sidebar-facility-info min-w-0 flex-1">
              <span class="sidebar-facility-badge empty">FACILITY STATUS</span>
              <div class="sidebar-facility-name empty truncate">No facility registered</div>
            </div>
            <span class="sidebar-facility-dot empty" title="Setup Required"></span>
            <div class="sidebar-facility-tooltip">No facility registered</div>
          </div>
        `}
      </div>

      <!-- C. Navigation Section (6 Core Modules, Balanced Spacing & Active Pill) -->
      <nav class="sidebar-nav" aria-label="Sidebar Menu">
        <div class="sidebar-nav-list">
          ${navGroups[0].items.map(item => {
            const isActive = activeNavId === item.id;
            return `
              <button 
                class="nav-link ${isActive ? 'active' : ''}" 
                onclick="window.ecosmartx.navigateTo('${item.id}')"
                title="${item.label}"
                aria-label="${item.label}"
                aria-current="${isActive ? 'page' : 'false'}"
              >
                <span class="nav-icon-wrapper">${getIcon(item.icon, 'w-4.5 h-4.5')}</span>
                <span class="nav-label">${item.label}</span>
                <span class="nav-tooltip">${item.label}</span>
              </button>
            `;
          }).join('')}
        </div>
      </nav>

      <!-- D. Bottom User Profile Section (Authentication-Aware: Guest vs Authenticated) -->
      ${isGuest ? `
        <div class="sidebar-footer is-guest">
          <div 
            class="sidebar-user-tile guest-tile" 
            onclick="window.ecosmartx.signInGoogle()" 
            title="${escapeHtml(sidebarUserTooltip)}"
            role="button"
            tabindex="0"
            onkeydown="if(event.key === 'Enter') window.ecosmartx.signInGoogle()"
          >
            ${sidebarUserAvatarHtml}
            <div class="sidebar-user-details min-w-0 flex-1">
              <div class="sidebar-user-name truncate">${escapeHtml(sidebarUserName)}</div>
              <div class="sidebar-user-role truncate text-slate-400">${escapeHtml(sidebarUserSub)}</div>
            </div>
            <div class="sidebar-user-tooltip">${escapeHtml(sidebarUserTooltip)}</div>
          </div>
          <button 
            class="sidebar-signin-btn" 
            onclick="window.ecosmartx.signInGoogle()" 
            title="Sign in with Google"
            aria-label="Sign in with Google"
          >
            ${getIcon('logIn', 'w-3.5 h-3.5 shrink-0')}
            <span class="sidebar-signin-label">Sign In</span>
            <span class="sidebar-settings-tooltip">Sign In</span>
          </button>
        </div>
      ` : `
        <div class="sidebar-footer is-authenticated">
          <div 
            class="sidebar-user-tile authenticated-tile" 
            onclick="window.ecosmartx.navigateTo('settings')" 
            title="${escapeHtml(sidebarUserTooltip)}"
            role="button"
            tabindex="0"
            onkeydown="if(event.key === 'Enter') window.ecosmartx.navigateTo('settings')"
          >
            ${sidebarUserAvatarHtml}
            <div class="sidebar-user-details min-w-0 flex-1">
              <div class="sidebar-user-name truncate">${escapeHtml(sidebarUserName)}</div>
              <div class="sidebar-user-role truncate ${authUser ? 'text-emerald-light' : ''}">${escapeHtml(sidebarUserSub)}</div>
            </div>
            <div class="sidebar-user-tooltip">${escapeHtml(sidebarUserTooltip)}</div>
          </div>
          <div class="sidebar-footer-actions">
            <button 
              class="sidebar-settings-btn" 
              onclick="window.ecosmartx.navigateTo('settings')" 
              title="Profile & Platform Settings"
              aria-label="Profile and Platform Settings"
            >
              ${getIcon('settings', 'w-3.5 h-3.5')}
              <span class="sidebar-settings-tooltip">Platform Settings</span>
            </button>
            <button 
              class="sidebar-signout-btn" 
              onclick="window.ecosmartx.signOutGoogle()" 
              title="Sign out of EcoSmartX"
              aria-label="Sign out"
            >
              ${getIcon('logOut', 'w-3.5 h-3.5')}
              <span class="sidebar-settings-tooltip">Sign Out</span>
            </button>
          </div>
        </div>
      `}
    </aside>

    <!-- Main Content Area -->
    <div class="main-wrapper ${window.ecosmartxSidebarCollapsed ? 'sidebar-collapsed' : ''}">
      <!-- Top SaaS Header (Polished Reference Layout) -->
      <header class="top-header">
        <!-- Left: Hamburger + Global Search -->
        <div class="flex items-center gap-3 min-w-0 flex-1 mr-4">
          <button 
            id="nav-toggle-btn"
            class="btn btn-secondary mobile-menu-btn" 
            onclick="window.ecosmartx.toggleNavigation()" 
            aria-label="${window.ecosmartxMobileOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}"
            aria-expanded="${window.ecosmartxMobileOpen ? 'true' : (window.ecosmartxSidebarCollapsed ? 'false' : 'true')}"
            title="${window.ecosmartxSidebarCollapsed ? 'Expand sidebar' : 'Collapse navigation'}"
          >
            ${getIcon('menu', 'w-4 h-4')}
          </button>

          <!-- Mobile Brand Lockup (visible only on mobile <= 768px) -->
          <div class="flex md:hidden items-center gap-1.5 cursor-pointer shrink-0" onclick="window.ecosmartx.navigateTo('dashboard')" title="EcoSmartX">
            <img src="/assets/ecosmartx-logo-dark.png" alt="EcoSmartX" class="mobile-brand-logo" />
          </div>

          <!-- Desktop Global Search with Ctrl+K shortcut -->
          <div class="header-search-wrapper hidden md:flex">
            <span class="header-search-icon">${getIcon('search', 'w-4 h-4')}</span>
            <input 
              type="text" 
              id="global-search-input"
              class="header-search-input" 
              placeholder="Search facilities, assets, reports or ask anything..."
              onkeydown="if(event.key === 'Enter') window.ecosmartx.handleGlobalSearch(this.value)"
            />
            <span class="header-search-shortcut">Ctrl K</span>
          </div>
        </div>

        <!-- Right: Facility Context, Theme, Alerts, & User Profile -->
        <div class="flex items-center gap-2.5 shrink-0">
          <!-- Facility Context Pill -->
          ${activeFac ? `
            <div class="header-facility-pill" onclick="window.ecosmartx.navigateTo('energy-setup')" title="${escapeHtml(activeFac.name)} — ${(activeFac.floorAreaSqM || 0).toLocaleString()} m² • ${activeFac.occupancy || 0} Occupants">
              <div class="facility-pill-icon">
                ${getIcon('building', 'w-3.5 h-3.5')}
              </div>
              <div class="facility-pill-text hidden sm:block">
                <div class="facility-pill-name truncate">${escapeHtml(activeFac.name)}</div>
                <div class="facility-pill-sub truncate">${activeFac.city ? escapeHtml(activeFac.city) : `${(activeFac.floorAreaSqM || 0).toLocaleString()} m²`}</div>
              </div>
              <span class="facility-pill-chevron hidden sm:flex">${getIcon('chevronDown', 'w-3 h-3')}</span>
            </div>
          ` : `
            <div class="header-facility-pill" onclick="window.ecosmartx.openModal('addFacility')" title="Register a new facility">
              <div class="facility-pill-icon" style="background: var(--amber-light); color: var(--amber);">
                ${getIcon('building', 'w-3.5 h-3.5')}
              </div>
              <div class="facility-pill-text hidden sm:block">
                <div class="facility-pill-name truncate">Setup Required</div>
                <div class="facility-pill-sub truncate">No facility registered</div>
              </div>
              <span class="facility-pill-chevron hidden sm:flex">${getIcon('plus', 'w-3 h-3')}</span>
            </div>
          `}

          <!-- Theme / Sun Icon Button -->
          <button class="header-icon-btn hidden sm:inline-flex" title="EcoSmartX Light Theme Active" onclick="store.showNotification('EcoSmartX High-Contrast SaaS Theme Active', 'info')">
            ${getIcon('sun', 'w-4 h-4')}
          </button>

          <!-- Notification Bell Icon Button with Anomaly Counter Badge -->
          <button class="header-icon-btn relative" title="Operational Alerts & Waste Forensics" onclick="window.ecosmartx.navigateTo('advisor')">
            ${getIcon('bell', 'w-4 h-4')}
            ${anomalies.length > 0 ? `<span class="notification-badge">${anomalies.length}</span>` : ''}
          </button>

          <!-- User Profile Pill (Authentication-Aware: Zero Fabricated Identity) -->
          <div 
            class="header-user-pill cursor-pointer" 
            onclick="${isGuest ? 'window.ecosmartx.signInGoogle()' : 'window.ecosmartx.openSettings()'}" 
            title="${escapeHtml(sidebarUserName)} (${escapeHtml(sidebarUserSub)})"
            role="button"
            tabindex="0"
          >
            ${isGuest ? `
              <div class="user-avatar-badge bg-slate-700 text-slate-300">
                ${getIcon('user', 'w-3.5 h-3.5')}
              </div>
            ` : authUser && authUser.photoURL ? `
              <img src="${escapeHtml(authUser.photoURL)}" alt="${escapeHtml(sidebarUserName)}" class="w-7 h-7 rounded-full object-cover border border-emerald" referrerpolicy="no-referrer" onerror="this.style.display='none'" />
            ` : `
              <div class="user-avatar-badge">${initials}</div>
            `}
            <div class="user-info-text hidden xl:block">
              <div class="user-name truncate">${escapeHtml(sidebarUserName)}</div>
              <div class="user-role truncate ${authUser ? 'text-emerald' : ''}">${escapeHtml(sidebarUserSub)}</div>
            </div>
          </div>
        </div>
      </header>

      <!-- Mobile Facility Bar (Accessible sub-header on mobile <= 768px) -->
      ${activeFac ? `
        <div class="mobile-facility-bar md:hidden flex items-center justify-between px-3 py-2 bg-surface border-b border-subtle">
          <div class="flex items-center gap-2 flex-1 min-w-0 mr-2">
            <span class="badge badge-emerald text-[10px] shrink-0">Facility</span>
            <select class="form-control text-xs py-1 px-2 border-subtle bg-surface-alt font-medium truncate" onchange="store.setActiveFacilityId(this.value)">
              ${store.facilities.map(f => `
                <option value="${f.id}" ${f.id === activeFac.id ? 'selected' : ''}>${escapeHtml(f.name)}</option>
              `).join('')}
            </select>
          </div>
          <span class="text-xs text-muted font-mono shrink-0">${(activeFac.floorAreaSqM || 0).toLocaleString()} m²</span>
        </div>
      ` : `
        <div class="mobile-facility-bar md:hidden flex items-center justify-between px-3 py-2 bg-surface border-b border-subtle">
          <span class="text-xs text-muted">No facility registered</span>
          <button class="btn btn-primary text-xs py-0.5 px-2" onclick="window.ecosmartx.openModal('addFacility')">+ Add Facility</button>
        </div>
      `}

      <!-- View Container -->
      <main id="app-view" class="content-container">
        ${viewContent}
      </main>
    </div>

    <!-- Notification Toast -->
    ${store.notification ? `
      <div class="toast toast-${store.notification.type}">
        ${getIcon(store.notification.type === 'error' ? 'alertCircle' : 'checkCircle', 'w-4 h-4')}
        <span>${escapeHtml(store.notification.message)}</span>
      </div>
    ` : ''}

    <!-- Modal Container -->
    <div id="modal-container"></div>
  `;

  renderModal();
}

// Render dynamic modals
function renderModal() {
  const container = document.getElementById('modal-container');
  if (!container) return;

  if (!activeModal) {
    container.innerHTML = '';
    return;
  }

  const fac = store.getActiveFacility();
  let modalContent = '';

  if (activeModal === 'scheduleEvent') {
    const today = new Date().toISOString().split('T')[0];
    modalContent = `
      <div class="modal-backdrop" onclick="if(event.target === this) window.ecosmartx.closeModal()">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Schedule Google Calendar Energy Event</h3>
            <button class="modal-close" onclick="window.ecosmartx.closeModal()">&times;</button>
          </div>
          <div class="modal-body space-y-4">
            <div>
              <label class="form-label">Event Title</label>
              <input id="new-evt-title" type="text" class="form-control" placeholder="e.g. DISCOM Peak Demand Shaving Window" value="DISCOM Peak Demand Shaving Window (18:00–22:00 IST)" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="form-label">Category</label>
                <select id="new-evt-type" class="form-control">
                  <option value="peak_shaving">Peak Shaving</option>
                  <option value="demand_response">Demand Response</option>
                  <option value="maintenance">HVAC / Equipment Maintenance</option>
                  <option value="energy_audit">BEE / ECBC Energy Audit Walkthrough</option>
                </select>
              </div>
              <div>
                <label class="form-label">Target Curtailment (kW)</label>
                <input id="new-evt-kw" type="number" class="form-control" value="45" />
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="form-label">Start Time</label>
                <input id="new-evt-start" type="datetime-local" class="form-control" value="${today}T18:00" />
              </div>
              <div>
                <label class="form-label">End Time</label>
                <input id="new-evt-end" type="datetime-local" class="form-control" value="${today}T22:00" />
              </div>
            </div>
            <div>
              <label class="form-label">Curtailment Notes / Operational Protocol</label>
              <textarea id="new-evt-desc" class="form-control text-xs" rows="3" placeholder="Specify thermostat setpoints, chiller curtailment, or maintenance tasks...">Thermostat setpoint reset to 24°C / 26°C (BEE standard), chiller unloading, and elevator bank consolidation during DISCOM evening peak tariff.</textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.ecosmartx.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="handleScheduleEventSubmit()">
              Schedule & Sync to Google Calendar
            </button>
          </div>
        </div>
      </div>
    `;
  } else if (activeModal === 'addFacility') {
    modalContent = `
      <div class="modal-backdrop" onclick="if(event.target === this) window.ecosmartx.closeModal()">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Create New Facility</h3>
            <button class="modal-close" onclick="window.ecosmartx.closeModal()">&times;</button>
          </div>
          <div class="modal-body space-y-4">
            <div>
              <label class="form-label">Facility Name</label>
              <input id="new-fac-name" type="text" class="form-control" placeholder="e.g. Horizon Innovation Center" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="form-label">Facility Type</label>
                <select id="new-fac-type" class="form-control">
                  <option value="Commercial">Commercial Office</option>
                  <option value="Industrial">Industrial Plant</option>
                  <option value="Healthcare">Healthcare & Labs</option>
                  <option value="DataCenter">Data Center</option>
                </select>
              </div>
              <div>
                <label class="form-label">Floor Area (m²)</label>
                <input id="new-fac-area" type="number" class="form-control" value="2500" />
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="form-label">Occupancy (Persons)</label>
                <input id="new-fac-occ" type="number" class="form-control" value="80" />
              </div>
              <div>
                <label class="form-label">Grid Factor (kg CO₂/kWh - CEA Baseline)</label>
                <input id="new-fac-grid" type="number" step="0.05" class="form-control" value="0.72" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.ecosmartx.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="handleCreateFacilitySubmit()">Create Facility</button>
          </div>
        </div>
      </div>
    `;
  } else if (activeModal === 'addZone') {
    modalContent = `
      <div class="modal-backdrop" onclick="if(event.target === this) window.ecosmartx.closeModal()">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Add New Zone</h3>
            <button class="modal-close" onclick="window.ecosmartx.closeModal()">&times;</button>
          </div>
          <div class="modal-body space-y-4">
            <div>
              <label class="form-label">Zone Name</label>
              <input id="new-zone-name" type="text" class="form-control" placeholder="e.g. Research Laboratory" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="form-label">Zone Category</label>
                <select id="new-zone-type" class="form-control">
                  <option value="Office">Office</option>
                  <option value="DataCenter">Data Center</option>
                  <option value="Mechanical">Mechanical / HVAC</option>
                  <option value="Common">Cafeteria / Common</option>
                  <option value="Logistics">Logistics Bay</option>
                </select>
              </div>
              <div>
                <label class="form-label">Floor Area (m²)</label>
                <input id="new-zone-area" type="number" class="form-control" value="120" />
              </div>
            </div>
            <div>
              <label class="form-label">Target Cooling Setpoint (°C)</label>
              <input id="new-zone-temp" type="number" class="form-control" value="22" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.ecosmartx.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="handleAddZoneSubmit()">Add Zone</button>
          </div>
        </div>
      </div>
    `;
  } else if (activeModal === 'addAppliance') {
    if (!fac) {
      modalContent = `
        <div class="modal-backdrop" onclick="if(event.target === this) window.ecosmartx.closeModal()">
          <div class="modal-card">
            <div class="modal-header">
              <h3 class="modal-title">Setup Required</h3>
              <button class="modal-close" onclick="window.ecosmartx.closeModal()">&times;</button>
            </div>
            <div class="modal-body text-center py-6">
              <p class="text-sm text-secondary mb-4">You need to register a facility before adding equipment assets.</p>
              <button class="btn btn-primary" onclick="window.ecosmartx.openModal('addFacility')">
                ${getIcon('plus', 'w-4 h-4')} <span>Register Facility</span>
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      modalContent = `
        <div class="modal-backdrop" onclick="if(event.target === this) window.ecosmartx.closeModal()">
          <div class="modal-card">
            <div class="modal-header">
              <h3 class="modal-title">Add Equipment Asset</h3>
              <button class="modal-close" onclick="window.ecosmartx.closeModal()">&times;</button>
            </div>
            <div class="modal-body space-y-4">
              <div>
                <label class="form-label">Asset Name</label>
                <input id="app-name" type="text" class="form-control" placeholder="e.g. Server Rack PDU" />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="form-label">Category</label>
                  <select id="app-cat" class="form-control">
                    <option value="hvac">HVAC System</option>
                    <option value="lighting">Lighting</option>
                    <option value="it_compute">IT / Compute</option>
                    <option value="refrigeration">Refrigeration</option>
                    <option value="machinery">Machinery</option>
                    <option value="plug_load">Plug Load</option>
                  </select>
                </div>
                <div>
                  <label class="form-label">Zone</label>
                  <select id="app-zone" class="form-control">
                    ${(fac.rooms || []).map(r => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('')}
                    ${(!fac.rooms || fac.rooms.length === 0) ? `<option value="room-1">Main Zone</option>` : ''}
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="form-label">Rated Watts (W)</label>
                  <input id="app-watts" type="number" class="form-control" value="500" />
                </div>
                <div>
                  <label class="form-label">Quantity</label>
                  <input id="app-qty" type="number" class="form-control" value="1" />
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="form-label">Operating Hours/Day (0-24)</label>
                  <input id="app-hours" type="number" step="0.5" class="form-control" value="10" />
                </div>
                <div>
                  <label class="form-label">Standby Vampire Draw (W)</label>
                  <input id="app-standby" type="number" class="form-control" value="0" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" onclick="window.ecosmartx.closeModal()">Cancel</button>
              <button class="btn btn-primary" onclick="handleAddApplianceSubmit()">Save Equipment</button>
            </div>
          </div>
        </div>
      `;
    }
  } else if (activeModal === 'importCsv') {
    modalContent = `
      <div class="modal-backdrop" onclick="if(event.target === this) window.ecosmartx.closeModal()">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Import Equipment CSV</h3>
            <button class="modal-close" onclick="window.ecosmartx.closeModal()">&times;</button>
          </div>
          <div class="modal-body space-y-4">
            <p class="text-xs text-muted">Paste your CSV content with columns: <code>name, category, ratedWatts, quantity, operatingHoursPerDay, standbyWatts</code></p>
            <textarea id="import-csv-text" class="form-control font-mono text-xs" rows="8" placeholder="name,category,ratedWatts,quantity,operatingHoursPerDay,standbyWatts&#10;LED Strip 40W,lighting,40,25,12,0&#10;Thermal Oven,machinery,3500,2,6,45"></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.ecosmartx.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="handleImportCsvSubmit()">Validate & Import</button>
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = modalContent;
}

// Modal Handlers
window.handleScheduleEventSubmit = () => {
  const title = document.getElementById('new-evt-title')?.value.trim();
  const eventType = document.getElementById('new-evt-type')?.value;
  const kw = parseFloat(document.getElementById('new-evt-kw')?.value) || 0;
  const startTime = document.getElementById('new-evt-start')?.value;
  const endTime = document.getElementById('new-evt-end')?.value;
  const description = document.getElementById('new-evt-desc')?.value.trim();

  if (!title) {
    store.showNotification('Please enter an event title', 'error');
    return;
  }
  if (!startTime || !endTime) {
    store.showNotification('Please provide start and end times', 'error');
    return;
  }

  store.createEnergyEvent({
    title,
    eventType,
    targetReductionKw: kw,
    startTime,
    endTime,
    description,
  });

  window.ecosmartx.closeModal();
};

window.handleCreateFacilitySubmit = () => {
  const name = document.getElementById('new-fac-name')?.value.trim();
  const type = document.getElementById('new-fac-type')?.value;
  const area = parseFloat(document.getElementById('new-fac-area')?.value) || 1000;
  const occ = parseInt(document.getElementById('new-fac-occ')?.value, 10) || 40;
  const grid = parseFloat(document.getElementById('new-fac-grid')?.value) || 0.72;

  if (!name) {
    store.showNotification('Please enter a facility name', 'error');
    return;
  }

  store.createFacility({
    name,
    type,
    floorAreaSqM: area,
    occupancy: occ,
    gridCarbonIntensityKgPerKwh: grid || 0.72,
    currency: 'INR',
    currencySymbol: '₹',
    utilityTariff: { name: 'HT-2a Commercial ToD', flatRate: 8.50, peakRate: 9.80, offPeakRate: 6.20, peakStartHour: 18, peakEndHour: 22, demandChargePerKw: 260 },
    rooms: [
      { id: 'room-1', name: 'Main Zone', type: 'Office', floorAreaSqM: area, targetTemperatureC: 22 },
    ],
    appliances: [],
  });

  window.ecosmartx.closeModal();
};

window.handleAddZoneSubmit = () => {
  const name = document.getElementById('new-zone-name')?.value.trim();
  const type = document.getElementById('new-zone-type')?.value;
  const area = parseFloat(document.getElementById('new-zone-area')?.value) || 50;
  const temp = parseFloat(document.getElementById('new-zone-temp')?.value) || 22;

  if (!name) {
    store.showNotification('Please provide a zone name', 'error');
    return;
  }

  store.addRoom({ name, type, floorAreaSqM: area, targetTemperatureC: temp });
  window.ecosmartx.closeModal();
};

window.handleAddApplianceSubmit = () => {
  const name = document.getElementById('app-name')?.value.trim();
  const category = document.getElementById('app-cat')?.value;
  const roomId = document.getElementById('app-zone')?.value;
  const ratedWatts = parseFloat(document.getElementById('app-watts')?.value) || 100;
  const quantity = parseInt(document.getElementById('app-qty')?.value, 10) || 1;
  const hours = parseFloat(document.getElementById('app-hours')?.value) || 8;
  const standby = parseFloat(document.getElementById('app-standby')?.value) || 0;

  if (!name) {
    store.showNotification('Please provide an asset name', 'error');
    return;
  }

  store.addAppliance({
    name,
    category,
    roomId,
    ratedWatts,
    quantity,
    operatingHoursPerDay: hours,
    operatingDaysPerWeek: 7,
    utilizationFactor: 1.0,
    standbyWatts: standby,
  });

  window.ecosmartx.closeModal();
};

window.handleImportCsvSubmit = async () => {
  const csvText = document.getElementById('import-csv-text')?.value;
  if (!csvText || !csvText.trim()) {
    store.showNotification('Please enter CSV data', 'error');
    return;
  }

  try {
    const idToken = await getIdToken();
    const headers = { 'Content-Type': 'application/json' };
    if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

    const res = await fetch('/api/import/validate', {
      method: 'POST',
      headers,
      body: JSON.stringify({ csvText }),
    });

    const data = await res.json();
    if (!data.valid) {
      store.showNotification(`CSV Error: ${data.error || 'Invalid CSV columns'}`, 'error');
      return;
    }

    const fac = store.getActiveFacility();
    const defaultRoomId = fac.rooms[0]?.id || 'room-1';
    data.validRows.forEach(row => {
      store.addAppliance({ ...row, roomId: defaultRoomId });
    });

    store.showNotification(`Successfully imported ${data.validRowCount} equipment assets!`, 'success');
    window.ecosmartx.closeModal();
  } catch (err) {
    store.showNotification('Failed to validate CSV with server', 'error');
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Keyboard accessibility for drawer, modals & global search (Ctrl+K)
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (activeModal) {
      window.ecosmartx.closeModal();
    } else if (window.ecosmartxMobileOpen) {
      window.ecosmartx.closeMobileMenu();
    }
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }
});

// Initial Boot
store.subscribe(renderApp);
document.addEventListener('DOMContentLoaded', renderApp);
renderApp();
