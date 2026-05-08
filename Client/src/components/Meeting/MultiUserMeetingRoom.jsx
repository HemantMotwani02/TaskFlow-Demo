import React, { useState, useRef, useEffect, useCallback } from 'react';

// Modern Meeting Icons - Google Meet/Zoom Style with proper SVG paths
const MicOnIcon = ({ size = "w-6 h-6" }) => (
  <svg className={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
  </svg>
);

const MicOffIcon = ({ size = "w-6 h-6" }) => (
  <svg className={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
  </svg>
);

const CameraOnIcon = ({ size = "w-6 h-6" }) => (
  <svg className={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
  </svg>
);

const CameraOffIcon = ({ size = "w-6 h-6" }) => (
  <svg className={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>
  </svg>
);

const ScreenShareIcon = ({ size = "w-6 h-6" }) => (
  <svg className={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.11-.9-2-2-2H4c-1.11 0-2 .89-2 2v10c0 1.1.89 2 2 2H0v2h24v-2h-4zm-7-3.53v-2.19c-2.78 0-4.61.85-6 2.72.56-2.67 2.11-5.33 6-5.87V7l4 3.73-4 3.74z"/>
  </svg>
);

const EndCallIcon = ({ size = "w-6 h-6" }) => (
  <svg className={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.88-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.7l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28-.79-.76-1.68-1.39-2.66-1.88-.33-.16-.56-.51-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
  </svg>
);

const ChatIcon = ({ size = "w-6 h-6" }) => (
  <svg className={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
  </svg>
);

const ParticipantsIcon = ({ size = "w-6 h-6" }) => (
  <svg className={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
);

const MoreIcon = ({ size = "w-6 h-6" }) => (
  <svg className={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
  </svg>
);

const SpeakerViewIcon = ({ size = "w-6 h-6" }) => (
  <svg className={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M21 3H3c-1.11 0-2 .89-2 2v12c0 1.1.89 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.11-.9-2-2-2zm0 14H3V5h18v12z"/>
  </svg>
);

const GalleryViewIcon = ({ size = "w-6 h-6" }) => (
  <svg className={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/>
  </svg>
);

const MultiUserMeetingRoom = ({ meeting, currentUser, onRequestClose }) => {
  console.log('🚀 Modern Meeting Room Loading...');
  console.log('  - Meeting:', meeting);
  console.log('  - Meeting ID:', meeting?.meeting_id || meeting?.id);
  console.log('  - Organizer ID:', meeting?.organizer_id);
  console.log('  - Participants:', meeting?.participants);
  console.log('  - Current User:', currentUser);
  console.log('  - User ID:', currentUser?.user_id);
  
  // State management
  const [participants, setParticipants] = useState(new Map());
  const [localStream, setLocalStream] = useState(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Initializing...');
  const [connected, setConnected] = useState(false);
  const [activeScreenSharer, setActiveScreenSharer] = useState(null);
  const [participantAnimations, setParticipantAnimations] = useState(new Map());
  const [viewMode, setViewMode] = useState('gallery'); // 'gallery' or 'speaker'
  const [speakingParticipant, setSpeakingParticipant] = useState(null);
  const [showControls, setShowControls] = useState(true);

  // Refs
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnections = useRef(new Map());
  const wsRef = useRef(null);
  const dataChannels = useRef(new Map());
  const screenStreamRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());
  const handleWebSocketMessageRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const meetingId = meeting.meeting_id || meeting.id;
  
  // Parse participants if it's a string, otherwise use as-is
  let participantIds = [];
  if (typeof meeting.participants === 'string') {
    try {
      participantIds = JSON.parse(meeting.participants);
      console.log('  - Parsed participants from string:', participantIds);
    } catch (e) {
      console.error('  - Failed to parse participants:', e);
      participantIds = [];
    }
  } else if (Array.isArray(meeting.participants)) {
    participantIds = meeting.participants;
    console.log('  - Participants already array:', participantIds);
  } else {
    console.warn('  - Participants is neither string nor array:', typeof meeting.participants);
  }

  // WebSocket message handler
  const handleWebSocketMessage = useCallback(async (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      console.log('📨 Received WebSocket message:', msg.type, msg.payload?.signal?.type);
      
      if (msg.type !== 'meeting_signal') return;
      
      const { meetingId: mid, fromUserId, signal } = msg.payload || {};
      if (mid !== meetingId || String(fromUserId) === String(currentUser.user_id)) return;

      switch (signal.type) {
        case 'user_joined':
          console.log(`👤 User ${fromUserId} joined (${signal.userName || 'Unknown'}), creating peer connection`);
          
          // Check if this is a new participant
          const isNewParticipant = !participants.has(String(fromUserId));
          
          // Add participant immediately (even without stream)
          setParticipants(prev => {
            const newParticipants = new Map(prev);
            if (!newParticipants.has(String(fromUserId))) {
              newParticipants.set(String(fromUserId), {
                id: String(fromUserId),
                name: signal.userName || `User ${fromUserId}`,
                stream: null, // Will be set when track is received
                cameraEnabled: false, // Will be updated via media_status
                micEnabled: false,
                isLocal: false
              });
              console.log(`  - Added ${signal.userName || fromUserId} to participants list`);
            }
            return newParticipants;
          });
          
          // IMPORTANT: Only announce ourselves back if this is a NEW participant
          // This prevents infinite loops of announcements
          if (isNewParticipant) {
            console.log(`  - Announcing ourselves to new user ${signal.userName || fromUserId}`);
            sendSignal({ 
              type: 'user_joined',
              userId: currentUser.user_id,
              userName: currentUser.name || `User ${currentUser.user_id}`
            }, String(fromUserId)); // Send directly to the new user
          }
          
          await createPeerConnection(String(fromUserId), false);
          addParticipantAnimation(String(fromUserId), 'join');
          break;
          
        case 'user_left':
          console.log(`📨 User ${fromUserId} (${signal.userName || 'Unknown'}) left the meeting`);
          handleUserLeft(String(fromUserId));
          break;
          
        case 'chat':
          setChatMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            from: String(fromUserId),
            fromName: signal.fromUserName || `User ${fromUserId}`,
            text: signal.message,
            timestamp: new Date()
          }]);
          break;
          
        case 'media_status':
          updateParticipantMediaStatus(String(fromUserId), signal.mediaStatus);
          break;
          
        case 'screen_share_start':
          setActiveScreenSharer(String(fromUserId));
          break;
          
        case 'screen_share_stop':
          if (String(fromUserId) === activeScreenSharer) {
            setActiveScreenSharer(null);
          }
          break;
          
        case 'offer':
        case 'answer':
        case 'ice':
          // These signals require an existing peer connection
          const pc = peerConnections.current.get(String(fromUserId));
          if (!pc) {
            console.warn(`⚠️ No peer connection for ${fromUserId}, signal: ${signal.type}`);
            return;
          }
          
          if (signal.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignal({ type: 'answer', sdp: pc.localDescription }, String(fromUserId));
          } else if (signal.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          } else if (signal.type === 'ice') {
            if (signal.candidate) {
              try { 
                await pc.addIceCandidate(signal.candidate); 
              } catch (e) {
                console.warn('Failed to add ICE candidate:', e);
              }
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }, [meetingId, currentUser.user_id, activeScreenSharer]);

  // Update the ref whenever the handler changes
  useEffect(() => {
    handleWebSocketMessageRef.current = handleWebSocketMessage;
  }, [handleWebSocketMessage]);

  // Create peer connection for a specific user
  const createPeerConnection = async (userId, isInitiator = false) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    peerConnections.current.set(userId, pc);

    // Handle ICE candidates
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal({ type: 'ice', candidate: e.candidate }, userId);
      }
    };

    // Handle incoming tracks
    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (stream) {
        console.log(`🎬 Received track from ${userId}:`, e.track.kind);
        setParticipants(prev => {
          const newParticipants = new Map(prev);
          const existing = newParticipants.get(userId);
          
          // Update existing participant with stream, or create new one
          newParticipants.set(userId, {
            id: userId,
            name: existing?.name || `User ${userId}`,
            stream: stream,
            cameraEnabled: existing?.cameraEnabled ?? true,
            micEnabled: existing?.micEnabled ?? true,
            isLocal: false
          });
          
          console.log(`  - Updated participant ${userId} with ${e.track.kind} track`);
          return newParticipants;
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`Connection with ${userId}: ${state}`);
      
      if (state === 'connected') {
        setConnected(true);
        setConnectionStatus('Connected');
      } else if (state === 'disconnected' || state === 'failed') {
        handleUserLeft(userId);
      }
    };

    // Handle data channels
    if (isInitiator) {
      const dataChannel = pc.createDataChannel('chat', { ordered: true });
      setupDataChannel(dataChannel, userId);
      dataChannels.current.set(userId, dataChannel);
    } else {
      pc.ondatachannel = (event) => {
        setupDataChannel(event.channel, userId);
        dataChannels.current.set(userId, event.channel);
      };
    }

    // Add local stream tracks - use ref for reliability
    const streamToAdd = localStreamRef.current || localStream;
    if (streamToAdd) {
      console.log(`  - Adding ${streamToAdd.getTracks().length} tracks to peer connection with ${userId}`);
      streamToAdd.getTracks().forEach(track => {
        console.log(`    - Adding ${track.kind} track:`, track.label);
        pc.addTrack(track, streamToAdd);
      });
    } else {
      console.warn(`  - ⚠️ No local stream available when creating peer connection with ${userId}`);
    }

    // Create and send offer if initiator
    if (isInitiator) {
      try {
        console.log(`  - Creating offer for ${userId}...`);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal({ type: 'offer', sdp: pc.localDescription }, userId);
        console.log(`  - ✅ Offer sent to ${userId}`);
      } catch (error) {
        console.error(`  - ❌ Error creating offer for ${userId}:`, error);
      }
    } else {
      console.log(`  - Waiting for offer from ${userId}...`);
    }

    return pc;
  };

  // Setup data channel for chat
  const setupDataChannel = (channel, userId) => {
    channel.onopen = () => {
      console.log(`Data channel opened with ${userId}`);
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat') {
          setChatMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            from: userId,
            fromName: data.fromUserName || `User ${userId}`,
            text: data.message,
            timestamp: new Date()
          }]);
        }
      } catch (error) {
        console.error('Error parsing chat message:', error);
      }
    };

    channel.onclose = () => {
      console.log(`Data channel closed with ${userId}`);
    };
  };

  // Send signaling message
  const sendSignal = (signal, targetUserId = null) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const recipients = targetUserId 
      ? [targetUserId]
      : [...participantIds.map(String), String(meeting.organizer_id || '')].filter(id => id !== String(currentUser.user_id));

    wsRef.current.send(JSON.stringify({
      type: 'meeting_signal',
      payload: {
        meetingId,
        fromUserId: currentUser.user_id,
        recipients,
        signal,
        signalType: targetUserId ? 'direct' : 'broadcast'
      }
    }));
  };

  // Handle user leaving
  const handleUserLeft = (userId) => {
    console.log(`👋 User ${userId} left the meeting`);
    
    addParticipantAnimation(userId, 'leave');

    const pc = peerConnections.current.get(userId);
    if (pc) {
      console.log(`  - Closing peer connection with ${userId}`);
      pc.close();
      peerConnections.current.delete(userId);
    }

    const dataChannel = dataChannels.current.get(userId);
    if (dataChannel) {
      console.log(`  - Closing data channel with ${userId}`);
      dataChannel.close();
      dataChannels.current.delete(userId);
    }

    if (activeScreenSharer === userId) {
      console.log(`  - User ${userId} was screen sharing, stopping it`);
      setActiveScreenSharer(null);
    }

    setTimeout(() => {
      setParticipants(prev => {
        const newParticipants = new Map(prev);
        newParticipants.delete(userId);
        console.log(`  - Removed ${userId} from participants list`);
        return newParticipants;
      });
    }, 500);
  };

  // Update participant media status
  const updateParticipantMediaStatus = (userId, mediaStatus) => {
    setParticipants(prev => {
      const newParticipants = new Map(prev);
      const participant = newParticipants.get(userId);
      if (participant) {
        newParticipants.set(userId, {
          ...participant,
          cameraEnabled: mediaStatus.cameraEnabled,
          micEnabled: mediaStatus.micEnabled
        });
      }
      return newParticipants;
    });
  };

  // Add participant animation
  const addParticipantAnimation = (userId, type) => {
    setParticipantAnimations(prev => {
      const newAnimations = new Map(prev);
      newAnimations.set(userId, {
        type,
        timestamp: Date.now()
      });
      return newAnimations;
    });

    setTimeout(() => {
      setParticipantAnimations(prev => {
        const newAnimations = new Map(prev);
        newAnimations.delete(userId);
        return newAnimations;
      });
    }, 2000);
  };

  // Check if screen sharing is allowed
  const canStartScreenShare = () => {
    return !activeScreenSharer || activeScreenSharer === String(currentUser.user_id);
  };

  // Initialize meeting
  const initializeMeeting = async () => {
    try {
      console.log('🎥 Initializing meeting for user:', currentUser.user_id);
      console.log('🌐 Current URL:', window.location.href);
      console.log('🔒 Protocol:', window.location.protocol);
      console.log('🏠 Hostname:', window.location.hostname);
      
      setConnectionStatus('Requesting camera and microphone');
      
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('❌ navigator.mediaDevices is undefined or getUserMedia not supported');
        console.log('📊 Browser info:', {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          protocol: window.location.protocol,
          hostname: window.location.hostname,
          hasNavigator: !!navigator,
          hasMediaDevices: !!navigator.mediaDevices,
          hasGetUserMedia: navigator.mediaDevices ? !!navigator.mediaDevices.getUserMedia : false
        });
        
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isHTTPS = window.location.protocol === 'https:';
        
        let errorMessage = '❌ Camera/Microphone Access Not Available!\n\n';
        
        if (!isHTTPS && !isLocalhost) {
          errorMessage += '🔒 SECURITY ISSUE: You are accessing this page over HTTP from a non-localhost address.\n\n';
          errorMessage += 'Browsers block camera/microphone access over HTTP for security.\n\n';
          errorMessage += '✅ SOLUTIONS:\n';
          errorMessage += '1. Use HTTPS instead of HTTP\n';
          errorMessage += '2. Access from localhost on the same machine\n';
          errorMessage += '3. Current URL: ' + window.location.href + '\n';
          errorMessage += '4. Try: http://localhost:5173 (if on same machine)\n';
        } else {
          errorMessage += 'Your browser does not support camera/microphone access.\n\n';
          errorMessage += '✅ SOLUTIONS:\n';
          errorMessage += '1. Update your browser to the latest version\n';
          errorMessage += '2. Use Chrome, Firefox, or Edge\n';
          errorMessage += '3. Check browser security settings\n';
        }
        
        setConnectionStatus('❌ Browser does not support camera/microphone');
        alert(errorMessage);
        throw new Error('getUserMedia not supported');
      }
      
      // Try to get media with detailed error handling
      let stream;
      try {
        console.log('📹 Requesting camera and microphone access...');
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
      } catch (mediaError) {
        console.error('❌ getUserMedia error:', mediaError.name, mediaError.message);
        console.error('❌ Full error:', mediaError);
        
        if (mediaError.name === 'NotAllowedError') {
          setConnectionStatus('❌ Permission denied - Please allow camera and microphone access');
          alert('Camera/Microphone access denied.\n\nPlease:\n1. Click the camera icon in your browser address bar\n2. Allow camera and microphone\n3. Refresh the page and try again');
        } else if (mediaError.name === 'NotFoundError') {
          setConnectionStatus('❌ No camera or microphone found');
          alert('No camera or microphone found on this device.');
        } else if (mediaError.name === 'NotReadableError') {
          setConnectionStatus('❌ Camera is already in use');
          
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          
          if (isLocalhost) {
            // Same machine - explain how to use different browsers
            alert('⚠️ Camera is ALREADY IN USE on this computer!\n\n' +
                  '🖥️ Testing on the SAME machine?\n' +
                  'You can only use ONE camera at a time.\n\n' +
                  '✅ OPTIONS:\n\n' +
                  '1️⃣ DIFFERENT BROWSERS (Recommended):\n' +
                  '   • First user: Chrome\n' +
                  '   • Second user: Edge (or Firefox)\n' +
                  '   Each browser can access the camera independently!\n\n' +
                  '2️⃣ EXTERNAL CAMERA:\n' +
                  '   • Connect USB webcam\n' +
                  '   • Use phone as webcam\n\n' +
                  '3️⃣ DIFFERENT DEVICE:\n' +
                  '   • Test with another computer/phone\n' +
                  '   • Use https:// for network access\n\n' +
                  '4️⃣ CLOSE OTHER TABS:\n' +
                  '   • Close ALL browser windows\n' +
                  '   • Wait 5 seconds\n' +
                  '   • Try again');
          } else {
            // Different machine
            alert('⚠️ Camera or microphone is ALREADY IN USE!\n\n' +
                  'This usually means another tab, window, or app is using your camera.\n\n' +
                  '✅ QUICK FIX:\n' +
                  '1. Close other tabs/apps using the camera\n' +
                  '2. Close ALL browser windows\n' +
                  '3. Wait 5 seconds for camera to release\n' +
                  '4. Reopen browser and try again');
          }
        } else {
          setConnectionStatus(`❌ Media error: ${mediaError.message}`);
          alert(`Error accessing media: ${mediaError.message}`);
        }
        throw mediaError;
      }
      
      console.log('✅ Media stream obtained:', {
        id: stream.id,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });
      
      setLocalStream(stream);
      localStreamRef.current = stream; // Store in ref for cleanup
      
      // Set video element srcObject
      if (localVideoRef.current) {
        console.log('🎥 Setting localVideoRef.current.srcObject');
        localVideoRef.current.srcObject = stream;
      } else {
        console.warn('⚠️ localVideoRef.current is null, will be set by ref callback');
      }

      setParticipants(prev => {
        const newParticipants = new Map(prev);
        newParticipants.set(String(currentUser.user_id), {
          id: String(currentUser.user_id),
          name: currentUser.name || `User ${currentUser.user_id}`,
          stream: stream,
          cameraEnabled: cameraEnabled,
          micEnabled: micEnabled,
          isLocal: true
        });
        return newParticipants;
      });

      setConnectionStatus('Connected');
      setConnected(true);

      console.log('📡 Sending user_joined signal to other participants');
      sendSignal({ 
        type: 'user_joined',
        userId: currentUser.user_id,
        userName: currentUser.name || `User ${currentUser.user_id}`
      });

      addParticipantAnimation(String(currentUser.user_id), 'join');

      // Small delay to ensure other participants receive our user_joined signal first
      await new Promise(resolve => setTimeout(resolve, 100));

      const allParticipants = [
        ...participantIds.map(String),
        String(meeting.organizer_id || '')
      ].filter(id => id !== String(currentUser.user_id));

      console.log('👥 Creating peer connections with:', allParticipants);
      if (allParticipants.length > 0) {
        for (const participantId of allParticipants) {
          console.log(`  - Connecting to participant ${participantId}...`);
          await createPeerConnection(participantId, true);
        }
      } else {
        console.log('  - No other participants to connect to yet');
      }

    } catch (error) {
      console.error('❌ Error initializing meeting:', error);
      
      // Even if camera/mic fails, allow user to join meeting without media
      console.log('⚠️ Proceeding without local media stream...');
      
      setConnectionStatus('Joined without camera/microphone');
      setConnected(true); // Still mark as connected so they can see the meeting
      
      // Add participant without stream
      setParticipants(prev => {
        const newParticipants = new Map(prev);
        newParticipants.set(String(currentUser.user_id), {
          id: String(currentUser.user_id),
          name: currentUser.name || `User ${currentUser.user_id}`,
          stream: null, // No stream
          cameraEnabled: false,
          micEnabled: false,
          isLocal: true
        });
        return newParticipants;
      });
      
      console.log('📡 Sending user_joined signal (without media)');
      sendSignal({ 
        type: 'user_joined',
        userId: currentUser.user_id,
        userName: currentUser.name || `User ${currentUser.user_id}`
      });
      
      addParticipantAnimation(String(currentUser.user_id), 'join');
      
      // Small delay to ensure other participants receive our user_joined signal first
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const allParticipants = [
        ...participantIds.map(String),
        String(meeting.organizer_id || '')
      ].filter(id => id !== String(currentUser.user_id));
      
      console.log('👥 Creating peer connections with:', allParticipants);
      if (allParticipants.length > 0) {
        for (const participantId of allParticipants) {
          console.log(`  - Connecting to participant ${participantId}...`);
          await createPeerConnection(participantId, true);
        }
      } else {
        console.log('  - No other participants to connect to yet');
      }
      
      console.log('✅ Joined meeting successfully (without local media)');
    }
  };

  // Control functions
  const toggleCamera = () => {
    if (!localStream) return;
    
    const videoTracks = localStream.getVideoTracks();
    const next = !cameraEnabled;
    
    videoTracks.forEach(track => {
      track.enabled = next;
    });
    
    setCameraEnabled(next);
    
    console.log(`📹 Camera toggled: ${next ? 'ON' : 'OFF'}`);
    console.log(`  - Video tracks enabled: ${videoTracks.map(t => t.enabled).join(', ')}`);
    
    setParticipants(prev => {
      const newParticipants = new Map(prev);
      const localParticipant = newParticipants.get(String(currentUser.user_id));
      if (localParticipant) {
        newParticipants.set(String(currentUser.user_id), {
          ...localParticipant,
          cameraEnabled: next
        });
      }
      return newParticipants;
    });

    sendSignal({
      type: 'media_status',
      mediaStatus: { cameraEnabled: next, micEnabled }
    });
  };

  const toggleMic = () => {
    if (!localStream) return;
    
    const audioTracks = localStream.getAudioTracks();
    const next = !micEnabled;
    
    audioTracks.forEach(track => {
      track.enabled = next;
    });
    
    setMicEnabled(next);
    
    console.log(`🎤 Microphone toggled: ${next ? 'ON' : 'OFF'}`);
    console.log(`  - Audio tracks enabled: ${audioTracks.map(t => t.enabled).join(', ')}`);
    
    setParticipants(prev => {
      const newParticipants = new Map(prev);
      const localParticipant = newParticipants.get(String(currentUser.user_id));
      if (localParticipant) {
        newParticipants.set(String(currentUser.user_id), {
          ...localParticipant,
          micEnabled: next
        });
      }
      return newParticipants;
    });

    sendSignal({
      type: 'media_status',
      mediaStatus: { cameraEnabled, micEnabled: next }
    });
  };

  const startScreenShare = async () => {
    if (!canStartScreenShare()) {
      alert('Screen sharing is already active by another participant');
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true, 
        audio: true 
      });
      
      screenStreamRef.current = displayStream;
      
      const screenTrack = displayStream.getVideoTracks()[0];
      
      peerConnections.current.forEach((pc) => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      });
      
      setScreenSharing(true);
      setActiveScreenSharer(String(currentUser.user_id));
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = displayStream;
      }
      
      sendSignal({
        type: 'screen_share_start',
        userId: currentUser.user_id
      });
      
      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = async () => {
    try {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      
      const cameraTrack = localStream?.getVideoTracks()?.[0];
      
      peerConnections.current.forEach((pc) => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender && cameraTrack) {
          sender.replaceTrack(cameraTrack);
        }
      });
      
      setScreenSharing(false);
      setActiveScreenSharer(null);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      sendSignal({
        type: 'screen_share_stop',
        userId: currentUser.user_id
      });
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  };

  const sendChatMessage = () => {
    const message = chatInput.trim();
    if (!message) return;
    
    const chatData = {
      type: 'chat',
      message,
      fromUserName: currentUser.name || `User ${currentUser.user_id}`,
      timestamp: new Date().toISOString()
    };
    
    // Send via WebSocket to all participants
    sendSignal({
      type: 'chat',
      message,
      fromUserName: currentUser.name || `User ${currentUser.user_id}`
    });
    
    // Send to all connected data channels
    dataChannels.current.forEach((channel) => {
      if (channel.readyState === 'open') {
        channel.send(JSON.stringify(chatData));
      }
    });
    
    // Add to local chat
    setChatMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      from: String(currentUser.user_id),
      fromName: 'You',
      text: message,
      timestamp: new Date()
    }]);
    
    setChatInput('');
  };

  const cleanupMeetingResources = () => {
    console.log('🧹 Cleaning up meeting resources...');
    
    // IMPORTANT: Stop media tracks FIRST to release camera/mic immediately
    if (localStreamRef.current) {
      console.log('  - Stopping local stream tracks...');
      const tracks = localStreamRef.current.getTracks();
      console.log(`  - Found ${tracks.length} tracks to stop`);
      tracks.forEach((track, index) => {
        console.log(`    [${index + 1}/${tracks.length}] Stopping ${track.kind} track (${track.label}, state: ${track.readyState})`);
        track.stop();
        console.log(`    [${index + 1}/${tracks.length}] ✅ Stopped (new state: ${track.readyState})`);
      });
      localStreamRef.current = null;
      console.log('  - ✅ localStreamRef cleared');
    } else {
      console.log('  - No local stream to stop');
    }
    
    // Also clear the state
    setLocalStream(null);
    
    // Clear video element
    if (localVideoRef.current) {
      console.log('  - Clearing video element srcObject');
      localVideoRef.current.srcObject = null;
    }
    
    if (screenStreamRef.current) {
      console.log('  - Stopping screen share tracks...');
      screenStreamRef.current.getTracks().forEach(track => {
        console.log(`    - Stopping ${track.kind} track`);
        track.stop();
      });
      screenStreamRef.current = null;
    }
    
    // Close peer connections
    if (peerConnections.current.size > 0) {
      console.log(`  - Closing ${peerConnections.current.size} peer connections...`);
      peerConnections.current.forEach((pc, userId) => {
        console.log(`    - Closing connection with ${userId}`);
        pc.close();
      });
      peerConnections.current.clear();
    }
    
    // Close data channels
    if (dataChannels.current.size > 0) {
      console.log(`  - Closing ${dataChannels.current.size} data channels...`);
      dataChannels.current.forEach((channel) => {
        channel.close();
      });
      dataChannels.current.clear();
    }
    
    // Close WebSocket
    if (wsRef.current) {
      console.log('  - Closing WebSocket (state:', wsRef.current.readyState, ')');
      wsRef.current.close();
      wsRef.current = null;
    }
    
    console.log('✅ Cleanup complete - ALL resources released');
    
    setConnected(false);
    setConnectionStatus('Meeting ended');
  };

  const endMeeting = () => {
    // Send user_left signal BEFORE cleanup so others know we're leaving
    console.log('🚪 Leaving meeting, notifying other participants...');
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      sendSignal({ 
        type: 'user_left',
        userId: currentUser.user_id,
        userName: currentUser.name || `User ${currentUser.user_id}`
      });
      console.log('  - Sent user_left signal');
    } else {
      console.warn('  - Cannot send user_left signal, WebSocket not open');
    }
    
    // Small delay to ensure signal is sent before cleanup
    setTimeout(() => {
      cleanupMeetingResources();
      
      if (typeof onRequestClose === 'function') {
        onRequestClose();
      }
    }, 100);
  };

  // Initialize WebSocket and meeting (only once per meetingId)
  useEffect(() => {
    console.log('🔄 Starting WebSocket initialization...');
    const token = localStorage.getItem('token');
    
    console.log('🔑 Token check:');
    console.log('  - Token exists:', !!token);
    console.log('  - Token length:', token ? token.length : 0);
    console.log('  - Token preview:', token ? token.substring(0, 50) + '...' : 'null');
    
    if (!token) {
      console.error('❌ No authentication token found in localStorage');
      setConnectionStatus('Authentication failed - please login again');
      alert('No authentication token found. Please logout and login again.');
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Determine the correct backend server host
    const hostname = window.location.hostname;
    const port = window.location.port;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    // If on localhost, connect to localhost:7007
    // If on network IP (like 192.168.x.x), use the SAME IP but port 7007
    let serverHost;
    if (isLocalhost) {
      serverHost = 'localhost:7007';
    } else {
      // Use the same hostname as the frontend, but change port to 7007
      serverHost = `${hostname}:7007`;
    }
    
    const envWsBase = import.meta.env.VITE_WS_BASE_URL;
    const wsUrl = envWsBase
      ? `${envWsBase.replace(/\/$/, '')}/ws/notifications?token=${encodeURIComponent(token || '')}`
      : `${protocol}//${serverHost}/ws/notifications?token=${encodeURIComponent(token || '')}`;

    console.log('🔌 WebSocket connection details:');
    console.log('  - Frontend Hostname:', hostname);
    console.log('  - Frontend Port:', port);
    console.log('  - Is Localhost:', isLocalhost);
    console.log('  - Backend Server Host:', serverHost);
    console.log('  - Protocol:', protocol);
    console.log('  - Env WS Base:', envWsBase || 'not set');
    console.log('  - Full URL:', wsUrl.replace(/token=[^&]+/, 'token=***'));
    console.log('  - Attempting connection...');

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connected successfully!');
      console.log('  - ReadyState:', ws.readyState, '(1 = OPEN)');
      setConnectionStatus('Connected to signaling server');
      initializeMeeting();
    };

    // Use ref to always get the latest message handler without re-initializing WebSocket
    ws.onmessage = (evt) => {
      if (handleWebSocketMessageRef.current) {
        handleWebSocketMessageRef.current(evt);
      }
    };
    
    ws.onclose = (event) => {
      console.log('❌ WebSocket closed!');
      console.log('  - Code:', event.code);
      console.log('  - Reason:', event.reason || 'No reason provided');
      console.log('  - Was Clean:', event.wasClean);
      
      if (event.code === 1008) {
        console.error('  - 🔒 Authentication failed!');
        setConnectionStatus('Authentication failed - please refresh and login again');
        alert('WebSocket authentication failed. Your token may be expired or invalid. Please logout and login again.');
      } else if (event.code === 1006) {
        console.error('  - 🔌 Connection closed abnormally');
        setConnectionStatus('Connection lost - please check server');
      } else {
        setConnectionStatus(`Signaling disconnected (code: ${event.code})`);
      }
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket error occurred!');
      console.error('  - Error:', error);
      console.error('  - ReadyState:', ws.readyState);
      console.error('  - URL:', wsUrl.replace(/token=[^&]+/, 'token=***'));
      setConnectionStatus('Connection error - check network and server');
    };

    return () => {
      console.log('🧹 Cleaning up WebSocket connection...');
      // Only close WebSocket on cleanup, don't close entire meeting
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        console.log('  - Closing WebSocket (readyState:', ws.readyState, ')');
        ws.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]); // Only re-initialize when meetingId changes

  // Manage body class for full-screen meeting
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    
    document.body.classList.add('meeting-active');
    document.documentElement.classList.add('meeting-active');
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.margin = '';
      document.documentElement.style.padding = '';
      
      document.body.classList.remove('meeting-active');
      document.documentElement.classList.remove('meeting-active');
    };
  }, []);

  // Cleanup on unmount - only cleanup resources, don't trigger onRequestClose
  useEffect(() => {
    return () => {
      cleanupMeetingResources();
    };
  }, []);

  // Cleanup on tab close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      console.log('🚪 Tab closing/refreshing - cleaning up resources');
      cleanupMeetingResources();
      
      // Send user_left signal
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendSignal({ type: 'user_left' });
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('👁️ Tab hidden - user might be switching tabs');
      } else {
        console.log('👁️ Tab visible again');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Handle Enter key in chat
  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendChatMessage();
    }
  };

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []); // No dependencies - uses ref

  const handleMouseMove = useCallback(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const participantArray = Array.from(participants.values());
  const remoteParticipants = participantArray.filter(p => !p.isLocal);
  const localParticipant = participantArray.find(p => p.isLocal);

  // Calculate grid layout
  const getGridLayout = (count) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-2 lg:grid-cols-3';
    if (count <= 9) return 'grid-cols-3';
    return 'grid-cols-3 xl:grid-cols-4';
  };

  return (
    <div 
      className="fixed inset-0 bg-black meeting-room-fullscreen"
      onMouseMove={handleMouseMove}
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        backgroundColor: '#000000',
        overflow: 'hidden',
        margin: 0,
        padding: 0
      }}
    >
      {/* Top Bar */}
      <div className={`absolute top-0 left-0 right-0 z-20 transition-all duration-300 ${
        showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
      }`}>
        <div 
          className="text-white px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-2"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <div className="flex items-center space-x-2 sm:space-x-6 flex-1 min-w-0">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm sm:text-xl font-semibold text-white truncate">{meeting.title || 'Meeting'}</span>
            </div>
            <div className={`hidden sm:block text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${
              connected ? 'bg-gray-800/50 text-gray-300' : 'bg-yellow-600/80 text-white'
            }`}>
              {connected ? `${participantArray.length} participant${participantArray.length !== 1 ? 's' : ''}` : connectionStatus}
            </div>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <button
              onClick={() => setViewMode(viewMode === 'gallery' ? 'speaker' : 'gallery')}
              className="hidden sm:flex p-2 rounded-full hover:bg-white/10 transition-all duration-200 hover:scale-105"
              title={viewMode === 'gallery' ? 'Speaker View' : 'Gallery View'}
            >
              {viewMode === 'gallery' ? <SpeakerViewIcon size="w-5 h-5" /> : <GalleryViewIcon size="w-5 h-5" />}
            </button>
            
            <button
              onClick={() => {
                setShowParticipants(!showParticipants);
                if (!showParticipants && showChat) {
                  setShowChat(false); // Close chat when opening participants
                }
              }}
              className={`p-1.5 sm:p-2 rounded-full transition-all duration-200 hover:scale-105 relative ${
                showParticipants ? 'bg-blue-600' : 'hover:bg-white/10'
              }`}
              title="Participants"
            >
              <ParticipantsIcon size="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {participantArray.length}
              </span>
            </button>
            
            <button
              onClick={() => {
                setShowChat(!showChat);
                if (!showChat && showParticipants) {
                  setShowParticipants(false); // Close participants when opening chat
                }
              }}
              className={`p-1.5 sm:p-2 rounded-full transition-all duration-200 hover:scale-105 relative ${
                showChat ? 'bg-blue-600' : 'hover:bg-white/10'
              }`}
              title="Chat"
            >
              <ChatIcon size="w-4 h-4 sm:w-5 sm:h-5" />
              {chatMessages.length > 0 && !showChat && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {chatMessages.length > 9 ? '9+' : chatMessages.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="absolute inset-0 flex flex-col md:flex-row">
        <div className="flex-1 transition-all duration-300 relative">
          <div className="w-full h-full p-1 sm:p-2">
            {!connected ? (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="text-8xl mb-8">
                    {connectionStatus.includes('Authentication') || connectionStatus.includes('error') ? '⚠️' : '🔄'}
                  </div>
                  <div className="text-3xl font-light mb-4">{connectionStatus}</div>
                  {connectionStatus.includes('Authentication') && (
                    <div className="mt-4">
                      <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                      >
                        Reload Page
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : participantArray.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="text-8xl mb-8">🎥</div>
                  <div className="text-3xl font-light mb-4">Waiting for participants...</div>
                </div>
              </div>
            ) : (
              <div className={`grid w-full h-full ${getGridLayout(participantArray.length)} gap-2`}>
                {participantArray.map((participant) => {
                  const animation = participantAnimations.get(participant.id);
                  const isScreenSharing = activeScreenSharer === participant.id;
                  
                  return (
                    <div 
                      key={participant.id} 
                      className={`relative bg-gray-900 rounded-lg overflow-hidden ${
                        animation ? (animation.type === 'join' ? 'animate-pulse' : 'opacity-50') : ''
                      } ${isScreenSharing ? 'ring-4 ring-blue-500' : ''}`}
                    >
                      {participant.stream ? (
                        <video
                          ref={(el) => {
                            if (participant.isLocal) {
                              localVideoRef.current = el;
                              // Set stream only if not already set (prevents flickering)
                              if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) {
                                console.log('🎥 Setting local video srcObject');
                                el.srcObject = localStreamRef.current;
                              }
                            } else {
                              // Remote participant - set only if not already set
                              if (el && participant.stream && el.srcObject !== participant.stream) {
                                console.log(`🎥 Setting remote video srcObject for ${participant.id}`);
                                el.srcObject = participant.stream;
                              }
                            }
                          }}
                          autoPlay
                          playsInline
                          muted={participant.isLocal}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        // No stream - show avatar placeholder
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                          <div className="text-center">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-6xl font-bold mb-4 mx-auto">
                              {participant.name ? participant.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div className="text-white text-sm opacity-70">
                              {participant.isLocal ? 'Camera not available' : 'No video'}
                            </div>
                          </div>
                        </div>
                      )}
                    
                      {/* Screen sharing indicator */}
                      {isScreenSharing && (
                        <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-2">
                          <ScreenShareIcon size="w-4 h-4" />
                          <span className="text-sm">Sharing</span>
                        </div>
                      )}
                      
                      {/* Participant info */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-white text-lg font-semibold">
                            {participant.name}{participant.isLocal && ' (You)'}
                          </div>
                          
                          {/* Status indicators */}
                          <div className="flex gap-2">
                            {!participant.micEnabled && (
                              <div className="bg-red-600 text-white p-2 rounded-full" title="Microphone Off">
                                <MicOffIcon size="w-4 h-4" />
                              </div>
                            )}
                            {participant.micEnabled && (
                              <div className="bg-gray-700 text-white p-2 rounded-full" title="Microphone On">
                                <MicOnIcon size="w-4 h-4" />
                              </div>
                            )}
                            {!participant.cameraEnabled && (
                              <div className="bg-red-600 text-white p-2 rounded-full" title="Camera Off">
                                <CameraOffIcon size="w-4 h-4" />
                              </div>
                            )}
                            {participant.cameraEnabled && (
                              <div className="bg-gray-700 text-white p-2 rounded-full" title="Camera On">
                                <CameraOnIcon size="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Participants Sidebar - Responsive */}
        {showParticipants && (
          <div 
            className="fixed md:relative inset-y-0 left-0 w-full sm:w-80 md:w-96 flex flex-col z-30"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.98)',
              backdropFilter: 'blur(20px)',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="p-4 sm:p-6 border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-white text-lg sm:text-xl font-bold">Participants ({participantArray.length})</h2>
                <button 
                  onClick={() => setShowParticipants(false)}
                  className="text-gray-400 hover:text-white text-2xl leading-none p-1"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
              {participantArray.map((participant) => (
                <div key={participant.id} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 hover:bg-gray-800/50 rounded-xl">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-base sm:text-lg font-bold flex-shrink-0">
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm sm:text-lg font-semibold truncate">
                      {participant.name}
                      {participant.isLocal && ' (You)'}
                    </div>
                    <div className="flex items-center space-x-2 mt-1 sm:mt-2">
                      {participant.micEnabled ? (
                        <MicOnIcon size="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <MicOffIcon size="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                      {participant.cameraEnabled ? (
                        <CameraOnIcon size="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <CameraOffIcon size="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Sidebar - Responsive */}
        {showChat && (
          <div 
            className="fixed md:relative inset-y-0 right-0 w-full sm:w-80 md:w-96 flex flex-col z-30"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.98)',
              backdropFilter: 'blur(20px)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="p-4 sm:p-6 border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-white text-lg sm:text-xl font-bold">Chat</h2>
                <button 
                  onClick={() => setShowChat(false)}
                  className="text-gray-400 hover:text-white text-2xl leading-none p-1"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-gray-400 text-center py-8 sm:py-12">
                  <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">💬</div>
                  <div className="text-base sm:text-lg">No messages yet</div>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.from === String(currentUser.user_id) ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] sm:max-w-xs px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${
                      message.from === String(currentUser.user_id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-white'
                    }`}>
                      <div className="text-[10px] sm:text-xs opacity-75 mb-1 font-medium">
                        {message.fromName}
                      </div>
                      <div className="text-sm sm:text-base break-words">{message.text}</div>
                      <div className="text-[10px] sm:text-xs opacity-50 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-3 sm:p-4 border-t border-gray-800 flex-shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 text-xs sm:text-sm"
                />
                <button
                  onClick={sendChatMessage}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-xs sm:text-sm transition-colors flex items-center gap-1"
                  title="Send message"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar - Responsive */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ${
        showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'
      }`}>
        <div 
          className="p-3 sm:p-6 flex justify-center"
          style={{
            background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={toggleMic}
              className={`p-2 sm:p-3 rounded-full transition-all duration-200 hover:scale-105 ${
                micEnabled 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              title={micEnabled ? 'Mute' : 'Unmute'}
            >
              {micEnabled ? <MicOnIcon size="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOffIcon size="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            
            <button
              onClick={toggleCamera}
              className={`p-2 sm:p-3 rounded-full transition-all duration-200 hover:scale-105 ${
                cameraEnabled 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {cameraEnabled ? <CameraOnIcon size="w-4 h-4 sm:w-5 sm:h-5" /> : <CameraOffIcon size="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            
            <button
              onClick={screenSharing ? stopScreenShare : startScreenShare}
              disabled={!canStartScreenShare() && !screenSharing}
              className={`hidden sm:flex p-2 sm:p-3 rounded-full transition-all duration-200 hover:scale-105 ${
                screenSharing 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : canStartScreenShare()
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
              title={screenSharing ? 'Stop sharing' : 'Share screen'}
            >
              <ScreenShareIcon size="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            <button
              onClick={endMeeting}
              className="p-2 sm:p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200 hover:scale-105 font-semibold text-xs sm:text-base"
              title="End meeting"
            >
              <EndCallIcon size="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiUserMeetingRoom;
