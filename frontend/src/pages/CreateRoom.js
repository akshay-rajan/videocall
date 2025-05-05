import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
} from '@mui/material';
import VideoCallIcon from '@mui/icons-material/VideoCall';

const CreateRoom = () => {
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName || !userName) return;

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

      // Create room
      const roomResponse = await fetch('http://localhost:3000/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: Date.now().toString(),
          name: roomName,
        }),
      });
      const roomData = await roomResponse.json();

      // Navigate to call page
      navigate(`/call/${roomData.roomId}`, {
        state: { userName, userId: userData.userId },
      });
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

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
            Create New Room
          </Typography>
          <Box
            component="form"
            onSubmit={handleCreateRoom}
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
            <TextField
              fullWidth
              label="Room Name"
              variant="outlined"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
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
              Create Room
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateRoom; 