import { useState, useEffect } from "react";
import { TrendingUp, CheckCircle2, Gauge, Package, AlertTriangle, Zap } from "lucide-react";
import { getTrucks, getAlerts } from '../services/api';

export default function KPICards() {
  const [kpis, setKpis] = useState({
    activeTrucks: 0,
    onTimeRate: 0,
    avgSpeed: 0,
    totalDeliveries: 0,
    criticalAlerts: 0,
    speedViolations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateKPIs = async () => {
      try {
        const [trucksData, alertsData] = await Promise.all([
          getTrucks(),
          getAlerts({ is_resolved: false }),
        ]);

        const trucks = Array.isArray(trucksData) ? trucksData : [];
        const alerts = Array.isArray(alertsData) ? alertsData : [];

        // Calculate metrics
        const activeTrucks = trucks.filter(t => t.status !== 'stopped' && t.status !== 'delivered').length;
        const deliveredTrucks = trucks.filter(t => t.status === 'delivered').length;
        const onTimeCount = trucks.filter(t => t.status === 'delivered' && parseInt(t.progress) >= 100).length;
        const onTimeRate = trucks.length > 0 ? Math.round((onTimeCount / trucks.length) * 100) : 0;
        const avgSpeed = trucks.length > 0 ? Math.round(trucks.reduce((sum, t) => sum + (t.speed || 0), 0) / trucks.length) : 0;
        const speedViolations = alerts.filter(a => a.alert_type === 'speed_violation').length;
        const criticalAlerts = alerts.filter(a => a.is_resolved === false).length;

        setKpis({
          activeTrucks,
          onTimeRate,
          avgSpeed,
          totalDeliveries: deliveredTrucks,
          criticalAlerts,
          speedViolations,
        });
      } catch (error) {
        console.error('Error calculating KPIs:', error);
      } finally {
        setLoading(false);
      }
    };

    calculateKPIs();
    const interval = setInterval(calculateKPIs, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const cards = [
    {
      label: "Active Trucks",
      value: kpis.activeTrucks,
      Icon: TrendingUp,
      iconColor: "text-green",
      sub: "Currently moving",
      color: "text-green",
    },
    {
      label: "On-Time Rate",
      value: `${kpis.onTimeRate}%`,
      Icon: CheckCircle2,
      iconColor: kpis.onTimeRate >= 80 ? "text-green" : "text-amber",
      sub: kpis.onTimeRate >= 80 ? "Good performance" : "Needs improvement",
      color: kpis.onTimeRate >= 80 ? "text-green" : "text-amber",
    },
    {
      label: "Avg Speed",
      value: kpis.avgSpeed,
      unit: "km/h",
      Icon: Gauge,
      iconColor: kpis.avgSpeed > 100 ? "text-amber" : "text-blue",
      sub: kpis.avgSpeed > 100 ? "High average" : "Within limits",
      color: kpis.avgSpeed > 100 ? "text-amber" : "text-blue",
    },
    {
      label: "Deliveries",
      value: kpis.totalDeliveries,
      Icon: Package,
      iconColor: "text-purple",
      sub: "Completed",
      color: "text-purple",
    },
    {
      label: "Speed Violations",
      value: kpis.speedViolations,
      Icon: Zap,
      iconColor: kpis.speedViolations > 0 ? "text-red" : "text-green",
      sub: kpis.speedViolations > 0 ? "Attention needed" : "All safe",
      color: kpis.speedViolations > 0 ? "text-red" : "text-green",
    },
    {
      label: "Critical Alerts",
      value: kpis.criticalAlerts,
      Icon: AlertTriangle,
      iconColor: kpis.criticalAlerts > 0 ? "text-red" : "text-green",
      sub: kpis.criticalAlerts > 0 ? "Unresolved" : "All clear",
      color: kpis.criticalAlerts > 0 ? "text-red" : "text-green",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className={`bg-bg2/80 backdrop-blur-sm border rounded-xl p-4 hover:border-border2 transition-all duration-300 hover:scale-105 hover:shadow-lg group ${
            c.color === "text-red"
              ? "border-red/30"
              : c.color === "text-amber"
              ? "border-amber/30"
              : c.color === "text-green"
              ? "border-green/30"
              : "border-border"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-text3 uppercase font-mono tracking-wider">{c.label}</p>
            <c.Icon size={20} className={`${c.iconColor}`} />
          </div>
          <h2 className={`text-2xl font-bold font-heading mb-1 ${c.color} neon-text`}>
            {loading ? "..." : c.value}
            {c.unit ? <span className="text-sm"> {c.unit}</span> : ""}
          </h2>
          <div className="text-xs text-text2 font-mono">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
