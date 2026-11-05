import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Facility,
  Room,
  Appliance,
  TariffRate,
  calculateFacilityMetrics,
  detectAnomalies,
  AnomalyFinding,
  FacilityMetrics,
  RoomMetrics,
  ApplianceMetrics,
} from '../utils/energyEngine';
import { initialFacilities } from '../data/seedData';

export interface Scenario {
  id: string;
  facilityId: string;
  name: string;
  description: string;
  createdAt: string;
  modifiedFacility: Facility;
}

export interface EcoChallenge {
  id: string;
  title: string;
  description: string;
  targetKwhSaving: number;
  badge: string;
  category: string;
  completed: boolean;
  progressPercent: number;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  organization: string;
  isDemoAccount: boolean;
  theme: 'dark' | 'light';
  unitSystem: 'metric' | 'imperial';
}

interface EnergyContextType {
  facilities: Facility[];
  activeFacility: Facility;
  activeFacilityId: string;
  setActiveFacilityId: (id: string) => void;
  createFacility: (facility: Omit<Facility, 'id'>) => void;
  updateFacility: (facility: Facility) => void;
  deleteFacility: (id: string) => void;
  resetDemoData: () => void;

  // Rooms & Appliances
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (room: Room) => void;
  deleteRoom: (roomId: string) => void;
  addAppliance: (appliance: Omit<Appliance, 'id'>) => void;
  updateAppliance: (appliance: Appliance) => void;
  deleteAppliance: (applianceId: string) => void;

  // Calculated Metrics
  metrics: {
    facility: FacilityMetrics;
    rooms: RoomMetrics[];
    appliances: ApplianceMetrics[];
  };

  // Anomalies
  anomalies: AnomalyFinding[];
  updateAnomalyStatus: (id: string, status: AnomalyFinding['status']) => void;

  // Scenarios
  scenarios: Scenario[];
  activeScenarioId: string | null;
  setActiveScenarioId: (id: string | null) => void;
  createScenario: (name: string, description: string, modifiedFacility: Facility) => void;
  deleteScenario: (id: string) => void;

  // Eco Challenges
  challenges: EcoChallenge[];
  toggleChallenge: (id: string) => void;

  // User & Settings
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  notification: { message: string; type: 'success' | 'info' | 'error' } | null;
  showNotification: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const EnergyContext = createContext<EnergyContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'ecosmartx_facilities_v1';
const LOCAL_STORAGE_SCENARIOS = 'ecosmartx_scenarios_v1';
const LOCAL_STORAGE_USER = 'ecosmartx_user_v1';

export const EnergyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load facilities from localStorage or fallback to initialFacilities
  const [facilities, setFacilities] = useState<Facility[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not parse saved facilities from localStorage, using seed data');
    }
    return initialFacilities;
  });

  const [activeFacilityId, setActiveFacilityId] = useState<string>(() => {
    return facilities[0]?.id || 'fac-ecotech';
  });

  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SCENARIOS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Initial pre-configured scenario for demo
    return [
      {
        id: 'scen-led-retrofit',
        facilityId: 'fac-ecotech',
        name: 'LED Retrofit & Smart Occupancy Sockets',
        description: 'Upgrades office lighting to 22W LEDs and cuts weekend standby via smart timers',
        createdAt: new Date().toISOString(),
        modifiedFacility: {
          ...initialFacilities[0],
          appliances: initialFacilities[0].appliances.map(a => {
            if (a.category === 'lighting') {
              return { ...a, ratedWatts: 22, utilizationFactor: 0.75 };
            }
            if (a.category === 'plug_load') {
              return { ...a, standbyWatts: 10 };
            }
            return a;
          }),
        },
      },
    ];
  });

  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      name: 'Alex Morgan',
      email: 'alex.morgan@ecotech.corp',
      role: 'Director of Energy & Sustainability',
      organization: 'EcoTech Global Infrastructure',
      isDemoAccount: true,
      theme: 'dark',
      unitSystem: 'metric',
    };
  });

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Synchronize facilities to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(facilities));
    } catch (e) {
      console.error('Failed to save facilities to localStorage', e);
    }
  }, [facilities]);

  // Synchronize scenarios to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SCENARIOS, JSON.stringify(scenarios));
    } catch (e) {
      console.error('Failed to save scenarios to localStorage', e);
    }
  }, [scenarios]);

  // Synchronize userProfile to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_USER, JSON.stringify(userProfile));
    } catch (e) {
      console.error('Failed to save user profile to localStorage', e);
    }
  }, [userProfile]);

  const activeFacility = useMemo(() => {
    const found = facilities.find(f => f.id === activeFacilityId);
    return found || facilities[0] || initialFacilities[0];
  }, [facilities, activeFacilityId]);

  // Deterministic metrics calculation
  const metrics = useMemo(() => {
    return calculateFacilityMetrics(activeFacility);
  }, [activeFacility]);

  // Detected anomalies
  const [anomalyOverrides, setAnomalyOverrides] = useState<Record<string, AnomalyFinding['status']>>({});

  const anomalies = useMemo(() => {
    const detected = detectAnomalies(activeFacility);
    return detected.map(a => ({
      ...a,
      status: anomalyOverrides[a.id] || a.status,
    }));
  }, [activeFacility, anomalyOverrides]);

  const updateAnomalyStatus = (id: string, status: AnomalyFinding['status']) => {
    setAnomalyOverrides(prev => ({ ...prev, [id]: status }));
    showNotification(`Anomaly status updated to ${status}`, 'info');
  };

  // Eco Challenges
  const [challenges, setChallenges] = useState<EcoChallenge[]>([
    {
      id: 'ch-standby',
      title: 'Vampire Slayer Challenge',
      description: 'Reduce monthly phantom standby power consumption by at least 15%',
      targetKwhSaving: 200,
      badge: '🧛 Zero Vampire Draw',
      category: 'Efficiency',
      completed: false,
      progressPercent: 45,
    },
    {
      id: 'ch-peak',
      title: 'Peak Load Shifting Champion',
      description: 'Reschedule shiftable machinery outside peak pricing window (13:00 - 19:00)',
      targetKwhSaving: 450,
      badge: '⚡ Peak Shaver',
      category: 'Grid Agility',
      completed: true,
      progressPercent: 100,
    },
    {
      id: 'ch-intensity',
      title: 'Sub-80 Intensity Sprint',
      description: 'Attain building annual energy intensity below 85 kWh/m²/year',
      targetKwhSaving: 600,
      badge: '🌱 Platinum Green Building',
      category: 'Decarbonization',
      completed: false,
      progressPercent: 68,
    },
  ]);

  const toggleChallenge = (id: string) => {
    setChallenges(prev =>
      prev.map(c => {
        if (c.id === id) {
          const nextState = !c.completed;
          return {
            ...c,
            completed: nextState,
            progressPercent: nextState ? 100 : Math.min(50, c.progressPercent),
          };
        }
        return c;
      })
    );
    showNotification('Eco challenge progress updated!', 'success');
  };

  // Facility CRUD
  const createFacility = (newFac: Omit<Facility, 'id'>) => {
    const id = `fac-${Date.now()}`;
    const facilityWithId: Facility = { ...newFac, id };
    setFacilities(prev => [...prev, facilityWithId]);
    setActiveFacilityId(id);
    showNotification(`Created facility "${facilityWithId.name}"`, 'success');
  };

  const updateFacility = (updated: Facility) => {
    setFacilities(prev => prev.map(f => (f.id === updated.id ? updated : f)));
    showNotification(`Updated facility "${updated.name}"`, 'success');
  };

  const deleteFacility = (id: string) => {
    if (facilities.length <= 1) {
      showNotification('Cannot delete the last remaining facility', 'error');
      return;
    }
    const remaining = facilities.filter(f => f.id !== id);
    setFacilities(remaining);
    setActiveFacilityId(remaining[0].id);
    showNotification('Facility deleted', 'info');
  };

  const resetDemoData = () => {
    setFacilities(initialFacilities);
    setActiveFacilityId(initialFacilities[0].id);
    setAnomalyOverrides({});
    showNotification('Reset all facilities to factory synthetic seed benchmark', 'info');
  };

  // Rooms CRUD
  const addRoom = (roomData: Omit<Room, 'id'>) => {
    const newRoom: Room = {
      ...roomData,
      id: `room-${Date.now()}`,
    };
    const updated = {
      ...activeFacility,
      rooms: [...activeFacility.rooms, newRoom],
    };
    updateFacility(updated);
    showNotification(`Added room "${newRoom.name}"`, 'success');
  };

  const updateRoom = (updatedRoom: Room) => {
    const updated = {
      ...activeFacility,
      rooms: activeFacility.rooms.map(r => (r.id === updatedRoom.id ? updatedRoom : r)),
    };
    updateFacility(updated);
    showNotification(`Updated room "${updatedRoom.name}"`, 'success');
  };

  const deleteRoom = (roomId: string) => {
    const updated = {
      ...activeFacility,
      rooms: activeFacility.rooms.filter(r => r.id !== roomId),
      appliances: activeFacility.appliances.filter(a => a.roomId !== roomId),
    };
    updateFacility(updated);
    showNotification('Room and assigned equipment removed', 'info');
  };

  // Appliances CRUD
  const addAppliance = (appData: Omit<Appliance, 'id'>) => {
    const newApp: Appliance = {
      ...appData,
      id: `app-${Date.now()}`,
    };
    const updated = {
      ...activeFacility,
      appliances: [...activeFacility.appliances, newApp],
    };
    updateFacility(updated);
    showNotification(`Added equipment "${newApp.name}"`, 'success');
  };

  const updateAppliance = (updatedApp: Appliance) => {
    const updated = {
      ...activeFacility,
      appliances: activeFacility.appliances.map(a => (a.id === updatedApp.id ? updatedApp : a)),
    };
    updateFacility(updated);
    showNotification(`Updated equipment "${updatedApp.name}"`, 'success');
  };

  const deleteAppliance = (appId: string) => {
    const updated = {
      ...activeFacility,
      appliances: activeFacility.appliances.filter(a => a.id !== appId),
    };
    updateFacility(updated);
    showNotification('Equipment removed', 'info');
  };

  // Scenarios CRUD
  const createScenario = (name: string, description: string, modifiedFacility: Facility) => {
    const newScenario: Scenario = {
      id: `scen-${Date.now()}`,
      facilityId: activeFacility.id,
      name,
      description,
      createdAt: new Date().toISOString(),
      modifiedFacility,
    };
    setScenarios(prev => [...prev, newScenario]);
    setActiveScenarioId(newScenario.id);
    showNotification(`Saved simulation scenario "${name}"`, 'success');
  };

  const deleteScenario = (id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
    if (activeScenarioId === id) setActiveScenarioId(null);
    showNotification('Simulation scenario removed', 'info');
  };

  const updateUserProfile = (partial: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...partial }));
    showNotification('Profile and preferences updated', 'success');
  };

  return (
    <EnergyContext.Provider
      value={{
        facilities,
        activeFacility,
        activeFacilityId,
        setActiveFacilityId,
        createFacility,
        updateFacility,
        deleteFacility,
        resetDemoData,

        addRoom,
        updateRoom,
        deleteRoom,
        addAppliance,
        updateAppliance,
        deleteAppliance,

        metrics,
        anomalies,
        updateAnomalyStatus,

        scenarios,
        activeScenarioId,
        setActiveScenarioId,
        createScenario,
        deleteScenario,

        challenges,
        toggleChallenge,

        userProfile,
        updateUserProfile,
        notification,
        showNotification,
      }}
    >
      {children}
    </EnergyContext.Provider>
  );
};

export const useEnergy = (): EnergyContextType => {
  const context = useContext(EnergyContext);
  if (!context) {
    throw new Error('useEnergy must be used within an EnergyProvider');
  }
  return context;
};
