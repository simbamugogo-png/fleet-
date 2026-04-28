import { useEffect, useState } from 'react';
import axios from 'axios';

export default function RouteDirections({ truckId, truckPlate, onClose }) {
  const [directions, setDirections] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedStep, setExpandedStep] = useState(null);

  useEffect(() => {
    const fetchDirections = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:8000/api/trucks/${truckId}/truck_trail_with_directions/`,
          { params: { limit: 300 } }
        );
        
        setDirections(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching directions:', err);
        setError(err.response?.data?.error || 'Failed to load route directions');
      } finally {
        setLoading(false);
      }
    };

    if (truckId) {
      fetchDirections();
    }
  }, [truckId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700">Loading route directions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full">
          <div className="text-red-600 mb-4">
            <p className="font-bold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!directions) {
    return null;
  }

  const { snapped_path, turn_instructions, total_distance_km, total_duration_hours, raw_trail_count } = directions;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white w-full max-w-md rounded-t-2xl shadow-2xl flex flex-col h-[90vh]">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-2xl">
          <div>
            <h2 className="font-bold text-lg">🚚 {truckPlate}</h2>
            <p className="text-sm opacity-90">Route Timeline & Directions</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Route Summary */}
        <div className="bg-blue-50 border-b border-blue-200 p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">📍 Distance Travelled</span>
            <span className="font-bold text-blue-600">{total_distance_km.toFixed(1)} km</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">⏱️ Duration</span>
            <span className="font-bold text-blue-600">{total_duration_hours.toFixed(1)}h</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">📡 GPS Points</span>
            <span className="font-bold text-blue-600">{raw_trail_count} recorded</span>
          </div>
          {directions.snapped && (
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200">
              ✓ Snapped to actual roads using OSRM
            </div>
          )}
        </div>

        {/* Turn-by-Turn Directions */}
        <div className="flex-1 overflow-y-auto">
          {turn_instructions && turn_instructions.length > 0 ? (
            <div className="p-4 space-y-3">
              <h3 className="font-bold text-gray-800 sticky top-0 bg-white py-2 border-b">
                📋 {turn_instructions.length} Turn Instructions
              </h3>
              
              {turn_instructions.map((instruction, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 line-clamp-2">
                        {instruction.instruction}
                      </p>
                      <div className="flex gap-4 mt-1 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <span className="text-lg">📏</span>
                          {instruction.distance_km.toFixed(1)} km
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-lg">⏱️</span>
                          {Math.round(instruction.duration_seconds / 60)} min
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-gray-400">
                      {expandedStep === idx ? '▼' : '▶'}
                    </div>
                  </div>

                  {expandedStep === idx && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      <p className="line-break">{instruction.instruction}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <span className="text-gray-500">Distance:</span>
                          <p className="font-mono">{instruction.distance_m}m</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Time:</span>
                          <p className="font-mono">{instruction.duration_seconds}s</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No turn instructions available</p>
              <p className="text-xs text-gray-400 mt-1">Route may still be loading or processing</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-2">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Close Directions
          </button>
          <p className="text-xs text-gray-500 text-center">
            💡 Tap any instruction to view details
          </p>
        </div>
      </div>
    </div>
  );
}
