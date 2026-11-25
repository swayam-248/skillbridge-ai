import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSocket } from '../context/SocketContext';
import BookingChatModal from './BookingChatModal';

// Calculate distance between two GPS coordinates using Haversine formula (self-contained)
function getDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 1.2;
  const numLat1 = parseFloat(lat1);
  const numLon1 = parseFloat(lon1);
  const numLat2 = parseFloat(lat2);
  const numLon2 = parseFloat(lon2);
  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) return 1.2;

  const R = 6371; // Earth radius in km
  const dLat = ((numLat2 - numLat1) * Math.PI) / 180;
  const dLon = ((numLon2 - numLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((numLat1 * Math.PI) / 180) *
      Math.cos((numLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

// Calculate estimated travel time in minutes based on average city driving speed (25 km/h)
function getEstimatedMinutes(distanceKm) {
  const d = parseFloat(distanceKm);
  if (isNaN(d) || d <= 0) return 3;
  const mins = Math.round((d / 25) * 60);
  return Math.max(mins, 2);
}

// Auto-fit map bounds helper
function FitBoundsHelper({ coords1, coords2, trigger }) {
  const map = useMap();
  useEffect(() => {
    if (
      Array.isArray(coords1) && coords1.length === 2 &&
      !isNaN(coords1[0]) && !isNaN(coords1[1]) &&
      Array.isArray(coords2) && coords2.length === 2 &&
      !isNaN(coords2[0]) && !isNaN(coords2[1])
    ) {
      try {
        const bounds = L.latLngBounds([coords1, coords2]);
        map.fitBounds(bounds, { padding: [70, 70], maxZoom: 16 });
      } catch (e) {
        // ignore
      }
    }
  }, [trigger, map]);
  return null;
}

const TILE_SERVERS = {
  streets: {
    name: '🗺️ Navigation',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Street Map'
  },
  osm: {
    name: '🏙️ OpenStreet',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  satellite: {
    name: '🛰️ Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri Earthstar Geographics'
  }
};

export default function LiveJobTrackerModal({
  booking,
  currentUserRole,
  onClose,
  onStartJobWithOtp,
  onCompleteJob
}) {
  const {
    streamWorkerLocation,
    requestWorkerLocation,
    liveWorkerLocationEvent,
    locationBroadcastRequest,
    joinChat,
    leaveChat,
    lastStatusUpdate
  } = useSocket() || {};

  const isWorker = currentUserRole === 'worker';
  const counterpartId = isWorker
    ? (booking?.recruiter?._id || booking?.recruiter?.userId || booking?.recruiter)
    : (booking?.worker?._id || booking?.worker?.userId || booking?.worker);

  const counterpartName = isWorker
    ? (booking?.recruiter?.email || 'Customer')
    : (booking?.worker?.email || 'Assigned Specialist');

  // Extract destination (recruiter's job site pickup location):
  // GeoJSON coordinates standard: [longitude, latitude]
  const rawLng = booking?.location?.coordinates?.[0];
  const rawLat = booking?.location?.coordinates?.[1];

  const parsedLng = rawLng != null && !isNaN(rawLng) && Number(rawLng) !== 0 ? Number(rawLng) : 77.2090;
  const parsedLat = rawLat != null && !isNaN(rawLat) && Number(rawLat) !== 0 ? Number(rawLat) : 28.6139;

  const destinationCoords = useMemo(() => [parsedLat, parsedLng], [parsedLat, parsedLng]);

  // Initial worker coordinates: slight offset (~1.2 km away)
  const initialWorkerLat = parsedLat + 0.011;
  const initialWorkerLng = parsedLng + 0.011;

  const [workerCoords, setWorkerCoords] = useState([initialWorkerLat, initialWorkerLng]);
  const [currentBookingStatus, setCurrentBookingStatus] = useState(booking?.status || 'accepted');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [tileMode, setTileMode] = useState('streets');
  const [chatOpen, setChatOpen] = useState(false);
  const [gpsWatchActive, setGpsWatchActive] = useState(false);
  const [boundsTrigger, setBoundsTrigger] = useState(0);

  const simIntervalRef = useRef(null);
  const watchIdRef = useRef(null);
  const workerCoordsRef = useRef([initialWorkerLat, initialWorkerLng]);

  // Safely memoize Leaflet DivIcons inside component lifecycle
  const destinationIcon = useMemo(() => {
    return L.divIcon({
      className: 'custom-dest-icon',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 48px; height: 48px;">
          <div style="position: absolute; width: 48px; height: 48px; border-radius: 9999px; background: rgba(225, 29, 72, 0.3); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 34px; height: 34px; border-radius: 12px; background: #0f172a; border: 3px solid #ffffff; box-shadow: 0 6px 16px rgba(0,0,0,0.45); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white;">
            <span style="font-size: 14px; line-height: 1;">📍</span>
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
      popupAnchor: [0, -24]
    });
  }, []);

  const workerMovingIcon = useMemo(() => {
    return L.divIcon({
      className: 'custom-worker-moving-icon',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 50px; height: 50px;">
          <div style="position: absolute; width: 50px; height: 50px; border-radius: 9999px; background: rgba(37, 99, 235, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 38px; height: 38px; border-radius: 14px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); border: 3px solid #ffffff; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 18px;">
            🚗
          </div>
        </div>
      `,
      iconSize: [50, 50],
      iconAnchor: [25, 25],
      popupAnchor: [0, -25]
    });
  }, []);

  // Keep ref synchronized
  useEffect(() => {
    workerCoordsRef.current = workerCoords;
  }, [workerCoords]);

  // Listen for real-time status update affecting this booking
  useEffect(() => {
    if (lastStatusUpdate && String(lastStatusUpdate._id) === String(booking?._id)) {
      setCurrentBookingStatus(lastStatusUpdate.status);
    }
  }, [lastStatusUpdate, booking?._id]);

  // Join booking chat room on mount
  useEffect(() => {
    if (booking?._id && joinChat) {
      joinChat(booking._id);
    }
    return () => {
      if (booking?._id && leaveChat) {
        leaveChat(booking._id);
      }
    };
  }, [booking?._id]);

  // If Recruiter: request latest worker location upon opening map
  useEffect(() => {
    if (!isWorker && booking?._id && requestWorkerLocation) {
      requestWorkerLocation(booking._id, counterpartId);
    }
  }, [isWorker, booking?._id]);

  // If Worker: listen for location broadcast request from server or customer
  useEffect(() => {
    if (isWorker && locationBroadcastRequest && String(locationBroadcastRequest.bookingId) === String(booking?._id)) {
      if (streamWorkerLocation) {
        streamWorkerLocation(booking._id, counterpartId, workerCoordsRef.current);
      }
    }
  }, [locationBroadcastRequest, isWorker, booking?._id, counterpartId]);

  // If Worker: start streaming live GPS location using browser geolocation
  const handleSyncGpsLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setWorkerCoords(coords);
        setGpsWatchActive(true);
        if (streamWorkerLocation && booking?._id) {
          streamWorkerLocation(booking._id, counterpartId, coords);
        }
      },
      (err) => console.warn('Worker GPS sync warn:', err.message),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    if (isWorker && navigator.geolocation) {
      // Immediate query
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setWorkerCoords(coords);
          setGpsWatchActive(true);
          if (streamWorkerLocation && booking?._id) {
            streamWorkerLocation(booking._id, counterpartId, coords);
          }
        },
        (err) => {
          console.warn('Worker GPS position warn:', err.message);
          if (streamWorkerLocation && booking?._id) {
            streamWorkerLocation(booking._id, counterpartId, workerCoordsRef.current);
          }
        },
        { enableHighAccuracy: true }
      );

      // Continuous watch
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setWorkerCoords(coords);
          setGpsWatchActive(true);
          if (streamWorkerLocation && booking?._id) {
            streamWorkerLocation(booking._id, counterpartId, coords);
          }
        },
        (err) => console.warn('Worker GPS watch warn:', err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
      );
    }

    return () => {
      if (watchIdRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, [isWorker, booking?._id, counterpartId]);

  // If Recruiter: listen for incoming live worker coordinates streamed over WebSockets
  useEffect(() => {
    if (!isWorker && liveWorkerLocationEvent && String(liveWorkerLocationEvent.bookingId) === String(booking?._id)) {
      if (Array.isArray(liveWorkerLocationEvent.coords) && liveWorkerLocationEvent.coords.length === 2) {
        setWorkerCoords(liveWorkerLocationEvent.coords);
      }
    }
  }, [liveWorkerLocationEvent, isWorker, booking?._id]);

  // Simulate Drive to Doorstep
  const handleSimulateMovement = () => {
    if (simulating) {
      clearInterval(simIntervalRef.current);
      setSimulating(false);
      return;
    }

    setSimulating(true);
    let currentLat = workerCoords[0];
    let currentLng = workerCoords[1];

    simIntervalRef.current = setInterval(() => {
      const latDiff = parsedLat - currentLat;
      const lngDiff = parsedLng - currentLng;

      if (Math.abs(latDiff) < 0.0002 && Math.abs(lngDiff) < 0.0002) {
        clearInterval(simIntervalRef.current);
        setSimulating(false);
        const finalCoords = [parsedLat, parsedLng];
        setWorkerCoords(finalCoords);
        if (streamWorkerLocation && booking?._id) {
          streamWorkerLocation(booking._id, counterpartId, finalCoords);
        }
        return;
      }

      currentLat += latDiff * 0.14;
      currentLng += lngDiff * 0.14;

      const updated = [Number(currentLat.toFixed(6)), Number(currentLng.toFixed(6))];
      setWorkerCoords(updated);

      if (streamWorkerLocation && booking?._id) {
        streamWorkerLocation(booking._id, counterpartId, updated);
      }
    }, 1200);
  };

  const currentDistance = getDistanceKm(
    workerCoords[0],
    workerCoords[1],
    destinationCoords[0],
    destinationCoords[1]
  );
  const etaMinutes = getEstimatedMinutes(currentDistance);

  // Open native Google Maps turn-by-turn navigation in a new tab
  const handleOpenGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${parsedLat},${parsedLng}`;
    window.open(url, '_blank');
  };

  // Doorstep OTP Verification Handler
  const handleVerifyOtp = async () => {
    if (!otpInput.trim() || otpInput.trim().length !== 4) {
      setOtpError('Please enter a 4-digit code');
      return;
    }
    setVerifyingOtp(true);
    setOtpError('');
    try {
      if (onStartJobWithOtp) {
        const res = await onStartJobWithOtp(booking?._id, otpInput.trim());
        if (res && res.success === false) {
          setOtpError(res.message || 'Incorrect OTP code');
        } else {
          setCurrentBookingStatus('in_progress');
        }
      }
    } catch (e) {
      setOtpError('Failed to verify OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="relative flex flex-col h-[92vh] w-full max-w-5xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 bg-slate-900 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 font-display text-2xl font-bold shadow-lg shadow-blue-500/25">
              {isWorker ? '🧭' : '🚙'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-blue-400">
                  {isWorker ? 'Driver Navigation Mode' : 'Live Specialist Tracking'}
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live GPS
                </span>
                {currentBookingStatus === 'in_progress' && (
                  <span className="badge badge-indigo text-[10px] bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                    🛠️ Doorstep Work Active
                  </span>
                )}
              </div>
              <h2 className="font-display text-base sm:text-lg font-extrabold text-white mt-0.5 truncate max-w-lg">
                {isWorker
                  ? `Pickup Point: ${booking?.serviceAddress || 'Customer Doorstep'}`
                  : `Pro en route: ${booking?.jobDescription || 'Service request'}`}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Live Distance & ETA Pill */}
            <div className="flex items-center gap-3 rounded-2xl bg-slate-800/90 px-4 py-2 border border-slate-700 shadow-inner">
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">ETA</span>
                <span className="font-extrabold text-sm sm:text-base text-emerald-400">
                  {currentDistance <= 0.08 ? 'Arrived ✓' : `~${etaMinutes} mins`}
                </span>
              </div>
              <div className="h-7 w-px bg-slate-700" />
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Distance</span>
                <span className="font-extrabold text-sm sm:text-base text-white">{currentDistance} km</span>
              </div>
            </div>

            {/* Chat Shortcut Button */}
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3 py-2 text-xs font-bold text-white transition shadow-sm"
              title="Open Live Chat"
            >
              <span>💬</span>
              <span className="hidden sm:inline">Chat</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Live Interactive Map Area */}
        <div className="relative flex-1 w-full bg-slate-100">
          <MapContainer
            center={destinationCoords}
            zoom={14}
            scrollWheelZoom={true}
            className="h-full w-full z-0"
          >
            <FitBoundsHelper coords1={workerCoords} coords2={destinationCoords} trigger={boundsTrigger} />

            {/* High-Definition Real-World Map Layer */}
            <TileLayer
              attribution={TILE_SERVERS[tileMode]?.attribution}
              url={TILE_SERVERS[tileMode]?.url}
              maxZoom={19}
            />

            {/* Turn-by-Turn Route Polyline connecting Worker to Customer */}
            <Polyline
              positions={[workerCoords, destinationCoords]}
              pathOptions={{
                color: '#2563eb',
                weight: 5,
                dashArray: '8, 8',
                opacity: 0.85
              }}
            />

            {/* Customer Job Site Destination Pin */}
            <Marker position={destinationCoords} icon={destinationIcon}>
              <Popup className="custom-leaflet-popup">
                <div className="p-2 text-center min-w-[180px]">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 block">
                    Customer Pickup Point
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    {booking?.serviceAddress || 'Customer Location'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Client: {counterpartName}
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* Moving Worker / Vehicle Pin */}
            <Marker position={workerCoords} icon={workerMovingIcon}>
              <Popup className="custom-leaflet-popup">
                <div className="p-2 text-center min-w-[180px]">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">
                    {isWorker ? 'Your Current Location' : 'Specialist In Motion'}
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    {currentDistance <= 0.08 ? 'Arrived at Doorstep!' : `${currentDistance} km away`}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ETA: ~{etaMinutes} mins
                  </p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          {/* Floating Controls Overlay (Top Right of Map) */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
            {/* Tile Layer Switcher */}
            <div className="inline-flex rounded-2xl bg-white/95 p-1 shadow-md border border-slate-200 backdrop-blur-sm">
              {Object.entries(TILE_SERVERS).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTileMode(key)}
                  className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                    tileMode === key
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>

            {/* Navigation Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleOpenGoogleMaps}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-md border border-slate-200 hover:bg-slate-50 transition"
              >
                <span>🗺️ Open in Google Maps</span>
              </button>

              <button
                type="button"
                onClick={() => setBoundsTrigger((prev) => prev + 1)}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-md border border-slate-200 hover:bg-slate-50 transition"
                title="Fit route to screen"
              >
                <span>🎯 Center Route</span>
              </button>

              {isWorker && (
                <>
                  <button
                    type="button"
                    onClick={handleSyncGpsLocation}
                    className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-3 py-2 text-xs font-bold text-blue-700 shadow-md border border-blue-200 hover:bg-blue-50 transition"
                  >
                    <span>🔄 Sync GPS</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateMovement}
                    className={`inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold text-white shadow-md transition ${
                      simulating
                        ? 'bg-rose-600 hover:bg-rose-700 animate-pulse'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    <span>{simulating ? '⏹️ Pause Drive' : '▶️ Test Drive to Door'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Floating Status Notification Pill (Top Left of Map) */}
          <div className="absolute top-4 left-4 z-20">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/95 px-3.5 py-2 text-xs font-bold text-slate-800 shadow-md border border-slate-200 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {isWorker
                  ? gpsWatchActive
                    ? 'Broadcasting your live GPS to customer'
                    : 'Location sharing enabled'
                  : 'Receiving live vehicle GPS coordinates'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="border-t border-slate-200 bg-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {isWorker ? 'Job Destination' : 'Assigned Specialist'}
              </span>
              <span className="badge badge-blue text-[10px]">
                {booking?.totalAmount ? `Fare: ₹${booking.totalAmount}` : 'Fixed Fare'}
              </span>
            </div>
            <p className="text-sm font-extrabold text-slate-900 truncate mt-0.5">
              {isWorker
                ? (booking?.serviceAddress || 'Customer Location')
                : (booking?.jobDescription || 'On-demand service request')}
            </p>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {isWorker
                ? `Customer: ${counterpartName} • Scope: ${booking?.jobDescription || 'Service'}`
                : `Address: ${booking?.serviceAddress || 'Your Doorstep'}`}
            </p>
          </div>

          {/* Role-Specific Action Controls */}
          {isWorker ? (
            <div className="flex items-center gap-3 shrink-0">
              {currentBookingStatus === 'accepted' ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 p-2.5 rounded-2xl border border-amber-200">
                  <div className="text-left sm:pr-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                      Doorstep Arrival
                    </span>
                    <span className="text-[11px] text-amber-700">Enter customer's 4-digit OTP:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="OTP"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      className="w-24 rounded-xl border border-amber-300 bg-white px-3 py-1.5 font-mono text-center text-sm font-extrabold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      disabled={otpInput.trim().length !== 4 || verifyingOtp}
                      onClick={handleVerifyOtp}
                      className="rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition shadow-xs disabled:opacity-50"
                    >
                      {verifyingOtp ? 'Verifying...' : 'Verify at Door'}
                    </button>
                  </div>
                  {otpError && (
                    <span className="text-xs text-rose-600 font-bold block sm:inline">{otpError}</span>
                  )}
                </div>
              ) : currentBookingStatus === 'in_progress' ? (
                <div className="flex items-center gap-3">
                  <span className="badge badge-indigo text-xs py-1.5 px-3">
                    🛠️ Doorstep Verified • Work In Progress
                  </span>
                  {onCompleteJob && (
                    <button
                      type="button"
                      onClick={() => onCompleteJob(booking?._id)}
                      className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white hover:from-emerald-700 hover:to-teal-700 transition shadow-sm"
                    >
                      ✓ Complete Job
                    </button>
                  )}
                </div>
              ) : (
                <span className="badge badge-emerald text-xs py-1.5 px-3">
                  ✓ Job Completed
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 shrink-0">
              {currentBookingStatus === 'accepted' ? (
                <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 px-4 py-2.5">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 block">
                      Doorstep Start Code
                    </span>
                    <span className="text-[11px] text-slate-600">Give to pro upon arrival:</span>
                  </div>
                  <span className="font-mono text-xl font-black text-blue-600 tracking-widest bg-white px-3 py-1 rounded-xl border border-blue-200 shadow-xs">
                    {booking?.startOtp || '4821'}
                  </span>
                </div>
              ) : currentBookingStatus === 'in_progress' ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-2xl bg-indigo-50 border border-indigo-200 px-3.5 py-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
                    </span>
                    <span className="text-xs font-bold text-indigo-900">
                      Pro is actively working at your doorstep
                    </span>
                  </div>
                  {onCompleteJob && (
                    <button
                      type="button"
                      onClick={() => onCompleteJob(booking?._id)}
                      className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white hover:from-emerald-700 hover:to-teal-700 transition shadow-sm"
                    >
                      ✓ Mark Completed
                    </button>
                  )}
                </div>
              ) : (
                <span className="badge badge-emerald text-xs py-1.5 px-3">
                  ✓ Job Completed
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Embedded Live In-App Chat Modal */}
      {chatOpen && (
        <BookingChatModal
          booking={booking}
          currentUser={{ role: currentUserRole }}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
