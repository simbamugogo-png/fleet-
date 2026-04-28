import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Trucks
export const getTrucks = async (filters = {}) => {
  try {
    const response = await api.get('/trucks/', { params: filters });
    return response.data.results || response.data;
  } catch (error) {
    console.error('Error fetching trucks:', error);
    return [];
  }
};

export const getTruck = async (id) => {
  try {
    const response = await api.get(`/trucks/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching truck:', error);
    return null;
  }
};

export const createTruck = async (data) => {
  try {
    const response = await api.post('/trucks/', data);
    return response.data;
  } catch (error) {
    console.error('Error creating truck:', error);
    throw error;
  }
};

export const updateTruck = async (id, data) => {
  try {
    const response = await api.patch(`/trucks/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating truck:', error);
    return null;
  }
};

export const deleteTruck = async (id) => {
  try {
    const response = await api.delete(`/trucks/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting truck:', error);
    throw error;
  }
};

export const updateTruckStatus = async (id, status, location, speed, progress) => {
  try {
    const response = await api.patch(`/trucks/${id}/update_status/`, {
      status,
      location,
      speed,
      progress,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating truck status:', error);
    return null;
  }
};

// Checkpoints
export const getCheckpoints = async (truckId) => {
  try {
    const response = await api.get('/checkpoints/', { params: { truck: truckId } });
    return response.data.results || response.data;
  } catch (error) {
    console.error('Error fetching checkpoints:', error);
    return [];
  }
};

export const createCheckpoint = async (truckId, data) => {
  try {
    const response = await api.post('/checkpoints/', {
      truck: truckId,
      ...data,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating checkpoint:', error);
    return null;
  }
};

// Alerts
export const getAlerts = async (filters = {}) => {
  try {
    const response = await api.get('/alerts/', { params: filters });
    return response.data.results || response.data;
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
};

export const createAlert = async (truckId, alertType, message) => {
  try {
    const response = await api.post('/alerts/', {
      truck: truckId,
      alert_type: alertType,
      message,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating alert:', error);
    return null;
  }
};

export const resolveAlert = async (id) => {
  try {
    const response = await api.patch(`/alerts/${id}/resolve/`);
    return response.data;
  } catch (error) {
    console.error('Error resolving alert:', error);
    return null;
  }
};

// KPIs
export const getKPIs = async () => {
  try {
    const response = await api.get('/kpis/latest/');
    return response.data;
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return null;
  }
};

// Cargo
export const getCargo = async (truckId) => {
  try {
    const response = await api.get('/cargo/', { params: { truck: truckId } });
    return response.data.results || response.data;
  } catch (error) {
    console.error('Error fetching cargo:', error);
    return null;
  }
};

// Routes - ML-Powered Routing System
export const createOptimizedRoute = async (truckId, origin, destination, originCoordinates, destinationCoordinates) => {
  try {
    const response = await api.post('/routes/create_optimized_route/', {
      truck_id: truckId,
      origin,
      destination,
      origin_coordinates: originCoordinates,
      destination_coordinates: destinationCoordinates,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating optimized route:', error);
    throw error;
  }
};

export const getRoutes = async (filters = {}) => {
  try {
    const response = await api.get('/routes/', { params: filters });
    return response.data.results || response.data;
  } catch (error) {
    console.error('Error fetching routes:', error);
    return [];
  }
};

export const getRoute = async (routeId) => {
  try {
    const response = await api.get(`/routes/${routeId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
};

export const getActiveRoutes = async () => {
  try {
    const response = await api.get('/routes/active_routes/');
    return response.data.results || response.data;
  } catch (error) {
    console.error('Error fetching active routes:', error);
    return [];
  }
};

export const getTruckRoutes = async (truckId) => {
  try {
    const response = await api.get('/routes/truck_routes/', { params: { truck_id: truckId } });
    return response.data.results || response.data;
  } catch (error) {
    console.error('Error fetching truck routes:', error);
    return [];
  }
};

export const updateRouteProgress = async (routeId, distanceTravelled, timeElapsed, waypointIndex) => {
  try {
    const response = await api.patch(`/routes/${routeId}/update_progress/`, {
      distance_travelled_km: distanceTravelled,
      time_elapsed_hours: timeElapsed,
      current_waypoint_index: waypointIndex,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating route progress:', error);
    return null;
  }
};

export const startRoute = async (routeId) => {
  try {
    const response = await api.patch(`/routes/${routeId}/start_route/`);
    return response.data;
  } catch (error) {
    console.error('Error starting route:', error);
    return null;
  }
};

export const completeRoute = async (routeId) => {
  try {
    const response = await api.patch(`/routes/${routeId}/complete_route/`);
    return response.data;
  } catch (error) {
    console.error('Error completing route:', error);
    return null;
  }
};

// Smart Routing - ML & AI Features
export const getTruckTrail = async (truckId, limit = 100) => {
  try {
    const response = await api.get(`/trucks/${truckId}/truck_trail/`, { 
      params: { limit } 
    });
    return response.data.trail_points || [];
  } catch (error) {
    console.error('Error fetching truck trail:', error);
    return [];
  }
};

export const getTruckTrailWithDirections = async (truckId, limit = 200) => {
  try {
    const response = await api.get(`/trucks/${truckId}/truck_trail_with_directions/`, { 
      params: { limit } 
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching truck trail with directions:', error);
    return null;
  }
};

export const getQuickRoutes = async (truckId) => {
  try {
    const response = await api.get(`/trucks/${truckId}/quick_routes/`);
    return response.data.suggested_routes || [];
  } catch (error) {
    console.error('Error fetching quick routes:', error);
    return [];
  }
};

export const recordTruckPosition = async (truckId, latitude, longitude, speed = 0, heading = null, altitude = null, accuracy = null, routeId = null) => {
  try {
    const response = await api.post(`/trucks/${truckId}/record_position/`, {
      latitude,
      longitude,
      speed,
      heading,
      altitude,
      accuracy,
      route_id: routeId,
    });
    return response.data;
  } catch (error) {
    console.error('Error recording truck position:', error);
    return null;
  }
};

export const calculateOptimalRoute = async (truckId, destination, currentLocation = null) => {
  try {
    const response = await api.post('/trucks/calculate_optimal_route/', {
      truck_id: truckId,
      destination,
      current_location: currentLocation,
    });
    return response.data;
  } catch (error) {
    console.error('Error calculating optimal route:', error);
    return null;
  }
};

export default api;
