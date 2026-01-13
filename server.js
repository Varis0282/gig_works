import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './lib/dbConfig.js';
import userControllers from './app/controllers/User.js';
import gigControllers from './app/controllers/Gig.js';
import bidControllers from './app/controllers/Bid.js';

dotenv.config();
const PORT = process.env.PORT || 5555;

connectDB();

const app = express();
const server = createServer(app);

// Initialize Socket.io
const getCorsOrigin = () => {
    if (process.env.NODE_ENV === 'production') {
        // In production, allow the frontend URL if specified, otherwise allow all origins
        return process.env.FRONTEND_URL || process.env.CLIENT_URL || true;
    }
    return 'http://localhost:5173';
};

const io = new Server(server, {
    cors: {
        origin: getCorsOrigin(),
        credentials: true,
        methods: ['GET', 'POST']
    }
});

// Store io instance globally so services can access it
global.io = io;

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle user joining their personal room (using userId)
    socket.on('join-room', (userId) => {
        const roomName = `user-${userId}`;
        socket.join(roomName);
        socket.join('all-users');
        // console.log(`User ${userId} joined room: ${roomName}`);
        // console.log(`User ${userId} joined all-users room`);
    });

    // Handle joining a gig room to receive bid updates
    socket.on('join-gig-room', (gigId) => {
        const roomName = `gig-${gigId}`;
        socket.join(roomName);
        // console.log(`Socket ${socket.id} joined gig room: ${roomName}`);
    });

    // Handle leaving a gig room
    socket.on('leave-gig-room', (gigId) => {
        const roomName = `gig-${gigId}`;
        socket.leave(roomName);
        // console.log(`Socket ${socket.id} left gig room: ${roomName}`);
    });

    socket.on('disconnect', () => {
        // console.log('Client disconnected:', socket.id);
    });
});

// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (process.env.NODE_ENV === 'production') {
            // In production, check if origin matches allowed URLs
            const allowedOrigins = [
                process.env.FRONTEND_URL,
                process.env.CLIENT_URL,
                process.env.ORIGIN
            ].filter(Boolean);
            
            // If no specific origin is set, allow all (for same-domain deployments)
            if (allowedOrigins.length === 0) {
                return callback(null, true);
            }
            
            // Check if the origin is in the allowed list
            if (allowedOrigins.some(allowed => origin.includes(allowed) || allowed.includes(origin))) {
                return callback(null, true);
            }
            
            // For same-domain requests (when frontend is served from same server)
            return callback(null, true);
        } else {
            // In development, allow localhost
            if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
                return callback(null, true);
            }
        }
        
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// API routes - must come before the catch-all route
app.use('/api/auth', userControllers);
app.use('/api/gigs', gigControllers);
app.use('/api/bids', bidControllers);
app.get('/api/health', (req,res)=>{
    res.status(200).json({message: 'Server is running'});
});

// Serve static files and catch-all route for production (must be last)
if (process.env.NODE_ENV === 'production') {
    const __dirname = path.resolve();
    app.use(express.static(path.join(__dirname, '/client/dist')));
    
    // Catch-all handler: send back React's index.html file for any non-API routes
    // This middleware catches all requests that don't match API routes
    app.use((req, res, next) => {
        if (req.method === 'GET' && !req.path.startsWith('/api')) {
            res.sendFile(path.resolve(__dirname, 'client', 'dist', 'index.html'));
        } else {
            next();
        }
    });
}

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.io server is ready`);
});