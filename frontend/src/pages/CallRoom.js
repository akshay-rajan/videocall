import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  Container,
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  CallEnd,
  Send,
} from '@mui/icons-material';

const CallRoom = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { userName, userId } = location.state || {};
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [participants, setParticipants] = useState([]);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);

  useEffect(() => {
    if (!userName || !userId) {
      navigate('/');
      return;
    }

    // Initialize socket connection
    const newSocket = io('http://localhost:3000/stream');
    setSocket(newSocket);

    // Join room
    newSocket.emit('subscribe', { room: roomId, socketId: userId });

    // Handle new user joining
    newSocket.on('new user', ({ socketId }) => {
      setParticipants((prev) => [...prev, socketId]);
      createPeerConnection(socketId);
    });

    // Handle WebRTC signaling
    newSocket.on('newUserStart', ({ sender }) => {
      createPeerConnection(sender);
    });

    newSocket.on('sdp', ({ description, sender }) => {
      handleSDP(description, sender);
    });

    newSocket.on('ice candidates', ({ candidate, sender }) => {
      handleICECandidate(candidate, sender);
    });

    // Handle chat messages
    newSocket.on('chat', ({ sender, msg }) => {
      setMessages((prev) => [...prev, { sender, msg }]);
    });

    // Initialize local media
    initializeMedia();

    return () => {
      newSocket.disconnect();
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, [roomId, userId, userName]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const createPeerConnection = (targetId) => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(configuration);
    peerConnection.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice candidates', {
          candidate: event.candidate,
          to: targetId,
          sender: userId,
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    return pc;
  };

  const handleSDP = async (description, sender) => {
    try {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(description)
      );
      if (description.type === 'offer') {
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit('sdp', {
          description: answer,
          to: sender,
          sender: userId,
        });
      }
    } catch (error) {
      console.error('Error handling SDP:', error);
    }
  };

  const handleICECandidate = async (candidate, sender) => {
    try {
      await peerConnection.current.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const toggleMute = () => {
    if (localVideoRef.current?.srcObject) {
      const audioTrack = localVideoRef.current.srcObject.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const videoTrack = localVideoRef.current.srcObject.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleEndCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    if (socket) {
      socket.disconnect();
    }
    navigate('/');
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    socket.emit('chat', {
      room: roomId,
      sender: userName,
      msg: messageInput,
    });

    setMessages((prev) => [
      ...prev,
      { sender: userName, msg: messageInput },
    ]);
    setMessageInput('');
  };

  return (
    <Container maxWidth="xl" sx={{ height: '100vh', py: 2 }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {/* Video Grid */}
        <Grid item xs={12} md={8}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Grid container spacing={2} sx={{ flex: 1 }}>
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <Typography
                    variant="subtitle2"
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      color: 'white',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      padding: '2px 8px',
                      borderRadius: 1,
                    }}
                  >
                    You ({userName})
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Paper>
              </Grid>
            </Grid>

            {/* Controls */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 2,
                mt: 2,
              }}
            >
              <IconButton
                color={isMuted ? 'error' : 'primary'}
                onClick={toggleMute}
              >
                {isMuted ? <MicOff /> : <Mic />}
              </IconButton>
              <IconButton
                color={isVideoOff ? 'error' : 'primary'}
                onClick={toggleVideo}
              >
                {isVideoOff ? <VideocamOff /> : <Videocam />}
              </IconButton>
              <IconButton color="error" onClick={handleEndCall}>
                <CallEnd />
              </IconButton>
            </Box>
          </Box>
        </Grid>

        {/* Chat and Participants */}
        <Grid item xs={12} md={4}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Participants */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Participants
              </Typography>
              <List>
                <ListItem>
                  <ListItemText primary={userName} secondary="You" />
                </ListItem>
                {participants.map((participant) => (
                  <ListItem key={participant}>
                    <ListItemText primary={`User ${participant}`} />
                  </ListItem>
                ))}
              </List>
            </Paper>

            {/* Chat */}
            <Paper sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>
                Chat
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  mb: 2,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {messages.map((msg, index) => (
                  <Box
                    key={index}
                    sx={{
                      alignSelf: msg.sender === userName ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block' }}
                    >
                      {msg.sender}
                    </Typography>
                    <Paper
                      sx={{
                        p: 1,
                        backgroundColor:
                          msg.sender === userName ? 'primary.main' : 'grey.700',
                      }}
                    >
                      <Typography variant="body2">{msg.msg}</Typography>
                    </Paper>
                  </Box>
                ))}
              </Box>
              <Box
                component="form"
                onSubmit={sendMessage}
                sx={{ display: 'flex', gap: 1 }}
              >
                <TextField
                  fullWidth
                  size="small"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                />
                <IconButton type="submit" color="primary">
                  <Send />
                </IconButton>
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CallRoom; 