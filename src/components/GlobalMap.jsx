import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getTrucks, getActiveRoutes } from '../services/api';
import { getCoordinates } from '../data/locations';
import RouteDirections from './RouteDirections';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const STATUS_COLORS = {
  moving: '#3b82f6',    // blue
  delayed: '#f59e0b',   // amber
  stopped: '#ef4444',   // red
  delivered: '#8b5cf6', // purple
  maintenance: '#ec4899', // pink
};

const STATUS_LABELS = {
  moving: 'Moving',
  delayed: 'Delayed',
  stopped: 'Stopped',
  delivered: 'Delivered',
  maintenance: 'Maintenance',
};

export default function GlobalMap({ onTruckSelect }) {
  const mapRef = useRef(null);
  const map = useRef(null);
  const markersRef = useRef({});
  const routeLinesRef = useRef({});
  const trailLinesRef = useRef({});
  const truckTrailsRef = useRef({});
  const alternativeRoutesRef = useRef({});
  const [trucks, setTrucks] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [showDirections, setShowDirections] = useState(false);
  const [selectedTruckData, setSelectedTruckData] = useState(null);
  const [showAlternativeRoutes, setShowAlternativeRoutes] = useState(false);

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    map.current = L.map(mapRef.current).setView([-17.8252, 31.0335], 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      minZoom: 3,
    }).addTo(map.current);
  }, []);

  // Fetch trucks and routes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const trucksData = await getTrucks();
        const routesData = await getActiveRoutes();
        
        const trucksList = Array.isArray(trucksData) ? trucksData : [];
        const routesList = Array.isArray(routesData) ? routesData : [];
        
        console.log('📍 Trucks fetched:', trucksList.length);
        console.log('🛣️  Routes fetched:', routesList.length);
        
        setTrucks(trucksList);
        setRoutes(routesList);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Update every 5s for real-time tracking
    return () => clearInterval(interval);
  }, []);

  // Draw routes on map with road-following waypoints and origin/destination markers
  useEffect(() => {
    if (!map.current || !routes.length) return;

    // Clear old route lines
    Object.values(routeLinesRef.current).forEach(line => line.remove());
    Object.values(trailLinesRef.current).forEach(line => line.remove());
    routeLinesRef.current = {};
    trailLinesRef.current = {};

    routes.forEach(route => {
      if (!route.waypoints || route.waypoints.length === 0) return;

      // Create full route path (all waypoints - road-following)
      const routePath = route.waypoints.map(wp => [wp.lat, wp.lng]);
      
      // Calculate current position on route (based on progress/distance travelled)
      const truckProgress = route.distance_travelled_km / route.distance_km;
      const currentWaypointIdx = Math.floor(truckProgress * route.waypoints.length);

      // Split into past trail (completed - where truck HAS BEEN) and future route (remaining - where it's GOING)
      const trailPath = routePath.slice(0, currentWaypointIdx + 1);
      const futurePath = routePath.slice(currentWaypointIdx);

      // Draw completed trail (dashed, green - shows truck history)
      if (trailPath.length > 1) {
        const trailLine = L.polyline(trailPath, {
          color: '#10b981',  // Green for completed
          weight: 2.5,
          opacity: 0.6,
          dashArray: '5, 5',
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map.current);

        // Trail popup with history info
        const trailPopup = `
          <div style="font-family: monospace; font-size: 10px;">
            <strong style="color: #10b981;">📍 Truck History Trail</strong>
            <hr style="margin: 4px 0; border: none; border-top: 1px solid #ddd;">
            <p><strong>${route.distance_travelled_km.toFixed(1)} km</strong> completed</p>
          </div>
        `;
        trailLine.bindPopup(trailPopup);
        trailLinesRef.current[`trail_${route.id}`] = trailLine;
      }

      // Draw future route (solid, bright blue - shows where truck is GOING with origin/destination)
      if (futurePath.length > 1) {
        const routeLine = L.polyline(futurePath, {
          color: '#0ea5e9',  // Cyan for remaining
          weight: 3,
          opacity: 0.8,
          dashArray: '0',
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map.current);

        // Add popup with detailed route info
        const popupContent = `
          <div style="font-family: monospace; font-size: 11px;">
            <strong style="font-size: 13px; color: #0ea5e9;">🛣️ Route Path</strong>
            <hr style="margin: 4px 0; border: none; border-top: 1px solid #ccc;">
            <table style="width: 100%;">
              <tr><td>🚩 Origin:</td><td style="text-align: right;"><strong>${route.origin}</strong></td></tr>
              <tr><td>📍 Destination:</td><td style="text-align: right;"><strong>${route.destination}</strong></td></tr>
              <tr><td>Distance:</td><td style="text-align: right;"><strong>${route.distance_km.toFixed(1)} km</strong></td></tr>
              <tr><td>Duration:</td><td style="text-align: right;"><strong>${route.estimated_duration_hours.toFixed(1)}h</strong></td></tr>
              <tr><td>Status:</td><td style="text-align: right;"><strong>${route.status.toUpperCase()}</strong></td></tr>
              <tr><td>Efficiency:</td><td style="text-align: right;"><strong>${route.optimization_score.toFixed(0)}/100</strong></td></tr>
            </table>
          </div>
        `;

        routeLine.bindPopup(popupContent);
        routeLinesRef.current[route.id] = routeLine;
      }

      // Add origin and destination markers on the route
      if (route.origin_coordinates) {
        const originMarker = L.circleMarker([route.origin_coordinates.lat, route.origin_coordinates.lng], {
          radius: 6,
          fillColor: '#10b981',
          color: '#065f46',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).bindPopup(`<strong>🚩 Origin: ${route.origin}</strong>`).addTo(map.current);
        
        routeLinesRef.current[`origin_${route.id}`] = originMarker;
      }

      if (route.destination_coordinates) {
        const destMarker = L.circleMarker([route.destination_coordinates.lat, route.destination_coordinates.lng], {
          radius: 8,
          fillColor: '#ef4444',
          color: '#991b1b',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).bindPopup(`<strong>🎯 Destination: ${route.destination}</strong>`).addTo(map.current);
        
        routeLinesRef.current[`dest_${route.id}`] = destMarker;
      }
    });
  }, [routes]);

  // Update markers on map with actual coordinates and route display
  useEffect(() => {
    if (!map.current || !trucks.length) return;

    // Clear old markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Group trucks by location to offset overlapping markers
    const trucksByLocation = {};
    trucks.forEach(truck => {
      const key = truck.location;
      if (!trucksByLocation[key]) {
        trucksByLocation[key] = [];
      }
      trucksByLocation[key].push(truck);
    });

    // Add new markers at actual truck coordinates with offset for overlapping trucks
    trucks.forEach((truck) => {
      const coords = getCoordinates(truck.location);
      if (!coords) {
        console.warn(`⚠️ Location "${truck.location}" not found for truck ${truck.id}`);
        return;
      }

      // Calculate offset for trucks at same location
      const trucksAtLocation = trucksByLocation[truck.location];
      const truckIndexAtLocation = trucksAtLocation.findIndex(t => t.id === truck.id);
      const offsetDistance = 0.01 * (truckIndexAtLocation % 3);
      const offsetAngle = (truckIndexAtLocation / trucksAtLocation.length) * Math.PI * 2;
      
      const offsetLat = coords.lat + (Math.sin(offsetAngle) * offsetDistance);
      const offsetLng = coords.lng + (Math.cos(offsetAngle) * offsetDistance);

      const color = STATUS_COLORS[truck.status] || '#64748b';
      const statusLabel = STATUS_LABELS[truck.status] || truck.status;
      const isSelected = selectedTruck === truck.id;
      
      // Find route for this truck
      const truckRoute = routes.find(r => r.truck_id === truck.id || r.truck === truck.id);

      // Enhanced marker with location pin icon
      const html = `
        <svg width="40" height="55" viewBox="0 0 40 55" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <!-- Location Pin -->
          <path d="M20 0 C 10 0, 2 8, 2 20 C 2 30, 20 50, 20 50 C 20 50, 38 30, 38 20 C 38 8, 30 0, 20 0" fill="${color}" stroke="white" stroke-width="1.5"/>
          <!-- Inner Circle -->
          <circle cx="20" cy="20" r="8" fill="white" stroke="${color}" stroke-width="2"/>
          <!-- Truck Indicator -->
          <circle cx="20" cy="20" r="4" fill="${color}"/>
        </svg>
        <div style="
          position: absolute;
          top: 30px;
          left: 50%;
          transform: translateX(-50%);
          background: ${color};
          color: white;
          padding: 3px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          font-family: monospace;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        ">
          ${truck.id}
        </div>
      `;

      let popupContent = `
        <div style="font-family: monospace; font-size: 12px; min-width: 240px;">
          <strong style="font-size: 14px; color: ${color};">🚚 ${truck.plate}</strong>
          <hr style="margin: 4px 0; border: none; border-top: 1px solid #ccc;">
          <table style="width: 100%; font-size: 11px;">
            <tr><td>ID:</td><td style="text-align: right;"><strong>${truck.id}</strong></td></tr>
            <tr><td>Driver:</td><td style="text-align: right;"><strong>${truck.driver}</strong></td></tr>
            <tr><td>Status:</td><td style="text-align: right;"><strong style="color: ${color};">${statusLabel}</strong></td></tr>
            <tr><td>Speed:</td><td style="text-align: right;"><strong>${truck.speed} km/h</strong></td></tr>
            <tr><td>Current:</td><td style="text-align: right;"><strong>${truck.location}</strong></td></tr>
      `;
      
      // Add route info if available
      if (truckRoute) {
        const progress = (truckRoute.distance_travelled_km / truckRoute.distance_km * 100).toFixed(0);
        popupContent += `
            <tr><td colspan="2" style="border-top: 1px solid #ddd; padding-top: 4px; color: #0ea5e9; font-weight: bold;">📍 Route Info</td></tr>
            <tr><td>Route:</td><td style="text-align: right;"><strong>${truckRoute.origin} → ${truckRoute.destination}</strong></td></tr>
            <tr><td>Progress:</td><td style="text-align: right;"><strong style="color: #10b981;">${progress}% ✓</strong></td></tr>
            <tr><td>📊 Travelled:</td><td style="text-align: right;"><strong>${truckRoute.distance_travelled_km.toFixed(1)}/${truckRoute.distance_km.toFixed(1)} km</strong></td></tr>
            <tr><td>⏱️ Duration:</td><td style="text-align: right;"><strong>${truckRoute.estimated_duration_hours.toFixed(1)}h</strong></td></tr>
            <tr><td>⚡ Efficiency:</td><td style="text-align: right;"><strong>${truckRoute.optimization_score.toFixed(0)}/100</strong></td></tr>
        `;
      }
      
      popupContent += `
            <tr><td>Progress:</td><td style="text-align: right;"><strong>${truck.progress}%</strong></td></tr>
            <tr><td>ETA:</td><td style="text-align: right;"><strong>${truck.eta}</strong></td></tr>
            <tr><td>Cargo:</td><td style="text-align: right;">${truck.cargo}</td></tr>
          </table>
          <button onclick="alert('Truck ${truck.plate} selected')" 
            style="margin-top: 8px; width: 100%; padding: 6px; background: ${color}; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
            View Details
          </button>
        </div>
      `;

      const marker = L.marker([offsetLat, offsetLng], {
        icon: L.divIcon({
          html,
          className: 'truck-marker',
          iconSize: [40, 70],
          iconAnchor: [20, 70],
          popupAnchor: [0, -60],
        }),
      })
        .bindPopup(popupContent)
        .on('click', () => {
          setSelectedTruck(truck.id);
          setSelectedTruckData(truck);
          onTruckSelect?.(truck.id);
          map.current?.setView([offsetLat, offsetLng], 10);
        })
        .addTo(map.current);

      markersRef.current[truck.id] = marker;
    });
  }, [trucks, routes, selectedTruck, onTruckSelect]);

  // Load and display snapped truck trails (Google Maps style)
  useEffect(() => {
    if (!selectedTruck || !map.current) return;

    // Clear old truck-specific trails
    if (truckTrailsRef.current[selectedTruck]) {
      truckTrailsRef.current[selectedTruck].forEach(layer => layer.remove());
    }
    truckTrailsRef.current[selectedTruck] = [];

    const loadTrail = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/trucks/${selectedTruck}/truck_trail_with_directions/?limit=300`
        );
        const data = await response.json();

        if (!data.snapped_path) {
          console.warn('No snapped path available');
          return;
        }

        // Draw the snapped trail (actual road path)
        const trailCoordinates = data.snapped_path.map(p => [p.lat, p.lng]);
        
        if (trailCoordinates.length > 1) {
          const trailLine = L.polyline(trailCoordinates, {
            color: '#06b6d4',      // Cyan - the actual road the truck took
            weight: 4,
            opacity: 0.9,
            dashArray: '0',
            lineCap: 'round',
            lineJoin: 'round',
            className: 'truck-trail-snapped'
          }).addTo(map.current);

          const popupText = `
            <div style="font-family: monospace; font-size: 11px;">
              <strong style="color: #06b6d4;">🛣️ Truck Trail (Road-Snapped)</strong>
              <hr style="margin: 4px 0; border: none; border-top: 1px solid #ccc;">
              <p><strong>${data.total_distance_km.toFixed(1)} km</strong> travelled</p>
              <p><strong>${data.total_duration_hours.toFixed(1)}h</strong> duration</p>
              <p><strong>${data.raw_trail_count}</strong> GPS points</p>
              <p style="color: #10b981; margin-top: 4px;">✓ Snapped to roads</p>
            </div>
          `;
          
          trailLine.bindPopup(popupText);
          truckTrailsRef.current[selectedTruck].push(trailLine);

          // Add start and end markers
          if (trailCoordinates.length > 0) {
            const startMarker = L.circleMarker(trailCoordinates[0], {
              radius: 8,
              fillColor: '#10b981',
              color: '#065f46',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.9
            }).bindPopup('<strong>🟢 Trail Start</strong>').addTo(map.current);
            
            const endMarker = L.circleMarker(trailCoordinates[trailCoordinates.length - 1], {
              radius: 8,
              fillColor: '#3b82f6',
              color: '#1e40af',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.9
            }).bindPopup('<strong>🔵 Trail End</strong>').addTo(map.current);

            truckTrailsRef.current[selectedTruck].push(startMarker, endMarker);
          }
        }
      } catch (err) {
        console.error('Error loading truck trail:', err);
      }
    };

    loadTrail();
  }, [selectedTruck]);

  const handleShowDirections = () => {
    setShowDirections(true);
  };

  const handleCloseDirections = () => {
    setShowDirections(false);
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-bg2 to-bg3">
        <div>
          <span className="text-sm font-semibold font-heading text-text1 uppercase tracking-wider">
            🗺️ Smart Global Map - Google Maps Style
          </span>
          <p className="text-xs text-text3 mt-1">Real-time road-snapped trails, turn-by-turn directions & quick routes</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-4 text-xs">
            <div className="text-right">
              <div className="text-lg font-bold text-text1">{trucks.length}</div>
              <div className="text-xs text-text3 font-mono">Trucks</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-text1">{routes.length}</div>
              <div className="text-xs text-text3 font-mono">Routes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Truck Info & Controls Panel */}
      {selectedTruck && selectedTruckData && (
        <div className="bg-blue-50 border-b border-blue-200 p-3 flex items-center justify-between">
          <div>
            <p className="font-bold text-blue-900">🚚 {selectedTruckData.plate}</p>
            <p className="text-xs text-blue-700">{selectedTruckData.driver} • {selectedTruckData.location}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShowDirections}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-semibold transition-colors"
            >
              📋 Directions
            </button>
            <button
              onClick={() => {
                setSelectedTruck(null);
                setSelectedTruckData(null);
                map.current?.setView([-17.8252, 31.0335], 5);
              }}
              className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm rounded font-semibold transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute top-24 left-4 bg-white bg-opacity-95 p-3 rounded-lg shadow-lg z-10 text-xs font-mono max-w-xs">
        <div className="font-bold mb-2 text-text1">🗺️ Map Legend</div>
        <div className="space-y-1.5 text-text2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 border-t-2 border-cyan-500"></div>
            <span>🛣️ Road-Snapped Trail</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 border border-green-700"></div>
            <span>🟢 Trail Start Point</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-700"></div>
            <span>🔵 Trail End Point</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 border border-green-700"></div>
            <span>🚩 Route Origin</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 border border-red-700"></div>
            <span>🎯 Route Destination</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-300">
            <p className="text-gray-600 text-xs font-bold">✨ Features:</p>
            <p className="text-gray-600 text-xs">• OSRM road-snapping</p>
            <p className="text-gray-600 text-xs">• Turn-by-turn directions</p>
            <p className="text-gray-600 text-xs">• GPS trail visualization</p>
            <p className="text-gray-600 text-xs">• Click truck → View directions</p>
          </div>
        </div>
      </div>

      <div ref={mapRef} style={{ height: '600px', width: '100%', background: '#f0f0f0' }} className="rounded-b-xl relative flex-1" />

      {/* Directions Panel */}
      {showDirections && selectedTruckData && (
        <RouteDirections
          truckId={selectedTruck}
          truckPlate={selectedTruckData.plate}
          onClose={handleCloseDirections}
        />
      )}
    </div>
  );
}
