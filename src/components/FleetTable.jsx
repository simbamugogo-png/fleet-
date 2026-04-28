import { useState, useEffect } from "react";
import { Navigation, AlertTriangle, Square, CheckCircle, Zap } from "lucide-react";
import { getTrucks } from "../services/api";

function StatusPill({ status }) {
  const configs = {
    moving: { bg: 'bg-blue/20', border: 'border-blue/40', text: 'text-blue', Icon: Navigation, label: 'Moving' },
    delayed: { bg: 'bg-amber/20', border: 'border-amber/40', text: 'text-amber', Icon: Zap, label: 'Delayed' },
    stopped: { bg: 'bg-red/20', border: 'border-red/40', text: 'text-red', Icon: AlertTriangle, label: 'Stopped' },
    delivered: { bg: 'bg-purple/20', border: 'border-purple/40', text: 'text-purple', Icon: CheckCircle, label: 'Delivered' },
  };
  const config = configs[status] || configs.delivered;

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.border} ${config.text}`}>
      <config.Icon size={14} />
      {config.label}
    </span>
  );
}

function ProgressBar({ progress, status }) {
  const colors = {
    delivered: 'bg-text2',
    stopped: 'bg-red',
    delayed: 'bg-amber',
    moving: 'bg-blue',
  };

  return (
    <div className="flex items-center gap-3">
      <div className="w-16 h-2 bg-bg3 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${colors[status] || 'bg-blue'}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <span className="text-xs text-text2 font-mono w-8">{progress}%</span>
    </div>
  );
}

export default function FleetTable({ onTruckSelect }) {
  const [trucks, setTrucks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        const data = await getTrucks();
        setTrucks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch trucks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrucks();
    const interval = setInterval(fetchTrucks, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredTrucks = filter === 'all' ? trucks : trucks.filter(t => t.status === filter);

  const filterButtons = [
    { key: 'all', label: 'All', count: trucks.length },
    { key: 'moving', label: 'Moving', count: trucks.filter(t => t.status === 'moving').length },
    { key: 'delayed', label: 'Delayed', count: trucks.filter(t => t.status === 'delayed').length },
    { key: 'stopped', label: 'Stopped', count: trucks.filter(t => t.status === 'stopped').length },
    { key: 'delivered', label: 'Delivered', count: trucks.filter(t => t.status === 'delivered').length },
  ];

  return (
    <div className="bg-bg2/80 backdrop-blur-sm border border-border rounded-xl overflow-hidden glass">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <span className="text-sm font-semibold font-heading text-text2 uppercase tracking-wider">Fleet Overview</span>
        <div className="flex gap-2">
          {filterButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`px-3 py-1 text-xs rounded-full border transition-all duration-300 font-mono ${
                filter === btn.key
                  ? 'bg-accent/20 border-accent/40 text-accent glow'
                  : 'border-border text-text2 hover:bg-bg3 hover:border-border2'
              }`}
            >
              {btn.label} ({btn.count})
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-semibold text-text3 uppercase tracking-wider font-mono">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text3 uppercase tracking-wider font-mono">Plate</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text3 uppercase tracking-wider">Driver</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text3 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text3 uppercase tracking-wider">Location</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text3 uppercase tracking-wider font-mono">Speed</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text3 uppercase tracking-wider">ETA Mutare</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text3 uppercase tracking-wider">Progress</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text3 uppercase tracking-wider">Cargo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text3 uppercase tracking-wider font-mono">Weight</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" className="text-center py-8 text-text3">Loading trucks...</td></tr>
            ) : filteredTrucks.length === 0 ? (
              <tr><td colSpan="10" className="text-center py-8 text-text3">No trucks found</td></tr>
            ) : (
              filteredTrucks.map(truck => (
                <tr 
                  key={truck.id} 
                  className="border-b border-border hover:bg-bg3/50 transition-colors cursor-pointer"
                  onClick={() => onTruckSelect?.(truck.id)}
                >
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-text">{truck.id}</td>
                  <td className="px-4 py-3 text-sm font-mono text-text2">{truck.plate}</td>
                  <td className="px-4 py-3 text-sm text-text">{truck.driver}</td>
                  <td className="px-4 py-3"><StatusPill status={truck.status} /></td>
                  <td className="px-4 py-3 text-sm text-text2">{truck.location}</td>
                  <td className="px-4 py-3 text-sm font-mono text-text">{truck.speed > 0 ? `${truck.speed} km/h` : '—'}</td>
                <td className="px-4 py-3 text-sm text-text2">{truck.eta}</td>
                  <td className="px-4 py-3"><ProgressBar progress={truck.progress} status={truck.status} /></td>
                  <td className="px-4 py-3 text-sm text-text2">{truck.cargo}</td>
                  <td className="px-4 py-3 text-sm font-mono text-text2">{truck.weight}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
