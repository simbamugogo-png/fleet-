import { useState, useEffect } from 'react';
import { AlertTriangle, Send, X, Bell, Zap, StopCircle, TrendingDown } from 'lucide-react';
import { getTrucks, createAlert, getAlerts } from '../services/api';

export default function DriverAlerts() {
  const [trucks, setTrucks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [previousSpeeds, setPreviousSpeeds] = useState({});
  const [stoppedTrucks, setStoppedTrucks] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    truckId: '',
    alertType: 'driver_report',
    message: '',
  });

  const alertTypes = [
    { value: 'driver_report', label: 'Driver Report', icon: Send },
    { value: 'speed_violation', label: 'Speed Violation', icon: Zap },
    { value: 'vehicle_stopped', label: 'Vehicle Stopped', icon: StopCircle },
    { value: 'low_speed', label: 'Unexpected Low Speed', icon: TrendingDown },
  ];

  const SPEED_LIMIT = 120; // km/h

  // Monitor trucks for automatic alerts
  useEffect(() => {
    const monitorTrucks = async () => {
      try {
        const data = await getTrucks();
        const truckList = Array.isArray(data) ? data : [];
        setTrucks(truckList);

        truckList.forEach(truck => {
          const currentSpeed = truck.speed || 0;
          const prevSpeed = previousSpeeds[truck.id] || 0;

          // Speed violation detection (exceeds speed limit)
          if (currentSpeed > SPEED_LIMIT && prevSpeed <= SPEED_LIMIT) {
            createAutoAlert(truck.id, 'speed_violation', 
              `Speed violation detected: ${currentSpeed} km/h (limit: ${SPEED_LIMIT} km/h)`);
          }

          // Speed drop detection (sudden deceleration)
          if (prevSpeed > 50 && currentSpeed < 30 && prevSpeed - currentSpeed > 20) {
            createAutoAlert(truck.id, 'low_speed',
              `Unexpected speed drop: from ${prevSpeed} to ${currentSpeed} km/h`);
          }

          // Vehicle stopped detection
          if (currentSpeed === 0 && !stoppedTrucks.has(truck.id)) {
            createAutoAlert(truck.id, 'vehicle_stopped',
              `Vehicle stopped at ${truck.location}`);
            setStoppedTrucks(prev => new Set([...prev, truck.id]));
          } else if (currentSpeed > 0 && stoppedTrucks.has(truck.id)) {
            setStoppedTrucks(prev => {
              const newSet = new Set(prev);
              newSet.delete(truck.id);
              return newSet;
            });
          }
        });

        // Update previous speeds
        const newSpeeds = {};
        truckList.forEach(truck => {
          newSpeeds[truck.id] = truck.speed || 0;
        });
        setPreviousSpeeds(newSpeeds);
      } catch (error) {
        console.error('Error monitoring trucks:', error);
      }
    };

    const interval = setInterval(monitorTrucks, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [previousSpeeds, stoppedTrucks]);

  // Fetch alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await getAlerts({ is_resolved: false });
        setAlerts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const createAutoAlert = async (truckId, alertType, message) => {
    // Check if similar alert already exists recently
    const existingAlert = alerts.find(
      a => a.truck === truckId && 
           a.alert_type === alertType && 
           a.is_resolved === false
    );

    if (!existingAlert) {
      await createAlert(truckId, alertType, message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.truckId || !formData.message) {
      alert('Please select a truck and enter a message');
      return;
    }

    setLoading(true);
    try {
      await createAlert(formData.truckId, formData.alertType, formData.message);
      setFormData({ truckId: '', alertType: 'driver_report', message: '' });
      setShowForm(false);

      // Refresh alerts
      const data = await getAlerts({ is_resolved: false });
      setAlerts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error creating alert:', error);
      alert('Failed to create alert');
    } finally {
      setLoading(false);
    }
  };

  const getAlertColor = (alertType) => {
    switch (alertType) {
      case 'speed_violation':
        return 'bg-red/10 border-red/30 text-red';
      case 'vehicle_stopped':
        return 'bg-amber/10 border-amber/30 text-amber';
      case 'low_speed':
        return 'bg-yellow/10 border-yellow/30 text-yellow';
      case 'driver_report':
        return 'bg-blue/10 border-blue/30 text-blue';
      default:
        return 'bg-text3/10 border-text3/30 text-text3';
    }
  };

  const getAlertIcon = (alertType) => {
    const type = alertTypes.find(t => t.value === alertType);
    return type?.icon || AlertTriangle;
  };

  return (
    <div className="bg-bg2/80 backdrop-blur-sm border border-border rounded-xl overflow-hidden glass">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-blue" />
          <div>
            <h2 className="text-lg font-heading font-semibold text-text1">Fleet Alerts</h2>
            <p className="text-xs text-text3 mt-0.5">Real-time monitoring & driver reports</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={showForm}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue/20 border border-blue/40 text-blue rounded-lg hover:bg-blue/30 transition-all text-sm disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          Send Alert
        </button>
      </div>

      {/* Alert Form Modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <div className="bg-slate-900 border-2 border-blue-500 rounded-xl max-w-md w-full flex flex-col shadow-2xl pointer-events-auto" style={{ maxHeight: '90vh' }}>
              {/* Header */}
              <div className="px-6 py-4 border-b border-blue-500 flex items-center justify-between flex-shrink-0 bg-slate-800">
                <h3 className="text-lg font-heading font-bold text-white">Report Alert</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form */}
              <div className="flex-1 overflow-y-auto px-6 py-4 bg-slate-900">
                <form id="alert-form" onSubmit={handleSubmit} className="space-y-4">
                  {/* Truck Selection */}
                  <div>
                    <label className="block text-sm font-mono text-gray-300 mb-2 font-semibold">Select Truck</label>
                    <select
                      name="truckId"
                      value={formData.truckId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="">-- Choose a truck --</option>
                      {trucks.map(truck => (
                        <option key={truck.id} value={truck.id}>
                          {truck.id} - {truck.plate} ({truck.driver})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Alert Type */}
                  <div>
                    <label className="block text-sm font-mono text-gray-300 mb-2 font-semibold">Alert Type</label>
                    <select
                      name="alertType"
                      value={formData.alertType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      style={{ colorScheme: 'dark' }}
                    >
                      {alertTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-mono text-gray-300 mb-2 font-semibold">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Describe the issue... (Ctrl+Enter to send)"
                      required
                      rows="4"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                </form>
              </div>

              {/* Footer - Fixed Buttons */}
              <div className="px-6 py-4 border-t border-blue-500 bg-slate-800 flex gap-3 flex-shrink-0 rounded-b-xl">
                <button
                  form="alert-form"
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all disabled:opacity-50 font-semibold shadow-lg"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Sending...' : 'Send Alert'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 border border-slate-600 text-gray-300 rounded-lg hover:bg-slate-600 transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Alerts List */}
      <div className="max-h-96 overflow-y-auto">
        {alerts.length > 0 ? (
          <div className="divide-y divide-border/30">
            {alerts.map(alert => {
              const AlertIcon = getAlertIcon(alert.alert_type);
              const truck = trucks.find(t => t.id === alert.truck);

              return (
                <div key={alert.id} className={`p-4 border-l-4 ${getAlertColor(alert.alert_type)}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <AlertIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">
                            {truck ? `${truck.plate} - ${truck.driver}` : `Truck ${alert.truck}`}
                          </p>
                          <span className="text-xs font-mono capitalize px-2 py-0.5 bg-text3/10 rounded text-text3">
                            {alert.alert_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-text2 mt-1">{alert.message}</p>
                        <p className="text-xs text-text3 mt-2 font-mono">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-text3">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No active alerts</p>
            <p className="text-xs mt-1">All systems operating normally</p>
          </div>
        )}
      </div>
    </div>
  );
}
