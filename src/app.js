let express = require('express');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server);
let stream = require('./ws/stream');
let path = require('path');
let favicon = require('serve-favicon');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(favicon(path.join(__dirname, 'favicon.ico')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// In-memory storage
const rooms = new Map();
const users = new Map();

// API Endpoints

// Room Management
app.post('/api/rooms', (req, res) => {
    const { roomId, name } = req.body;
    if (!roomId || !name) {
        return res.status(400).json({ error: 'Room ID and name are required' });
    }
    
    if (rooms.has(roomId)) {
        return res.status(409).json({ error: 'Room already exists' });
    }

    rooms.set(roomId, {
        id: roomId,
        name,
        participants: [],
        createdAt: new Date()
    });

    res.status(201).json({ roomId, name });
});

app.get('/api/rooms', (req, res) => {
    const roomList = Array.from(rooms.values());
    res.json(roomList);
});

app.get('/api/rooms/:roomId', (req, res) => {
    const room = rooms.get(req.params.roomId);
    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }
    res.json(room);
});

app.delete('/api/rooms/:roomId', (req, res) => {
    const { roomId } = req.params;
    if (!rooms.has(roomId)) {
        return res.status(404).json({ error: 'Room not found' });
    }
    rooms.delete(roomId);
    res.status(204).send();
});

// User Management
app.post('/api/users', (req, res) => {
    const { userId, name } = req.body;
    if (!userId || !name) {
        return res.status(400).json({ error: 'User ID and name are required' });
    }

    if (users.has(userId)) {
        return res.status(409).json({ error: 'User already exists' });
    }

    users.set(userId, {
        id: userId,
        name,
        joinedAt: new Date()
    });

    res.status(201).json({ userId, name });
});

app.get('/api/users/:userId', (req, res) => {
    const user = users.get(req.params.userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
});

// Room Participants
app.post('/api/rooms/:roomId/participants', (req, res) => {
    const { roomId } = req.params;
    const { userId } = req.body;

    if (!rooms.has(roomId)) {
        return res.status(404).json({ error: 'Room not found' });
    }

    if (!users.has(userId)) {
        return res.status(404).json({ error: 'User not found' });
    }

    const room = rooms.get(roomId);
    if (room.participants.includes(userId)) {
        return res.status(409).json({ error: 'User already in room' });
    }

    room.participants.push(userId);
    res.status(200).json({ message: 'User added to room' });
});

app.delete('/api/rooms/:roomId/participants/:userId', (req, res) => {
    const { roomId, userId } = req.params;
    
    if (!rooms.has(roomId)) {
        return res.status(404).json({ error: 'Room not found' });
    }

    const room = rooms.get(roomId);
    const index = room.participants.indexOf(userId);
    
    if (index === -1) {
        return res.status(404).json({ error: 'User not in room' });
    }

    room.participants.splice(index, 1);
    res.status(204).send();
});

// Chat Messages
const messages = new Map();

app.post('/api/rooms/:roomId/messages', (req, res) => {
    const { roomId } = req.params;
    const { userId, message } = req.body;

    if (!rooms.has(roomId)) {
        return res.status(404).json({ error: 'Room not found' });
    }

    if (!users.has(userId)) {
        return res.status(404).json({ error: 'User not found' });
    }

    if (!messages.has(roomId)) {
        messages.set(roomId, []);
    }

    const messageObj = {
        id: Date.now().toString(),
        userId,
        message,
        timestamp: new Date()
    };

    messages.get(roomId).push(messageObj);
    
    // Emit the message through WebSocket as well
    io.of('/stream').to(roomId).emit('chat', {
        sender: userId,
        msg: message
    });

    res.status(201).json(messageObj);
});

app.get('/api/rooms/:roomId/messages', (req, res) => {
    const { roomId } = req.params;
    
    if (!rooms.has(roomId)) {
        return res.status(404).json({ error: 'Room not found' });
    }

    const roomMessages = messages.get(roomId) || [];
    res.json(roomMessages);
});

// Keep the existing route for the original frontend
// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/index.html');
// });

// Keep the existing WebSocket setup
io.of('/stream').on('connection', stream);

server.listen(3000, () => {
    console.log('Server running on port 3000');
});
