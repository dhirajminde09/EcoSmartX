import React, { useState, useEffect } from 'react';
import { EnergyProvider } from './context/EnergyContext';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { Header } from './components/Header';
import { CommandCenter } from './components/views/CommandCenter';
import { DigitalTwinStudio } from './components/views/DigitalTwinStudio';
import { FacilitiesAndRooms } from './components/views/FacilitiesAndRooms';
import { ApplianceIntelligence } from './components/views/ApplianceIntelligence';
import { EnergyAnalytics } from './components/views/EnergyAnalytics';
import { SimulationLab } from './components/views/SimulationLab';
import { ScenarioLaboratory } from './components/views/ScenarioLaboratory';
import { PredictiveIntelligence } from './components/views/PredictiveIntelligence';
import { WasteForensics } from './components/views/WasteForensics';
import { OptimizationEngine } from './components/views/OptimizationEngine';
import { GeminiCopilot } from './components/views/GeminiCopilot';
import { ConservationAdvisor } from './components/views/ConservationAdvisor';
import { TariffIntelligence } from './components/views/TariffIntelligence';
import { CarbonIntelligence } from './components/views/CarbonIntelligence';
import { EcoChallenges } from './components/views/EcoChallenges';
import { ReportsAndAudit } from './components/views/ReportsAndAudit';
import { SettingsView } from './components/views/SettingsView';
import { NewFacilityModal } from './components/modals/NewFacilityModal';

function MainLayout() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isNewFacilityModalOpen, setIsNewFacilityModalOpen] = useState(false);

  // Check URL query parameters for deep linking or ?autostart=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as NavigationTab | null;
    if (tabParam) {
      setCurrentTab(tabParam);
    }
  }, []);

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <CommandCenter onNavigate={setCurrentTab} />;
      case 'digital_twin':
        return <DigitalTwinStudio />;
      case 'facilities_rooms':
        return <FacilitiesAndRooms />;
      case 'appliances':
        return <ApplianceIntelligence />;
      case 'analytics':
        return <EnergyAnalytics onNavigate={setCurrentTab} />;
      case 'simulation':
        return <SimulationLab onNavigate={setCurrentTab} />;
      case 'scenarios':
        return <ScenarioLaboratory onNavigate={setCurrentTab} />;
      case 'forecasting':
        return <PredictiveIntelligence />;
      case 'waste_forensics':
        return <WasteForensics onNavigate={setCurrentTab} />;
      case 'optimization':
        return <OptimizationEngine onNavigate={setCurrentTab} />;
      case 'copilot':
        return <GeminiCopilot />;
      case 'advisor':
        return <ConservationAdvisor onNavigate={setCurrentTab} />;
      case 'tariffs':
        return <TariffIntelligence />;
      case 'carbon':
        return <CarbonIntelligence />;
      case 'challenges':
        return <EcoChallenges />;
      case 'reports':
        return <ReportsAndAudit />;
      case 'settings':
        return <SettingsView />;
      default:
        return <CommandCenter onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#080e21] text-slate-100 flex flex-col lg:flex-row antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
          isMobileNavOpen={isMobileNavOpen}
          onOpenNewFacilityModal={() => setIsNewFacilityModalOpen(true)}
        />

        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden max-w-[1600px] w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* New Facility Modal */}
      <NewFacilityModal
        isOpen={isNewFacilityModalOpen}
        onClose={() => setIsNewFacilityModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <EnergyProvider>
      <MainLayout />
    </EnergyProvider>
  );
}
