import { useEffect, useState } from "react";

export default function Topbar() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString());
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="h-16 flex items-center justify-between px-6 border-b border-border bg-bg2/80 backdrop-blur-xl sticky top-0 z-50 glass">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 font-bold text-lg font-heading">
          <div className="w-8 h-8 flex items-center src = ass.png ">
          </div>
          <span className="neon-text text-accent">FleetTrack Global</span>
        </div>

        <span className="text-xs px-4 py-2 rounded-full border border-accent/30 bg-accent/10 text-accent font-mono glow">
          Worldwide fleet tracking
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <span className="text-green flex items-center gap-2 font-semibold">
          <div className="w-3 h-3 bg-green rounded-full pulse"></div>
          LIVE        </span>


        <span className="font-mono text-text2 bg-bg3 px-3 py-2 rounded-lg border border-border glow-blue">
          {time}
        </span>

        <button className="px-4 py-2 border border-border2 rounded-lg hover:bg-accent/10 hover:border-accent/50 transition-all duration-300 font-mono text-sm">
          ↻ Refresh
        </button>
      </div>
    </div>
  );
}
