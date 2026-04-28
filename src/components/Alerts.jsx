import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";

const alerts = [
  { id: 1, type: 'warning', message: 'Truck T2 delayed at Macheke checkpoint', time: '14:22', truck: 'T2' },
  { id: 2, type: 'error', message: 'Engine fault detected on Truck T3', time: '13:45', truck: 'T3' },
  { id: 3, type: 'info', message: 'Truck T6 delivered successfully', time: '13:55', truck: 'T6' },
  { id: 4, type: 'warning', message: 'High speed alert: Truck T4 at 91 km/h', time: '14:15', truck: 'T4' },
  { id: 5, type: 'success', message: 'All checkpoints passed for Truck T1', time: '14:08', truck: 'T1' },
];

export default function Alerts() {
  const getAlertConfig = (type) => {
    const configs = {
      error: { bg: 'bg-red/20', border: 'border-red/40', text: 'text-red', Icon: AlertTriangle, label: 'Critical' },
      warning: { bg: 'bg-amber/20', border: 'border-amber/40', text: 'text-amber', Icon: AlertCircle, label: 'Warning' },
      info: { bg: 'bg-blue/20', border: 'border-blue/40', text: 'text-blue', Icon: Info, label: 'Info' },
      success: { bg: 'bg-green/20', border: 'border-green/40', text: 'text-green', Icon: CheckCircle2, label: 'Good' },
    };
    return configs[type] || configs.info;
  };

  return (
    <div className="bg-bg2/80 backdrop-blur-sm border border-border rounded-xl overflow-hidden glass">
      <div className="px-5 py-4 border-b border-border">
        <span className="text-sm font-semibold font-heading text-text2 uppercase tracking-wider">Alerts & Notifications</span>
      </div>
      <div className="max-h-80 overflow-y-auto">
        <div className="p-5 space-y-3">
          {alerts.map(alert => {
            const config = getAlertConfig(alert.type);
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${config.bg} ${config.border} transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer`}
              >
                <div className="flex items-start gap-3">
                  <config.Icon size={20} className={`flex-shrink-0 mt-0.5 ${config.text}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase ${config.text}`}>{config.label}</span>
                    </div>
                    <p className={`text-sm font-medium ${config.text} mb-2`}>{alert.message}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text3 font-mono">{alert.time}</span>
                      <span className="text-xs text-text3">•</span>
                      <span className="text-xs text-text2 font-mono px-2 py-1 rounded bg-bg3/50 border border-border/30">Truck {alert.truck}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
