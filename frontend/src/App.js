import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import CallRoom from './pages/CallRoom';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<CreateRoom />} />
          <Route path="/join/:roomId" element={<JoinRoom />} />
          <Route path="/call/:roomId" element={<CallRoom />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
