import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../services/api';

const getSocketUrl = () => {
  // Use the centralized API_URL (from env or Render fallback)
  let url = API_URL;
  
  if (url) {
    // Strip /api/v1 or /api from the end for socket.io
    url = url.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
    return url;
  }

  // Local development fallback
  return 'http://localhost:5000';
};


const SOCKET_URL = getSocketUrl();
console.log('📡 Socket URL being used:', SOCKET_URL);


export const useProctoring = (role: 'student' | 'admin', userId: string, roomId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [streams, setStreams] = useState<{ [key: string]: MediaStream }>({});
  const peerConnections = useRef<{ [key: string]: RTCPeerConnection }>({});
  const [activeStudents, setActiveStudents] = useState<string[]>([]);

  useEffect(() => {
    console.log('Initializing proctoring socket for role:', role);
    const newSocket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'], // Use polling first for better compatibility with Render
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000, // Increase timeout for cold starts
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    newSocket.on('connect_error', (err) => {
      console.error('Socket Connection Error:', err);
    });

    newSocket.on('connect', () => {
      console.log('Connected to signaling server with ID:', newSocket.id);
      if (role === 'student') {
        newSocket.emit('student-ready', { userId, roomId });
      } else {
        newSocket.emit('admin-join', roomId);
      }
    });

    if (role === 'student') {
      newSocket.on('discovery-request', () => {
        newSocket.emit('student-ready', { userId, roomId });
      });
    }

    if (role === 'admin') {
      newSocket.on('student-joined', (studentId) => {
        console.log('New student discovered:', studentId);
        setActiveStudents(prev => Array.from(new Set([...prev, studentId])));
      });

      newSocket.on('student-left', (studentId) => {
        setActiveStudents(prev => prev.filter(id => id !== studentId));
        setStreams(prev => {
          const next = { ...prev };
          delete next[`${studentId}-camera`];
          delete next[`${studentId}-screen`];
          return next;
        });
      });
    }

    newSocket.on('signal', async (data) => {
      const { from, signal, type } = data;
      let pc = peerConnections.current[`${from}-${type}`];

      if (!pc) {
        pc = createPeerConnection(from, type, newSocket);
        peerConnections.current[`${from}-${type}`] = pc;
      }

      try {
        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          newSocket.emit('signal', { to: from, signal: pc.localDescription, type });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal));
        }
      } catch (err) {
        console.error('Error handling signal:', err);
      }
    });

    newSocket.on('request-stream', async (data) => {
      if (role === 'student') {
        startStreaming(data.adminId);
      }
    });

    // Proactive permission request for students
    if (role === 'student') {
      const requestInitialPermission = async () => {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          s.getTracks().forEach(t => t.stop());
          console.log('Initial camera/mic permission granted');
        } catch (err) {
          console.error('Initial permission request failed:', err);
        }
      };
      requestInitialPermission();
    }

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      Object.values(peerConnections.current).forEach(pc => pc.close());
    };
  }, [roomId, role, userId]);

  const createPeerConnection = (targetId: string, type: string, socketInstance: Socket) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketInstance.emit('signal', { to: targetId, signal: event.candidate, type });
      }
    };

    pc.ontrack = (event) => {
      setStreams(prev => ({
        ...prev,
        [`${targetId}-${type}`]: event.streams[0]
      }));
    };

    return pc;
  };

  const startStreaming = async (adminId: string) => {
    console.log('Attempting to start streaming to admin:', adminId);
    const currentSocket = socketRef.current;

    if (!currentSocket) {
      console.error('Cannot start streaming: Socket not initialized');
      return;
    }

    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isSecure) {
      alert('Camera access (WebRTC) requires a secure connection (HTTPS). Please use HTTPS or localhost.');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support camera access or it is blocked.');
      return;
    }

    try {
      // 1. Try Camera and Audio with HD constraints
      let camStream: MediaStream;
      const hdConstraints = {
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: true
      };

      try {
        camStream = await navigator.mediaDevices.getUserMedia(hdConstraints);
      } catch (err) {
        console.warn('Failed to get HD video+audio, trying standard...', err);
        camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }


      if (camStream) {
        const camPc = createPeerConnection(adminId, 'camera', currentSocket);
        camStream.getTracks().forEach(track => camPc.addTrack(track, camStream));

        const camOffer = await camPc.createOffer();
        await camPc.setLocalDescription(camOffer);
        currentSocket.emit('signal', { to: adminId, signal: camPc.localDescription, type: 'camera' });
        peerConnections.current[`${adminId}-camera`] = camPc;
        console.log('Camera stream sent');
      }

      // 2. Try Screen (Only if supported and not on mobile)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (!isMobile && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        try {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          const screenPc = createPeerConnection(adminId, 'screen', currentSocket);
          screenStream.getTracks().forEach(track => screenPc.addTrack(track, screenStream));

          const screenOffer = await screenPc.createOffer();
          await screenPc.setLocalDescription(screenOffer);
          currentSocket.emit('signal', { to: adminId, signal: screenPc.localDescription, type: 'screen' });
          peerConnections.current[`${adminId}-screen`] = screenPc;
          console.log('Screen stream sent');
        } catch (screenErr) {
          console.error('Screen share denied or failed:', screenErr);
        }
      } else {
        console.warn('Screen sharing not supported on this device/browser');
      }

    } catch (err: any) {
      console.error('Final streaming error:', err);
      alert(`Camera/Mic Access Error: ${err.message}. Please check browser permissions.`);
    }
  };

  const requestStudentStream = (studentId: string) => {
    const currentSocket = socketRef.current;
    if (currentSocket) {
      currentSocket.emit('request-stream', { studentId });
    }
  };

  return { socket, streams, startStreaming, activeStudents, requestStudentStream };
};


