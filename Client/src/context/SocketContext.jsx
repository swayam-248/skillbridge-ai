import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { API_BASE_URL } from '../utils/api';

export const SocketContext = createContext();

function parseJwt(token) {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function getActiveUserId(user) {
  if (user?.userId || user?._id) return String(user.userId || user._id);
  const token = sessionStorage.getItem('token');
  const decoded = parseJwt(token);
  if (decoded?.userId) return String(decoded.userId);
  try {
    const savedUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (savedUser?._id || savedUser?.userId) {
      return String(savedUser._id || savedUser.userId);
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export function SocketProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [incomingDispatch, setIncomingDispatch] = useState(null);
  const [lastStatusUpdate, setLastStatusUpdate] = useState(null);
  const [newBookingEvent, setNewBookingEvent] = useState(null);
  const [workerStatusEvent, setWorkerStatusEvent] = useState(null);
  const [chatMessageEvent, setChatMessageEvent] = useState(null);
  const [chatNotification, setChatNotification] = useState(null);
  const [reviewReceivedEvent, setReviewReceivedEvent] = useState(null);
  const [liveWorkerLocationEvent, setLiveWorkerLocationEvent] = useState(null);
  const [locationBroadcastRequest, setLocationBroadcastRequest] = useState(null);

  useEffect(() => {
    const socketUrl = API_BASE_URL.replace(/\/api$/, '') || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    setSocket(newSocket);

    // Join personal user room on every connect/reconnect
    newSocket.on('connect', () => {
      const uid = getActiveUserId(user);
      console.log('⚡ Socket connected:', newSocket.id, 'User ID:', uid);
      if (uid) {
        newSocket.emit('join:user', uid);
      }
    });

    // Real-time incoming job alert
    newSocket.on('dispatch:incoming_request', (data) => {
      console.log('⚡ Incoming dispatch alert received:', data);
      setIncomingDispatch(data);
    });

    // Real-time booking status transitions (accepted, in_progress, completed, cancelled)
    newSocket.on('booking:status_changed', (updatedBooking) => {
      console.log('⚡ Real-time status update received:', updatedBooking.status, updatedBooking._id);
      setLastStatusUpdate(updatedBooking);
    });

    // Real-time new booking created
    newSocket.on('booking:created', (newBooking) => {
      console.log('⚡ Real-time new booking created:', newBooking._id);
      setNewBookingEvent(newBooking);
    });

    // Worker status toggled (online / offline)
    newSocket.on('worker:status_changed', (data) => {
      console.log('⚡ Real-time worker status changed:', data.userId, data.isOnline);
      setWorkerStatusEvent(data);
    });

    // Live chat message received
    newSocket.on('chat:message', (msg) => {
      setChatMessageEvent(msg);
    });

    // Background chat notification
    newSocket.on('chat:notification', (notification) => {
      setChatNotification(notification);
    });

    // Live review received
    newSocket.on('review:received', (data) => {
      console.log('⚡ Real-time review received:', data);
      setReviewReceivedEvent(data);
    });

    // Live moving worker GPS coordinates (Uber vehicle tracking)
    newSocket.on('worker:live_location', (data) => {
      setLiveWorkerLocationEvent(data);
    });

    // Prompt worker's device to immediately broadcast current coordinates
    newSocket.on('worker:request_location_broadcast', (data) => {
      setLocationBroadcastRequest(data);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Re-emit join:user whenever user object changes in AuthContext
  useEffect(() => {
    const uid = getActiveUserId(user);
    if (socket && uid) {
      socket.emit('join:user', uid);
      console.log('⚡ Emitted join:user for:', uid);
    }
  }, [socket, user]);

  const joinChat = (bookingId) => {
    if (socket && bookingId) {
      socket.emit('chat:join', bookingId);
    }
  };

  const leaveChat = (bookingId) => {
    if (socket && bookingId) {
      socket.emit('chat:leave', bookingId);
    }
  };

  const streamWorkerLocation = (bookingId, recipientId, coords) => {
    if (socket && bookingId && coords) {
      socket.emit('worker:stream_location', { bookingId, recipientId, coords });
    }
  };

  const requestWorkerLocation = (bookingId, workerId) => {
    if (socket && bookingId) {
      socket.emit('worker:request_location', { bookingId, workerId });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        incomingDispatch,
        setIncomingDispatch,
        lastStatusUpdate,
        newBookingEvent,
        workerStatusEvent,
        chatMessageEvent,
        chatNotification,
        reviewReceivedEvent,
        liveWorkerLocationEvent,
        locationBroadcastRequest,
        joinChat,
        leaveChat,
        streamWorkerLocation,
        requestWorkerLocation
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
