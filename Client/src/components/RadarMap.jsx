import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCategoryStyle } from '../utils/categoryStyles';

// Calculate distance between two GPS coordinates using Haversine formula
export function getDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

// Calculate estimated travel time in minutes based on average city driving speed (25 km/h)
function getEstimatedMinutes(distanceKm) {
  if (!distanceKm) return 5;
  const mins = Math.round((distanceKm / 25) * 60);
  return Math.max(mins, 3);
}

// Recruiter user beacon icon (Uber-style black & white pickup point with pulse ring)
const recruiterIcon = L.divIcon({
  className: 'custom-leaflet-icon',
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; cursor: grab;">
      <div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: rgba(37, 99, 235, 0.4); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: relative; width: 24px; height: 24px; border-radius: 9999px; background: #0f172a; border: 3px solid #ffffff; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45); display: flex; align-items: center; justify-content: center;">
        <div style="width: 7px; height: 7px; border-radius: 9999px; background: #38bdf8;"></div>
      </div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22]
});

// Helper component to smoothly pan/zoom the map when location changes
function ChangeMapView({ coords, zoom = 14 }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length === 2 && coords[0] && coords[1]) {
      map.flyTo(coords, zoom, { duration: 1.2 });
    }
  }, [coords, zoom, map]);
  return null;
}

// Click anywhere on map to reposition pin (Uber style)
function MapClickHandler({ onLocationChange }) {
  useMapEvents({
    click: (e) => {
      onLocationChange([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

const TILE_PROVIDERS = {
  streets: {
    name: '🗺️ Navigation',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Street Navigation'
  },
  osm: {
    name: '🏙️ OpenStreet',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  satellite: {
    name: '🛰️ Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Earthstar Geographics'
  }
};

const POPULAR_CITIES = [
  { name: 'Delhi NCR', coords: [28.6139, 77.2090] },
  { name: 'Mumbai', coords: [19.0760, 72.8777] },
  { name: 'Bengaluru', coords: [12.9716, 77.5946] },
  { name: 'Hyderabad', coords: [17.3850, 78.4867] },
  { name: 'Pune', coords: [18.5204, 73.8567] },
  { name: 'Chennai', coords: [13.0827, 80.2707] },
  { name: 'Kolkata', coords: [22.5726, 88.3639] }
];

export default function RadarMap({
  workers = [],
  onSelectWorker,
  userLocation,
  setUserLocation,
  radiusKm = 15,
  setRadiusKm
}) {
  const [geoError, setGeoError] = useState('');
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [tileMode, setTileMode] = useState('streets');
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [resolvedAddress, setResolvedAddress] = useState('');
  const markerRef = useRef(null);

  // Default fallback center
  const defaultCoords = [28.6139, 77.2090];
  const activeLocation = userLocation && userLocation.length === 2 && userLocation[0] && userLocation[1]
    ? userLocation
    : defaultCoords;

  // Auto-detect browser GPS on component mount ONLY if user has no saved preference
  useEffect(() => {
    const hasSaved = localStorage.getItem('skillbridge_user_location');
    if (!hasSaved && navigator.geolocation && (!userLocation || (userLocation[0] === 28.6139 && userLocation[1] === 77.2090))) {
      handleDetectLocation();
    }
  }, []);

  // Reverse geocode to display real neighborhood name when activeLocation changes
  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${activeLocation[0]}&lon=${activeLocation[1]}`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        if (data?.display_name) {
          const parts = data.display_name.split(',').slice(0, 3).join(', ');
          setResolvedAddress(parts);
        } else {
          setResolvedAddress(`${activeLocation[0].toFixed(4)}, ${activeLocation[1].toFixed(4)}`);
        }
      } catch (e) {
        setResolvedAddress(`${activeLocation[0].toFixed(4)}, ${activeLocation[1].toFixed(4)}`);
      }
    };

    fetchAddress();
  }, [activeLocation[0], activeLocation[1]]);

  // High-accuracy GPS detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (setUserLocation) {
          setUserLocation([latitude, longitude]);
        }
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation warning:', err.message);
        setGeoError('Could not auto-detect GPS (or permission blocked). Use the search bar or click anywhere on the map to set your location.');
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  // Real-world address geocoding search (OpenStreetMap Nominatim)
  const handleAddressSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || searching) return;

    setSearching(true);
    setGeoError('');

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (setUserLocation) {
          setUserLocation([lat, lon]);
        }
        setSearchQuery('');
      } else {
        setGeoError('Location not found. Try entering a city or area (e.g. "Indiranagar", "Bandra", "Powai").');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setGeoError('Could not reach geocoder service.');
    } finally {
      setSearching(false);
    }
  };

  // Handle marker drag end to update location
  const handleMarkerDragEnd = () => {
    const marker = markerRef.current;
    if (marker != null) {
      const latLng = marker.getLatLng();
      if (setUserLocation) {
        setUserLocation([latLng.lat, latLng.lng]);
      }
    }
  };

  // Worker pin icons with trade initial and online indicator
  const createWorkerIcon = (worker, isOnline, isSelected) => {
    const name = worker.fullName || worker.name || 'Pro';
    const initial = name[0]?.toUpperCase() || 'W';
    const borderColor = isSelected ? '#2563eb' : '#ffffff';
    const bgGradient = isSelected
      ? 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
      : 'linear-gradient(135deg, #0f172a 0%, #334155 100%)';

    const ringPulse = isOnline
      ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: rgba(16, 185, 129, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
      : '';

    return L.divIcon({
      className: 'custom-worker-icon',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; cursor: pointer;">
          ${ringPulse}
          <div style="position: relative; width: 34px; height: 34px; border-radius: 12px; background: ${bgGradient}; border: 2.5px solid ${borderColor}; box-shadow: 0 6px 14px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 900; font-size: 14px;">
            ${initial}
          </div>
          <div style="position: absolute; top: -2px; right: -2px; width: 12px; height: 12px; border-radius: 9999px; background: ${
            isOnline ? '#10b981' : '#94a3b8'
          }; border: 2px solid #ffffff;"></div>
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
      popupAnchor: [0, -21]
    });
  };

  // Active worker coordinates resolver
  const getWorkerCoords = (worker, idx) => {
    let lat = worker.location?.coordinates?.[1];
    let lng = worker.location?.coordinates?.[0];

    // If coordinates are missing, provide a natural spread around the recruiter
    if (!lat || !lng || (lat === 0 && lng === 0)) {
      const angle = (idx * (360 / Math.max(workers.length, 1))) * (Math.PI / 180);
      const distanceOffset = 0.012 + (idx % 3) * 0.008;
      lat = activeLocation[0] + Math.sin(angle) * distanceOffset;
      lng = activeLocation[1] + Math.cos(angle) * distanceOffset;
    }
    return [lat, lng];
  };

  // Selected worker details
  const selectedWorker = workers.find((w) => (w._id || w.id) === selectedWorkerId);
  const selectedWorkerCoords = selectedWorker
    ? getWorkerCoords(selectedWorker, workers.indexOf(selectedWorker))
    : null;

  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      {/* Top Address & Navigation Bar */}
      <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Real Address Search Input */}
          <form onSubmit={handleAddressSearch} className="flex-1 flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                placeholder="Type your area (e.g. Connaught Place, Bandra, HSR Layout)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-black transition disabled:opacity-50"
            >
              {searching ? '...' : 'Search'}
            </button>
          </form>

          {/* Action buttons & Tile Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200">
              {Object.entries(TILE_PROVIDERS).map(([key, provider]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTileMode(key)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                    tileMode === key
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {provider.name}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={locating}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
            >
              <span>{locating ? '🛰️ Detecting...' : '🎯 Auto-Detect GPS'}</span>
            </button>

            {setRadiusKm && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <span className="text-xs font-semibold text-slate-600">
                  Radius: <b className="text-blue-600 font-bold">{radiusKm}km</b>
                </span>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-24 accent-blue-600 cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* Live Active Address Pill + Quick City Jump */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <span className="font-bold text-slate-900 truncate">
              📍 Current Location: <span className="font-semibold text-blue-700">{resolvedAddress || 'Resolving address...'}</span>
            </span>
            <span className="text-[11px] text-slate-400 italic hidden sm:inline">
              (Drag pin or click anywhere on map to move)
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400">Jump To:</span>
            {POPULAR_CITIES.map((city) => (
              <button
                key={city.name}
                type="button"
                onClick={() => setUserLocation && setUserLocation(city.coords)}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition"
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {geoError && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800 font-medium">
          ⚠️ {geoError}
        </div>
      )}

      {/* Main Interactive Map Canvas */}
      <div className="relative h-[600px] w-full rounded-3xl overflow-hidden border border-slate-200 shadow-md">
        <MapContainer
          center={activeLocation}
          zoom={14}
          scrollWheelZoom={true}
          className="h-full w-full z-0 cursor-crosshair"
        >
          <ChangeMapView coords={activeLocation} zoom={14} />
          <MapClickHandler onLocationChange={setUserLocation} />

          {/* High-Definition Real Map Tiles */}
          <TileLayer
            attribution={TILE_PROVIDERS[tileMode].attribution}
            url={TILE_PROVIDERS[tileMode].url}
            maxZoom={19}
          />

          {/* Radar Boundary Circle */}
          <Circle
            center={activeLocation}
            radius={radiusKm * 1000}
            pathOptions={{
              color: '#2563eb',
              fillColor: '#3b82f6',
              fillOpacity: 0.05,
              weight: 1.5,
              dashArray: '5, 5'
            }}
          />

          {/* Recruiter Location Pin (Draggable Pickup Point) */}
          <Marker
            draggable={true}
            eventHandlers={{ dragend: handleMarkerDragEnd }}
            position={activeLocation}
            icon={recruiterIcon}
            ref={markerRef}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-2 text-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                  Service Pickup Point
                </span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {resolvedAddress || 'Your Location'}
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-1">
                  Drag pin or click map to move
                </p>
              </div>
            </Popup>
          </Marker>

          {/* Uber Route Line (Polyline) to Selected Worker */}
          {selectedWorkerCoords && (
            <Polyline
              positions={[selectedWorkerCoords, activeLocation]}
              pathOptions={{
                color: '#2563eb',
                weight: 4,
                dashArray: '8, 8',
                opacity: 0.8
              }}
            />
          )}

          {/* Worker Pins */}
          {workers.map((worker, idx) => {
            const coords = getWorkerCoords(worker, idx);
            const dist = getDistanceKm(activeLocation[0], activeLocation[1], coords[0], coords[1]);
            const etaMins = getEstimatedMinutes(dist);
            const name = worker.fullName || worker.name || 'Pro Specialist';
            const isSelected = (worker._id || worker.id) === selectedWorkerId;

            return (
              <Marker
                key={worker._id || idx}
                position={coords}
                icon={createWorkerIcon(worker, worker.isOnline, isSelected)}
                eventHandlers={{
                  click: () => {
                    setSelectedWorkerId(worker._id || worker.id);
                  }
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-3 w-64 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              worker.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span className="text-[11px] font-semibold text-slate-600">
                            {worker.isOnline ? 'Active Now' : 'Offline'}
                          </span>
                          {dist !== null && (
                            <span className="text-[11px] text-blue-600 font-bold ml-1">
                              • {dist} km ({etaMins} mins)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-amber-800 text-[11px] font-bold">
                        ★ {worker.averageRating || worker.rating || '0.0'}
                      </div>
                    </div>

                    {/* Trade skill badges */}
                    <div className="flex flex-wrap gap-1">
                      {worker.skills?.slice(0, 3).map((s, i) => {
                        const title = typeof s === 'string' ? s : s.professional_title;
                        const cat = typeof s === 'object' ? s.category : 'default';
                        return (
                          <span
                            key={i}
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${getCategoryStyle(
                              cat
                            )}`}
                          >
                            {title}
                          </span>
                        );
                      })}
                    </div>

                    {/* Pricing */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">Hourly Rate:</span>
                      <span className="font-extrabold text-slate-900">
                        ₹{worker.hourlyRate || 299}/hr
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={!worker.isOnline}
                      onClick={() => onSelectWorker && onSelectWorker(worker)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition shadow-xs ${
                        worker.isOnline
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {worker.isOnline ? '⚡ Book This Pro' : 'Currently Offline'}
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Uber-Style Bottom Floating Pro Card Overlay */}
        {selectedWorker && (
          <div className="absolute bottom-4 left-4 right-4 z-20 mx-auto max-w-xl animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-blue-900 font-display font-extrabold text-white text-lg shadow-sm">
                  {selectedWorker.fullName?.[0] || 'W'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-bold text-slate-900 text-sm truncate">
                      {selectedWorker.fullName || 'Trade Pro'}
                    </h4>
                    <span className="badge badge-emerald text-[10px] py-0 px-1.5">
                      {selectedWorker.isOnline ? 'Active' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {selectedWorker.skills?.[0] || 'Skilled Tradesperson'} •{' '}
                    <b className="text-slate-800">
                      {getDistanceKm(
                        activeLocation[0],
                        activeLocation[1],
                        getWorkerCoords(selectedWorker, 0)[0],
                        getWorkerCoords(selectedWorker, 0)[1]
                      )}{' '}
                      km
                    </b>{' '}
                    (ETA ~
                    {getEstimatedMinutes(
                      getDistanceKm(
                        activeLocation[0],
                        activeLocation[1],
                        getWorkerCoords(selectedWorker, 0)[0],
                        getWorkerCoords(selectedWorker, 0)[1]
                      )
                    )}{' '}
                    mins)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Rate</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    ₹{selectedWorker.hourlyRate || 299}/hr
                  </span>
                </div>
                <button
                  type="button"
                  disabled={!selectedWorker.isOnline}
                  onClick={() => onSelectWorker && onSelectWorker(selectedWorker)}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition disabled:opacity-50"
                >
                  ⚡ Book Now
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWorkerId(null)}
                  className="text-slate-400 hover:text-slate-700 font-bold text-xs p-1"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
