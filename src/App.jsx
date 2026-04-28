import { useState } from 'react';
import Topbar from "./components/Topbar.jsx";
import KPICards from "./components/KPICards.jsx";
import GlobalMap from "./components/GlobalMap.jsx";
import TruckDetail from "./components/TruckDetail.jsx";
import FleetTable from "./components/FleetTable.jsx";
import SpeedChart from "./components/SpeedChart.jsx";
import Alerts from "./components/Alerts.jsx";
import CargoDonut from "./components/CargoDonut.jsx";
import DriverAlerts from "./components/DriverAlerts.jsx";
import TruckAdmin from "./components/TruckAdmin.jsx";
import RoutePlanner from "./components/RoutePlanner.jsx";

export default function App() {
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'routing', 'admin'

  return (
    <div className="bg-bg text-text min-h-screen">
      <Topbar currentView={currentView} onViewChange={setCurrentView} />

      {currentView === 'admin' ? (
        <TruckAdmin />
      ) : currentView === 'routing' ? (
        <RoutePlanner />
      ) : (
        <div className="p-6 max-w-[1400px] mx-auto space-y-6">
          <KPICards />

          {/* MAIN GRID - Global Map + Truck Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
            <GlobalMap onTruckSelect={setSelectedTruck} />
            <TruckDetail truckId={selectedTruck} onClose={() => setSelectedTruck(null)} />
          </div>

          {/* DRIVER ALERTS - Real-time monitoring */}
          <DriverAlerts />

          <FleetTable onTruckSelect={setSelectedTruck} />

          {/* BOTTOM PANELS */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SpeedChart />
            <CargoDonut />
            <Alerts />
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <button
          onClick={() => setCurrentView(currentView === 'routing' ? 'dashboard' : 'routing')}
          className={`px-4 py-2 rounded-lg font-mono text-sm font-bold transition-all ${
            currentView === 'routing'
              ? 'bg-blue-600 text-white border border-blue-400'
              : 'bg-blue-600/20 border border-blue-400/40 text-blue-300 hover:bg-blue-600/30'
          }`}
        >
          {currentView === 'routing' ? '← Dashboard' : 'Routes →'}
        </button>
        <button
          onClick={() => setCurrentView(currentView === 'admin' ? 'dashboard' : 'admin')}
          className={`px-4 py-2 rounded-lg font-mono text-sm font-bold transition-all ${
            currentView === 'admin'
              ? 'bg-purple-600 text-white border border-purple-400'
              : 'bg-purple-600/20 border border-purple-400/40 text-purple-300 hover:bg-purple-600/30'
          }`}
        >
          {currentView === 'admin' ? '← Dashboard' : 'Admin →'}
        </button>
      </div>
    </div>
  );
}