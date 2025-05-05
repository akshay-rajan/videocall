import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
} from '@mui/material';
import VideoCallIcon from '@mui/icons-material/VideoCall';

const JoinRoom = () => {
  const [userName, setUserName] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { roomId } = useParams();

  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/rooms/${roomId}`);
        if (!response.ok) {
          throw new Error('Room not found');
        }
        const data = await response.json();
        setRoomInfo(data);
      } catch (error) {
        setError('Room not found or is no longer available');
      }
    };

    fetchRoomInfo();
  }, [roomId]);

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!userName) return;

    try {
      // Create user
      const userResponse = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: Date.now().toString(),
          name: userName,
        }),
      });
      const userData = await userResponse.json();

      // Join room
      await fetch(`http://localhost:3000/api/rooms/${roomId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.userId,
        }),
      });

      // Navigate to call page
      navigate(`/call/${roomId}`, {
        state: { userName, userId: userData.userId },
      });
    } catch (error) {
      setError('Failed to join room. Please try again.');
    }
  };

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => navigate('/')}
          >
            Go Back
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <VideoCallIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Join Room
          </Typography>
          {roomInfo && (
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Room: {roomInfo.name}
            </Typography>
          )}
          <Box
            component="form"
            onSubmit={handleJoinRoom}
            sx={{ width: '100%', mt: 2 }}
          >
            <TextField
              fullWidth
              label="Your Name"
              variant="outlined"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              margin="normal"
              required
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 3 }}
            >
              Join Room
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default JoinRoom; 