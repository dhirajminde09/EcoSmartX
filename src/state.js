/**
 * Central State Store (Vanilla ES6 with reactive subscription pattern)
 * Enhanced with Firebase Firestore persistence and Google Calendar sync
 * ZERO DEMO DATA ENFORCEMENT: Strictly user-created & verified real records only.
 */
import { calculateFacilityMetrics, detectAnomalies } from './utils/energyEngine.js';
import {
  db,
  auth,
  initAuthListener,
  loginWithGoogle,
  logoutUser,
  getCachedAccessToken,
  handleFirestoreError,
  OperationType,
} from './services/firebase.js';
import {
  getCalendarEvents,
  createCalendarEnergyEvent,
  removeCalendarEvent,
} from './services/calendar.js';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'ecosmartx_facilities_v1';
const LOCAL_STORAGE_SCENARIOS = 'ecosmartx_scenarios_v1';
const LOCAL_STORAGE_USER = 'ecosmartx_user_v1';
const LOCAL_STORAGE_EVENTS = 'ecosmartx_energy_events_v1';
const LOCAL_STORAGE_ACTIONS = 'ecosmartx_action_plan_v1';

class StateStore {
  constructor() {
    this.listeners = new Set();
    this.currentTab = 'dashboard';
    this.subTabs = {
      'energy-setup': 'appliances',
      'advisor': 'copilot',
      'simulator': 'lab',
      'actions': 'roadmap',
      'reports': 'audit',
    };
    this.notification = null;
    this.notificationTimeout = null;

    // Firebase Auth State
    this.authUser = null;
    this.authLoading = true;
    this.isCalendarSyncing = false;
    this.calendarEvents = [];
    this.firestoreFacilitiesUnsub = null;
    this.firestoreEventsUnsub = null;

    // Load user facilities from local storage (purging synthetic benchmark records)
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      let loaded = saved ? JSON.parse(saved) : [];
      if (Array.isArray(loaded)) {
        // Purge synthetic demo facility IDs so they cannot leak into production paths
        loaded = loaded.filter(f => f && f.id && !['fac-ecotech', 'fac-biomed', 'fac-logistics'].includes(f.id));
      } else {
        loaded = [];
      }
      this.facilities = loaded;
    } catch (e) {
      this.facilities = [];
    }

    this.activeFacilityId = this.facilities[0]?.id || null;

    // Load scenarios
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SCENARIOS);
      let loadedScenarios = saved ? JSON.parse(saved) : [];
      if (Array.isArray(loadedScenarios)) {
        loadedScenarios = loadedScenarios.filter(s => s && s.id && !s.id.startsWith('scen-led-retrofit'));
      } else {
        loadedScenarios = [];
      }
      this.scenarios = loadedScenarios;
    } catch (e) {
      this.scenarios = [];
    }
    this.activeScenarioId = null;

    // Load energy events (purging mock calendar events)
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_EVENTS);
      let loadedEvents = saved ? JSON.parse(saved) : [];
      if (Array.isArray(loadedEvents)) {
        loadedEvents = loadedEvents.filter(e => e && !['mock-gcal-1', 'mock-gcal-2', 'mock-gcal-3'].includes(e.calendarEventId) && !['evt-dr-peak-today', 'evt-maint-chiller', 'evt-audit-ashrae'].includes(e.id));
      } else {
        loadedEvents = [];
      }
      this.energyEvents = loadedEvents;
    } catch (e) {
      this.energyEvents = [];
    }

    // Load user profile (strictly null if unauthenticated; purge any legacy 'Local User' or 'Facility Manager' artifacts)
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USER);
      let loadedUser = saved ? JSON.parse(saved) : null;
      if (loadedUser && (loadedUser.name === 'Rajesh Sharma' || loadedUser.name === 'Alex Morgan' || loadedUser.name === 'Local User' || loadedUser.isDemoAccount)) {
        loadedUser = null;
        localStorage.removeItem(LOCAL_STORAGE_USER);
      }
      this.userProfile = loadedUser || null;
    } catch (e) {
      this.userProfile = null;
    }

    // Load action plan (purging demo action records)
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ACTIONS);
      let loadedActions = saved ? JSON.parse(saved) : [];
      if (Array.isArray(loadedActions)) {
        loadedActions = loadedActions.filter(a => a && !['act-1', 'act-2', 'act-3', 'act-4', 'act-5'].includes(a.id));
      } else {
        loadedActions = [];
      }
      this.actionPlan = loadedActions;
    } catch (e) {
      this.actionPlan = [];
    }

    // Anomaly overrides
    this.anomalyOverrides = {};

    // Initialize Firebase Auth listener
    this.initAuth();
  }

  purgeUserSessionData() {
    // 1. Purge persistent client storage
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem(LOCAL_STORAGE_SCENARIOS);
      localStorage.removeItem(LOCAL_STORAGE_USER);
      localStorage.removeItem(LOCAL_STORAGE_EVENTS);
      localStorage.removeItem(LOCAL_STORAGE_ACTIONS);
    } catch (e) {
      console.warn('LocalStorage clearance notice:', e);
    }

    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    } catch (e) {
      console.warn('SessionStorage clearance notice:', e);
    }

    // 2. Invalidate and detach any active Firestore snapshot listeners
    this.cleanupFirestoreListeners();

    // 3. Reset in-memory session and facility state to zero
    this.facilities = [];
    this.activeFacilityId = null;
    this.scenarios = [];
    this.activeScenarioId = null;
    this.energyEvents = [];
    this.actionPlan = [];
    this.calendarEvents = [];
    this.userProfile = null;
    this.anomalyOverrides = {};

    // 4. Wipe transient UI conversational memory and recommendations
    if (typeof window !== 'undefined') {
      window.ecosmartxChatHistory = [];
      window.ecosmartxAdvisorRecs = [];
    }
  }

  initAuth() {
    this.authLoading = true;
    initAuthListener(
      (user, token) => {
        // If switching user accounts, purge the previous user's local state before attaching new account
        if (this.authUser && this.authUser.uid !== user.uid) {
          console.info(`[SECURITY] Account switch detected: ${this.authUser.uid} -> ${user.uid}. Purging cached session data.`);
          this.purgeUserSessionData();
        }
        this.authUser = user;
        this.authLoading = false;
        if (user.displayName || user.email) {
          this.userProfile = {
            ...(this.userProfile || {}),
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            photoURL: user.photoURL || null,
            role: user.role || (this.userProfile?.roleVerified ? this.userProfile.role : null),
            isDemoAccount: false,
          };
        }
        this.setupFirestoreListeners(user.uid);
        this.syncGoogleCalendar(true);
        this.notify();
      },
      () => {
        this.purgeUserSessionData();
        this.authUser = null;
        this.authLoading = false;
        this.notify();
      }
    );
  }

  setupFirestoreListeners(uid) {
    this.cleanupFirestoreListeners();

    try {
      // 1. Listen for user facilities in Firestore
      const facQuery = query(collection(db, 'facilities'), where('ownerId', '==', uid));
      this.firestoreFacilitiesUnsub = onSnapshot(
        facQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteFacilities = [];
            snapshot.forEach((d) => remoteFacilities.push(d.data()));
            this.facilities = remoteFacilities.map(remote => ({
              ...remote,
              rooms: remote.rooms || [],
              appliances: remote.appliances || [],
              currency: remote.currency || 'INR',
              currencySymbol: remote.currencySymbol || '₹',
              timezone: 'Asia/Kolkata',
              tariff: remote.tariff || {
                name: 'HT-2a Commercial ToD',
                type: 'tou',
                fixedMonthlyCharge: 1500,
                demandChargePerKw: 260.0,
                touPeriods: [
                  { name: 'off_peak', rate: 6.2, startHour: 22, endHour: 6 },
                  { name: 'normal', rate: 7.8, startHour: 6, endHour: 18 },
                  { name: 'peak', rate: 9.8, startHour: 18, endHour: 22 },
                ],
              },
            }));
            if (!this.facilities.some(f => f.id === this.activeFacilityId)) {
              this.activeFacilityId = this.facilities[0]?.id || null;
            }
            this.notify();
          } else {
            // No facilities found in Firestore for this user
            this.facilities = [];
            this.activeFacilityId = null;
            this.notify();
          }
        },
        (error) => {
          console.warn('Firestore facilities snapshot error (offline or permission):', error);
        }
      );

      // 2. Listen for energy events in Firestore
      const eventsQuery = query(collection(db, 'energy_events'), where('ownerId', '==', uid));
      this.firestoreEventsUnsub = onSnapshot(
        eventsQuery,
        (snapshot) => {
          const remoteEvents = [];
          snapshot.forEach((d) => remoteEvents.push(d.data()));
          this.energyEvents = remoteEvents;
          this.notify();
        },
        (error) => {
          console.warn('Firestore events snapshot error:', error);
        }
      );
    } catch (e) {
      console.warn('Could not initialize Firestore listeners:', e);
    }
  }

  cleanupFirestoreListeners() {
    if (this.firestoreFacilitiesUnsub) {
      this.firestoreFacilitiesUnsub();
      this.firestoreFacilitiesUnsub = null;
    }
    if (this.firestoreEventsUnsub) {
      this.firestoreEventsUnsub();
      this.firestoreEventsUnsub = null;
    }
  }

  async signInWithGoogle() {
    try {
      this.showNotification('Opening Google sign-in...', 'info');
      const result = await loginWithGoogle();
      if (!result || result.cancelled || !result.user) {
        this.showNotification('Google sign-in cancelled', 'info');
        return null;
      }
      this.authUser = result.user;
      this.showNotification(`Signed in as ${result.user.email || result.user.displayName}`, 'success');
      await this.syncGoogleCalendar();
      return result.user;
    } catch (err) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        this.showNotification('Google sign-in cancelled', 'info');
      } else if (err?.code === 'auth/popup-blocked') {
        this.showNotification('Popup blocked by browser. Please allow popups and retry.', 'error');
      } else if (err?.code === 'auth/unauthorized-domain') {
        this.showNotification('Domain authorization required in Firebase Console.', 'error');
      } else {
        this.showNotification(`Sign-in: ${err?.message || 'Cancelled'}`, 'info');
      }
      return null;
    }
  }

  async signOut() {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Logout notice:', err);
    } finally {
      this.purgeUserSessionData();
      this.authUser = null;
      this.authLoading = false;
      this.showNotification('Signed out of Google Account', 'info');
      this.notify();
    }
  }

  async syncGoogleCalendar(silent = false) {
    if (!getCachedAccessToken()) return;
    this.isCalendarSyncing = true;
    this.notify();

    try {
      const items = await getCalendarEvents();
      this.calendarEvents = items;
      if (!silent) {
        this.showNotification(`Synced ${items.length} Google Calendar events`, 'success');
      }
    } catch (err) {
      if (!silent) {
        this.showNotification(`Calendar sync: ${err.message}`, 'error');
      }
    } finally {
      this.isCalendarSyncing = false;
      this.notify();
    }
  }

  getDefaultEnergyEvents() {
    return [];
  }

  getEnergyEvents() {
    return this.energyEvents;
  }

  async createEnergyEvent({ title, description, startTime, endTime, targetReductionKw = 0, eventType = 'demand_response' }) {
    const id = `event-${Date.now()}`;
    const fac = this.getActiveFacility();
    let calendarEventId = '';
    let isSynced = false;

    // 1. If Google Calendar token available, schedule on real Google Calendar
    if (getCachedAccessToken()) {
      try {
        const gcalEvent = await createCalendarEnergyEvent({
          title,
          description: `Facility: ${fac?.name || 'Facility'}\nTarget Reduction: ${targetReductionKw} kW\n${description || ''}`,
          startTime,
          endTime,
          eventType,
        });
        calendarEventId = gcalEvent?.id || '';
        if (calendarEventId) {
          isSynced = true;
        }
      } catch (calErr) {
        console.warn('Could not post directly to Google Calendar API:', calErr);
        this.showNotification(`Calendar API: ${calErr.message}`, 'error');
      }
    }

    const eventRecord = {
      id,
      facilityId: fac?.id || 'unassigned',
      title,
      description: description || 'Scheduled energy optimization event',
      eventType,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      targetReductionKw: Number(targetReductionKw) || 0,
      calendarEventId,
      status: isSynced ? 'synced' : 'local_record',
      ownerId: this.authUser?.uid || 'guest-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 2. Persist to Firestore if authenticated
    if (this.authUser) {
      try {
        await setDoc(doc(db, 'energy_events', id), eventRecord);
      } catch (dbErr) {
        console.warn('Firestore event write error:', dbErr);
      }
    }

    this.energyEvents.unshift(eventRecord);
    this.save();
    this.notify();

    if (isSynced) {
      this.showNotification(`Scheduled "${title}" on Google Calendar & saved to Firestore.`, 'success');
      this.syncGoogleCalendar(true);
    } else {
      this.showNotification(`Scheduled "${title}" locally. Sign in to Google to sync with Google Calendar.`, 'info');
    }
  }

  async deleteEnergyEvent(id, title = 'Event') {
    const event = this.energyEvents.find((e) => e.id === id);
    if (!event) return;

    // Remove from Google Calendar if synced
    if (event.calendarEventId && getCachedAccessToken()) {
      try {
        const removed = await removeCalendarEvent(event.calendarEventId, event.title);
        if (!removed) return; // User cancelled prompt
      } catch (calErr) {
        console.warn('Google Calendar delete error:', calErr);
      }
    } else {
      // Local confirmation dialog
      const confirmed = window.confirm(`Are you sure you want to delete "${event.title}"?`);
      if (!confirmed) return;
    }

    // Remove from Firestore if authenticated
    if (this.authUser) {
      try {
        await deleteDoc(doc(db, 'energy_events', id));
      } catch (dbErr) {
        console.warn('Firestore event delete error:', dbErr);
      }
    }

    this.energyEvents = this.energyEvents.filter((e) => e.id !== id);
    this.save();
    this.notify();
    this.showNotification(`Removed event "${title}"`, 'info');
  }

  getDefaultScenarios() {
    return [];
  }

  getDefaultUserProfile() {
    return null;
  }

  getDefaultActionPlan() {
    return [];
  }

  getActionPlan() {
    return this.actionPlan;
  }

  setSubTab(section, subTab) {
    if (!this.subTabs) this.subTabs = {};
    this.subTabs[section] = subTab;
    this.notify();
  }

  updateActionStatus(actionId, status) {
    const action = this.actionPlan.find(a => a.id === actionId);
    if (action) {
      action.status = status;
      this.save();
      this.notify();
      this.showNotification(`Updated action "${action.title}" to ${status.replace('_', ' ')}`, 'info');
    }
  }

  addActionItem(item) {
    const newAction = {
      id: `act-${Date.now()}`,
      title: item.title || 'New Conservation Measure',
      category: item.category || 'Efficiency',
      effort: item.effort || 'Low',
      capitalCost: Number(item.capitalCost) || 0,
      estimatedMonthlyKwhSavings: Number(item.estimatedMonthlyKwhSavings) || 0,
      estimatedMonthlyCostSavings: Number(item.estimatedMonthlyCostSavings) || 0,
      co2ReductionKgAnnual: Number(item.co2ReductionKgAnnual) || 0,
      paybackMonths: Number(item.paybackMonths) || 0,
      confidence: item.confidence || 'High',
      status: 'open',
      description: item.description || item.actionPlan || '',
      scheduledEventTitle: item.scheduledEventTitle || item.title || 'Conservation Implementation',
      dueDate: item.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    this.actionPlan.unshift(newAction);
    this.save();
    this.notify();
    this.showNotification(`Added "${newAction.title}" to Conservation Action Plan!`, 'success');
  }

  deleteActionItem(actionId) {
    const item = this.actionPlan.find(a => a.id === actionId);
    this.actionPlan = this.actionPlan.filter(a => a.id !== actionId);
    this.save();
    this.notify();
    this.showNotification(`Removed action "${item?.title || 'item'}"`, 'info');
  }

  async scheduleActionInCalendar(actionId) {
    const action = this.actionPlan.find(a => a.id === actionId);
    if (!action) return;

    const eventDate = action.dueDate || new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const startTime = `${eventDate}T09:00:00`;
    const endTime = `${eventDate}T11:00:00`;

    let eventType = 'demand_response';
    if (action.category.toLowerCase().includes('hvac') || action.category.toLowerCase().includes('maint')) {
      eventType = 'maintenance';
    } else if (action.title.toLowerCase().includes('audit') || action.title.toLowerCase().includes('inspect')) {
      eventType = 'energy_audit';
    } else if (action.title.toLowerCase().includes('peak') || action.title.toLowerCase().includes('shifting')) {
      eventType = 'peak_shaving';
    }

    const fac = this.getActiveFacility();
    await this.createEnergyEvent({
      title: `${action.title} [Action Plan]`,
      description: `Action Item: ${action.title}\nCategory: ${action.category}\nEstimated Monthly Savings: ${fac?.currencySymbol || '₹'}${action.estimatedMonthlyCostSavings.toLocaleString('en-IN')}/mo (${action.estimatedMonthlyKwhSavings.toLocaleString('en-IN')} kWh)\nDetails: ${action.description}`,
      startTime,
      endTime,
      targetReductionKw: Math.round(action.estimatedMonthlyKwhSavings / 160) || 10,
      eventType,
    });

    action.status = 'in_progress';
    this.save();
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.save();
    for (const listener of this.listeners) {
      listener();
    }
  }

  save() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.facilities));
      localStorage.setItem(LOCAL_STORAGE_SCENARIOS, JSON.stringify(this.scenarios));
      localStorage.setItem(LOCAL_STORAGE_USER, JSON.stringify(this.userProfile));
      localStorage.setItem(LOCAL_STORAGE_EVENTS, JSON.stringify(this.energyEvents));
      localStorage.setItem(LOCAL_STORAGE_ACTIONS, JSON.stringify(this.actionPlan));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  getActiveFacility() {
    if (!this.facilities || this.facilities.length === 0) {
      return null;
    }
    const found = this.facilities.find((f) => f.id === this.activeFacilityId);
    return found || this.facilities[0] || null;
  }

  getMetrics() {
    const fac = this.getActiveFacility();
    if (!fac) {
      return null;
    }

    const raw = calculateFacilityMetrics(fac);
    const facMetrics = raw.facility;
    const peakKw = facMetrics.estimatedPeakDemandKw || 0;
    const baseKw = facMetrics.standbyWasteMonthlyKwh / 720 || 0;

    // Only generate 24h curve if real appliances exist
    const hourlyLoadCurve = (fac.appliances && fac.appliances.length > 0) ? Array.from({ length: 24 }).map((_, hour) => {
      let factor = 0.35;
      if (hour >= 6 && hour < 8) factor = 0.55;
      else if (hour >= 8 && hour < 12) factor = 0.85;
      else if (hour >= 12 && hour < 18) factor = 1.0;
      else if (hour >= 18 && hour < 21) factor = 0.65;
      else if (hour >= 21) factor = 0.40;

      const isPeakHour = hour >= (fac.tariff?.peakStartHour || 18) && hour < (fac.tariff?.peakEndHour || 22);
      const demandKw = Math.round((baseKw + (peakKw - baseKw) * factor) * 10) / 10;
      return { hour, demandKw, isPeakHour };
    }) : [];

    const effectiveRate =
      facMetrics.monthlyTotalKwh > 0
        ? facMetrics.monthlyCost / facMetrics.monthlyTotalKwh
        : (fac.tariff?.flatRate || 8.0);

    const rawStandbyPct =
      facMetrics.monthlyTotalKwh > 0
        ? (facMetrics.standbyWasteMonthlyKwh / facMetrics.monthlyTotalKwh) * 100
        : 0;
    const standbyPct =
      rawStandbyPct > 0 && rawStandbyPct < 1
        ? Number(rawStandbyPct.toFixed(1))
        : Math.round(rawStandbyPct);

    return {
      ...facMetrics,
      rooms: raw.rooms,
      appliances: raw.appliances,
      effectiveRatePerKwh: effectiveRate,
      standbyWastePercentage: standbyPct,
      hourlyLoadCurve,
    };
  }

  getAnomalies() {
    const fac = this.getActiveFacility();
    if (!fac || !fac.appliances || fac.appliances.length === 0) {
      return [];
    }
    const detected = detectAnomalies(fac);
    return detected.map((a) => ({
      ...a,
      status: this.anomalyOverrides[a.id] || a.status,
    }));
  }

  getChallenges() {
    const fac = this.getActiveFacility();
    const metrics = this.getMetrics();
    const actions = this.actionPlan || [];

    const hasStandbyAction = actions.some(a => a.category?.toLowerCase().includes('plug') && a.status === 'completed');
    const standbyPct = metrics ? metrics.standbyWastePercentage : 0;
    const standbyComplete = hasStandbyAction || (metrics && metrics.monthlyTotalKwh > 0 && standbyPct < 5);

    const hasPeakEvent = this.energyEvents.some(e => e.eventType === 'peak_shaving' || e.eventType === 'demand_response');
    const epi = metrics ? metrics.energyIntensityKwhPerSqM : 0;
    const epiComplete = metrics && metrics.monthlyTotalKwh > 0 && epi > 0 && epi < 90;

    return [
      {
        id: 'ch-standby',
        title: 'Standby Power Mitigation Target',
        description: 'Reduce monthly phantom standby power draw by eliminating vampire idle loads',
        targetKwhSaving: 200,
        badge: 'Zero Vampire Draw',
        category: 'Efficiency',
        completed: standbyComplete,
        progressPercent: standbyComplete ? 100 : (metrics && metrics.monthlyTotalKwh > 0 ? Math.min(80, Math.round(100 - standbyPct)) : 0),
      },
      {
        id: 'ch-peak',
        title: 'DISCOM Peak Shaving Target',
        description: 'Schedule load curtailment during DISCOM peak ToD pricing window (18:00 - 22:00 IST)',
        targetKwhSaving: 450,
        badge: 'Peak Shaver',
        category: 'Grid Agility',
        completed: hasPeakEvent,
        progressPercent: hasPeakEvent ? 100 : 0,
      },
      {
        id: 'ch-intensity',
        title: 'BEE Energy Performance Index (EPI) Target',
        description: 'Maintain building annual Energy Performance Index below 90 kWh/m²/year (BEE Star benchmark)',
        targetKwhSaving: 600,
        badge: 'BEE Energy Efficient',
        category: 'Decarbonization',
        completed: epiComplete,
        progressPercent: epiComplete ? 100 : (metrics && epi > 0 ? Math.max(0, Math.min(95, Math.round((90 / epi) * 100))) : 0),
      },
    ];
  }

  setCurrentTab(tab) {
    this.currentTab = tab;
    this.notify();
  }

  setActiveFacilityId(id) {
    this.activeFacilityId = id;
    this.activeScenarioId = null;
    this.notify();
  }

  showNotification(message, type = 'success') {
    this.notification = { message, type };
    if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
    this.notificationTimeout = setTimeout(() => {
      this.notification = null;
      this.notify();
    }, 4000);
    this.notify();
  }

  async createFacility(newFac) {
    const id = `fac-${Date.now()}`;
    const facilityWithId = {
      rooms: [],
      appliances: [],
      currency: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata',
      emissionFactorKgCo2PerKwh: 0.72,
      ...newFac,
      id,
    };
    this.facilities.push(facilityWithId);
    this.activeFacilityId = id;

    // Sync to Firestore if authenticated
    if (this.authUser) {
      try {
        await setDoc(doc(db, 'facilities', id), {
          id,
          name: facilityWithId.name,
          type: facilityWithId.type || 'Commercial',
          floorAreaSqM: facilityWithId.floorAreaSqM || 1000,
          occupancy: facilityWithId.occupancy || 40,
          country: facilityWithId.country || 'India',
          currency: facilityWithId.currency || 'INR',
          ownerId: this.authUser.uid,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Firestore facility write error:', err);
      }
    }

    this.save();
    this.notify();
    this.showNotification(`Created facility "${facilityWithId.name}"`, 'success');
  }

  async updateFacility(updated) {
    this.facilities = this.facilities.map((f) => (f.id === updated.id ? updated : f));

    // Sync to Firestore if authenticated
    if (this.authUser) {
      try {
        await setDoc(
          doc(db, 'facilities', updated.id),
          {
            id: updated.id,
            name: updated.name,
            type: updated.type || 'Commercial',
            floorAreaSqM: updated.floorAreaSqM || 1000,
            occupancy: updated.occupancy || 40,
            country: updated.country || 'India',
            currency: updated.currency || 'INR',
            ownerId: this.authUser.uid,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Firestore facility update error:', err);
      }
    }

    this.save();
    this.notify();
    this.showNotification(`Updated facility "${updated.name}"`, 'success');
  }

  async deleteFacility(id) {
    // Delete from Firestore if authenticated
    if (this.authUser) {
      try {
        await deleteDoc(doc(db, 'facilities', id));
      } catch (err) {
        console.warn('Firestore facility delete error:', err);
      }
    }

    this.facilities = this.facilities.filter((f) => f.id !== id);
    this.activeFacilityId = this.facilities[0]?.id || null;
    this.save();
    this.notify();
    this.showNotification('Facility deleted', 'info');
  }

  clearWorkspaceData() {
    this.facilities = [];
    this.activeFacilityId = null;
    this.scenarios = [];
    this.energyEvents = [];
    this.actionPlan = [];
    this.anomalyOverrides = {};
    this.save();
    this.notify();
    this.showNotification('Workspace data cleared.', 'info');
  }

  addRoom(roomData) {
    const fac = this.getActiveFacility();
    const newRoom = { ...roomData, id: `room-${Date.now()}` };
    fac.rooms.push(newRoom);
    this.updateFacility(fac);
    this.showNotification(`Added zone "${newRoom.name}"`, 'success');
  }

  updateRoom(updatedRoom) {
    const fac = this.getActiveFacility();
    fac.rooms = fac.rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r));
    this.updateFacility(fac);
  }

  deleteRoom(roomId) {
    const fac = this.getActiveFacility();
    fac.rooms = fac.rooms.filter((r) => r.id !== roomId);
    fac.appliances = fac.appliances.filter((a) => a.roomId !== roomId);
    this.updateFacility(fac);
    this.showNotification('Zone and assigned equipment removed', 'info');
  }

  addAppliance(appData) {
    const fac = this.getActiveFacility();
    const newApp = { ...appData, id: `app-${Date.now()}` };
    fac.appliances.push(newApp);
    this.updateFacility(fac);
    this.showNotification(`Added equipment "${newApp.name}"`, 'success');
  }

  updateAppliance(updatedApp) {
    const fac = this.getActiveFacility();
    fac.appliances = fac.appliances.map((a) => (a.id === updatedApp.id ? updatedApp : a));
    this.updateFacility(fac);
    this.showNotification(`Updated equipment "${updatedApp.name}"`, 'success');
  }

  deleteAppliance(appId) {
    const fac = this.getActiveFacility();
    fac.appliances = fac.appliances.filter((a) => a.id !== appId);
    this.updateFacility(fac);
    this.showNotification('Equipment removed', 'info');
  }

  createScenario(name, description, modifiedFacility) {
    const newScenario = {
      id: `scen-${Date.now()}`,
      facilityId: this.activeFacilityId,
      name,
      description,
      createdAt: new Date().toISOString(),
      modifiedFacility,
    };
    this.scenarios.push(newScenario);
    this.activeScenarioId = newScenario.id;
    this.showNotification(`Saved simulation scenario "${name}"`, 'success');
  }

  deleteScenario(id) {
    this.scenarios = this.scenarios.filter((s) => s.id !== id);
    if (this.activeScenarioId === id) this.activeScenarioId = null;
    this.showNotification('Scenario removed', 'info');
  }

  setActiveScenarioId(id) {
    this.activeScenarioId = id;
    this.notify();
  }

  updateAnomalyStatus(id, status) {
    this.anomalyOverrides[id] = status;
    this.showNotification(`Anomaly status marked as ${status}`, 'info');
  }

  toggleChallenge(id) {
    this.challenges = this.challenges.map((c) => {
      if (c.id === id) {
        const nextState = !c.completed;
        return {
          ...c,
          completed: nextState,
          progressPercent: nextState ? 100 : Math.min(50, c.progressPercent),
        };
      }
      return c;
    });
    this.showNotification('Milestone updated', 'success');
  }

  updateUserProfile(partial) {
    this.userProfile = { ...this.userProfile, ...partial };
    this.showNotification('Preferences updated', 'success');
  }
}

export const store = new StateStore();
