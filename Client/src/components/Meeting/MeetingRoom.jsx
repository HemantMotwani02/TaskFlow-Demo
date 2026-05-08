import React from 'react';

// Modern Meeting Icons
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

// Modern Full-Screen Meeting Room Component
const MeetingRoom = ({ meeting, currentUser, onRequestClose }) => {
  const localVideoRef = React.useRef(null);
  const remoteVideoRef = React.useRef(null);
  const pcRef = React.useRef(null);
  const wsRef = React.useRef(null);
  const localStreamRef = React.useRef(null);
  const screenStreamRef = React.useRef(null);
  const dataChannelRef = React.useRef(null);
  
  const [connected, setConnected] = React.useState(false);
  const [connectionStatus, setConnectionStatus] = React.useState('Initializing...');
  const [cameraEnabled, setCameraEnabled] = React.useState(true);
  const [micEnabled, setMicEnabled] = React.useState(true);
  const [screenSharing, setScreenSharing] = React.useState(false);
  const [chatMessages, setChatMessages] = React.useState([]);
  const [chatInput, setChatInput] = React.useState('');
  const [showChat, setShowChat] = React.useState(false);
  const [showControls, setShowControls] = React.useState(true);
  const [controlsTimeout, setControlsTimeout] = React.useState(null);

  const meetingId = meeting.meeting_id || meeting.id;
  const participantIds = Array.isArray(meeting.participants) ? meeting.participants : [];

  React.useEffect(() => {
    let stopped = false;
    const token = localStorage.getItem('token');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const isDevHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const envWsBase = import.meta.env.VITE_WS_BASE_URL;
    const serverHost = isDevHost ? 'localhost:7007' : window.location.host;
    const wsUrl = envWsBase
      ? `${envWsBase.replace(/\/$/, '')}/ws/notifications?token=${encodeURIComponent(token || '')}`
      : `${protocol}//${serverHost}/ws/notifications?token=${encodeURIComponent(token || '')}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = async (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type !== 'meeting_signal') return;
        const { meetingId: mid, fromUserId, signal } = msg.payload || {};
        if (mid !== meetingId || String(fromUserId) === String(currentUser.user_id)) return;

        const pc = pcRef.current;
        if (!pc) return;

        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal({ type: 'answer', sdp: pc.localDescription });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        } else if (signal.type === 'ice') {
          if (signal.candidate) {
            try { await pc.addIceCandidate(signal.candidate); } catch {}
          }
        } else if (signal.type === 'chat') {
          setChatMessages(prev => [...prev, { 
            from: 'remote', 
            text: signal.message,
            fromName: signal.fromUserName || `User ${fromUserId}`,
            timestamp: new Date()
          }]);
        }
      } catch {}
    };

    const init = async () => {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pcRef.current = pc;
      setConnectionStatus('Creating peer connection');
      
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          sendSignal({ type: 'ice', candidate: e.candidate });
        }
      };
      
      pc.ontrack = (e) => {
        if (remoteVideoRef.current && e.streams && e.streams[0]) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      };
      
      pc.onconnectionstatechange = () => {
        const state = pcRef.current?.connectionState;
        if (state === 'connected') {
          setConnected(true);
          setConnectionStatus('Connected');
        } else if (state === 'connecting') {
          setConnectionStatus('Connecting to peer...');
        } else if (state === 'disconnected' || state === 'failed') {
          setConnected(false);
          setConnectionStatus(state === 'failed' ? 'Connection failed' : 'Disconnected');
        }
      };

      try {
        setConnectionStatus('Requesting camera and microphone');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach(t => pc.addTrack(t, stream));
      } catch (err) {
        setConnectionStatus('Permission denied for camera/microphone');
        console.error('getUserMedia error', err);
        return;
      }

      // Initiator: lowest userId starts offer
      const allIds = [...participantIds.map(String), String(currentUser.user_id), String(meeting.organizer_id || '')].filter(Boolean);
      const isInitiator = allIds.sort()[0] === String(currentUser.user_id);

      // Setup data channel for chat
      const setupDataChannel = (channel) => {
        if (!channel) return;
        dataChannelRef.current = channel;
        channel.onopen = () => {
          console.log('Data channel opened');
        };
        channel.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setChatMessages(prev => [...prev, { 
              from: 'remote', 
              text: data.message,
              fromName: data.fromUserName || 'User',
              timestamp: new Date()
            }]);
          } catch {
            setChatMessages(prev => [...prev, { from: 'remote', text: String(event.data), timestamp: new Date() }]);
          }
        };
      };

      if (isInitiator) {
        const dc = pc.createDataChannel('chat');
        setupDataChannel(dc);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal({ type: 'offer', sdp: pc.localDescription });
      } else {
        pc.ondatachannel = (event) => setupDataChannel(event.channel);
      }

      setConnected(true);
      setConnectionStatus('Waiting for peer...');
    };

    const sendSignal = (signal) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      const baseRecipients = new Set([
        ...(Array.isArray(meeting.participants) ? meeting.participants.map(String) : []),
        String(meeting.organizer_id || '')
      ]);
      baseRecipients.delete(String(currentUser.user_id));
      wsRef.current.send(JSON.stringify({
        type: 'meeting_signal',
        payload: {
          meetingId,
          fromUserId: currentUser.user_id,
          recipients: Array.from(baseRecipients).filter(Boolean),
          signal
        }
      }));
    };

    ws.onopen = () => { setConnectionStatus('Connected to signaling server'); init(); };
    ws.onclose = () => { setConnectionStatus('Signaling disconnected'); };
    ws.onerror = () => { setConnectionStatus('Signaling error'); };

    return () => {
      stopped = true;
      try { wsRef.current && wsRef.current.close(); } catch {}
      try {
        if (pcRef.current) pcRef.current.close();
        if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
        if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(t => t.stop());
      } catch {}
    };
  }, [meetingId]);

  // Force full-screen
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.classList.add('meeting-active');
    document.documentElement.classList.add('meeting-active');
    
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('meeting-active');
      document.documentElement.classList.remove('meeting-active');
    };
  }, []);

  // Controls
  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTracks = stream.getVideoTracks();
    const next = !cameraEnabled;
    videoTracks.forEach(t => { t.enabled = next; });
    setCameraEnabled(next);
  };

  const toggleMic = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTracks = stream.getAudioTracks();
    const next = !micEnabled;
    audioTracks.forEach(t => { t.enabled = next; });
    setMicEnabled(next);
  };

  const startScreenShare = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = displayStream;
      const screenTrack = displayStream.getVideoTracks()[0];
      const sender = pcRef.current?.getSenders()?.find(s => s.track && s.track.kind === 'video');
      if (sender) await sender.replaceTrack(screenTrack);
      setScreenSharing(true);
      if (localVideoRef.current) localVideoRef.current.srcObject = displayStream;
      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (e) {
      console.error('getDisplayMedia error', e);
    }
  };

  const stopScreenShare = async () => {
    try {
      const displayStream = screenStreamRef.current;
      if (displayStream) {
        displayStream.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      const cameraStream = localStreamRef.current;
      const cameraTrack = cameraStream?.getVideoTracks()?.[0];
      const sender = pcRef.current?.getSenders()?.find(s => s.track && s.track.kind === 'video');
      if (sender && cameraTrack) await sender.replaceTrack(cameraTrack);
      setScreenSharing(false);
      if (localVideoRef.current) localVideoRef.current.srcObject = cameraStream || null;
    } catch (e) {
      console.error('stopScreenShare error', e);
    }
  };

  const endMeeting = () => {
    try { wsRef.current && wsRef.current.close(); } catch {}
    try { pcRef.current && pcRef.current.close(); } catch {}
    try { localStreamRef.current && localStreamRef.current.getTracks().forEach(t => t.stop()); } catch {}
    try { screenStreamRef.current && screenStreamRef.current.getTracks().forEach(t => t.stop()); } catch {}
    setConnected(false);
    setConnectionStatus('Ended');
    if (typeof onRequestClose === 'function') {
      onRequestClose();
    }
  };

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    
    const chatData = {
      type: 'chat',
      message: text,
      fromUserName: currentUser.name || `User ${currentUser.user_id}`,
      timestamp: new Date().toISOString()
    };

    // Send via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const baseRecipients = new Set([
        ...(Array.isArray(meeting.participants) ? meeting.participants.map(String) : []),
        String(meeting.organizer_id || '')
      ]);
      baseRecipients.delete(String(currentUser.user_id));
      
      wsRef.current.send(JSON.stringify({
        type: 'meeting_signal',
        payload: {
          meetingId,
          fromUserId: currentUser.user_id,
          recipients: Array.from(baseRecipients).filter(Boolean),
          signal: {
            type: 'chat',
            message: text,
            fromUserName: currentUser.name || `User ${currentUser.user_id}`
          }
        }
      }));
    }
    
    // Send via DataChannel
    const dc = dataChannelRef.current;
    if (dc && dc.readyState === 'open') {
      dc.send(JSON.stringify(chatData));
    }
    
    setChatMessages(prev => [...prev, { from: 'me', text, fromName: 'You', timestamp: new Date() }]);
    setChatInput('');
  };

  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendChat();
    }
  };

  // Auto-hide controls
  const resetControlsTimeout = React.useCallback(() => {
    setShowControls(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    setControlsTimeout(timeout);
  }, [controlsTimeout]);

  const handleMouseMove = React.useCallback(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

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
        overflow: 'hidden'
      }}
    >
      {/* Top Bar */}
      <div className={`absolute top-0 left-0 right-0 z-30 transition-all duration-300 ${
        showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
      }`}>
        <div 
          className="text-white px-6 py-4 flex justify-between items-center"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-xl font-semibold text-white">{meeting.title || 'Meeting'}</span>
            </div>
            <div className="text-sm text-gray-300 bg-gray-800/50 px-3 py-1 rounded-full">
              {connectionStatus}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-3 rounded-full transition-all duration-200 hover:scale-105 ${
                showChat ? 'bg-blue-600' : 'hover:bg-white/10'
              }`}
              title="Chat"
            >
              <ChatIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="absolute inset-0 flex">
        <div className={`flex-1 transition-all duration-300 ${showChat ? 'mr-96' : ''}`}>
          <div className="w-full h-full p-2">
            <div className="grid grid-cols-2 gap-2 w-full h-full">
              {/* Local Video */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-white text-lg font-semibold">
                      You
                    </div>
                    <div className="flex gap-2">
                      {micEnabled ? (
                        <div className="bg-gray-700 text-white p-2 rounded-full" title="Microphone On">
                          <MicOnIcon size="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="bg-red-600 text-white p-2 rounded-full" title="Microphone Off">
                          <MicOffIcon size="w-4 h-4" />
                        </div>
                      )}
                      {cameraEnabled ? (
                        <div className="bg-gray-700 text-white p-2 rounded-full" title="Camera On">
                          <CameraOnIcon size="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="bg-red-600 text-white p-2 rounded-full" title="Camera Off">
                          <CameraOffIcon size="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Remote Video */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                  <div className="text-white text-lg font-semibold">
                    Remote Participant
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div 
            className="w-96 flex flex-col"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(20px)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-white text-xl font-bold">Chat</h2>
                <button 
                  onClick={() => setShowChat(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-gray-400 text-center py-12">
                  <div className="text-6xl mb-4">💬</div>
                  <div className="text-lg">No messages yet</div>
                </div>
              ) : (
                chatMessages.map((message, idx) => (
                  <div key={idx} className={`flex ${message.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-3 rounded-2xl ${
                      message.from === 'me'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-white'
                    }`}>
                      <div className="text-xs opacity-75 mb-1 font-medium">
                        {message.fromName || message.from}
                      </div>
                      <div className="text-base">{message.text}</div>
                      {message.timestamp && (
                        <div className="text-xs opacity-50 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-6 border-t border-gray-800">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={sendChat}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-300 ${
        showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'
      }`}>
        <div 
          className="p-6 flex justify-center"
          style={{
            background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleMic}
              className={`p-5 rounded-full transition-all duration-200 hover:scale-110 ${
                micEnabled 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              title={micEnabled ? 'Mute' : 'Unmute'}
            >
              {micEnabled ? <MicOnIcon size="w-7 h-7" /> : <MicOffIcon size="w-7 h-7" />}
            </button>
            
            <button
              onClick={toggleCamera}
              className={`p-5 rounded-full transition-all duration-200 hover:scale-110 ${
                cameraEnabled 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {cameraEnabled ? <CameraOnIcon size="w-7 h-7" /> : <CameraOffIcon size="w-7 h-7" />}
            </button>
            
            <button
              onClick={screenSharing ? stopScreenShare : startScreenShare}
              className={`p-5 rounded-full transition-all duration-200 hover:scale-110 ${
                screenSharing 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
              title={screenSharing ? 'Stop sharing' : 'Share screen'}
            >
              <ScreenShareIcon size="w-7 h-7" />
            </button>
            
            <button
              onClick={endMeeting}
              className="p-5 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200 hover:scale-110"
              title="End meeting"
            >
              <EndCallIcon size="w-7 h-7" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
