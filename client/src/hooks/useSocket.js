import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// Use current origin in production (same domain), localhost in development
const SERVER_URL = import.meta.env.PROD 
  ? window.location.origin 
  : 'http://localhost:5555';

export function useSocket(userId, onNotification, onNewBid, onNewGig) {
  const socketRef = useRef(null);
  const callbackRef = useRef(onNotification);
  const bidCallbackRef = useRef(onNewBid);
  const gigCallbackRef = useRef(onNewGig);
  // Keep callback refs updated
  useEffect(() => {
    callbackRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    bidCallbackRef.current = onNewBid;
  }, [onNewBid]);

  useEffect(() => {
    gigCallbackRef.current = onNewGig;
  }, [onNewGig]);

  useEffect(() => {
    if (!userId) return;

    // Connect to Socket.io server
    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.log('Socket.io connected:', socket.id);
      
      // Join user's personal room
      socket.emit('join-room', userId);
      console.log('Joined room for user:', userId);
    });

    socket.on('disconnect', () => {
      console.log('Socket.io disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
    });

    // Listen for freelancer-hired notification
    socket.on('freelancer-hired', (data) => {
      console.log('Notification received:', data);
      if (callbackRef.current) {
        callbackRef.current(data);
      }
    });

    // Listen for new bid events
    socket.on('new-bid', (data) => {
      console.log('New bid event received:', data);
      if (bidCallbackRef.current) {
        bidCallbackRef.current(data);
      }
    });

    // Listen for new gig events
    socket.on('new-gig', (data) => {
      console.log('New gig event received:', data);
      if (gigCallbackRef.current) {
        gigCallbackRef.current(data);
      }
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId]);

  return socketRef.current;
}
