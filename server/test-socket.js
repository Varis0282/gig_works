import { io } from 'socket.io-client';
import dotenv from 'dotenv';

dotenv.config();

const SERVER_URL = `http://localhost:${process.env.PORT || 5555}`;

console.log('Connecting to Socket.io server at:', SERVER_URL);
console.log('=====================================\n');

// Connect to the Socket.io server
const socket = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
});

// Handle command line arguments for joining a room
const args = process.argv.slice(2);
let userId = null;
if (args.length > 0 && args[0] === 'join') {
    userId = args[1];
    if (!userId) {
        console.error('❌ Please provide a user ID');
        console.log('Usage: node test-socket.js join <userId>');
        process.exit(1);
    }
}

// Connection event handlers
socket.on('connect', () => {
    console.log('✅ Connected to server!');
    console.log('Socket ID:', socket.id);
    
    if (userId) {
        console.log(`\nJoining room for user: ${userId}`);
        socket.emit('join-room', userId);
        console.log(`✅ Joined room: user-${userId}`);
        console.log('\nWaiting for notifications...');
        console.log('(Keep this script running while you test the hire API)\n');
    } else {
        console.log('\nTo test the notification:');
        console.log('1. Get a freelancer ID from your database');
        console.log('2. Run: node test-socket.js join <freelancerId>');
        console.log('3. Use the hire API endpoint to hire a bid for that freelancer');
        console.log('4. Watch for the notification below...\n');
    }
});

socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);
    console.log('\nMake sure your server is running on port', process.env.PORT || 5555);
    process.exit(1);
});

socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected from server:', reason);
});

// Listen for the freelancer-hired event
socket.on('freelancer-hired', (data) => {
    console.log('\n🎉 NOTIFICATION RECEIVED!');
    console.log('========================');
    console.log('Message:', data.message);
    console.log('Gig ID:', data.gigId);
    console.log('Gig Title:', data.gigTitle);
    console.log('Bid ID:', data.bidId);
    console.log('========================\n');
});

if (!userId) {
    console.log('Usage:');
    console.log('  node test-socket.js                    - Just connect and listen');
    console.log('  node test-socket.js join <userId>      - Join a specific user room');
    console.log('\nPress Ctrl+C to exit\n');
}

// Keep the script running
process.on('SIGINT', () => {
    console.log('\n\nDisconnecting...');
    socket.disconnect();
    process.exit(0);
});
