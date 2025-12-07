import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import session from 'express-session';
import FileStore from 'session-file-store';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Import database
import pool, { query } from './db.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import { protect, restrictTo } from './middleware/authMiddleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: [
            'http://localhost:5173',
            'http://localhost:5174',
            process.env.CLIENT_URL
        ].filter(Boolean),
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        process.env.CLIENT_URL
    ].filter(Boolean),
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File-based session store
const FileStoreSession = FileStore(session);

// Session middleware
app.use(session({
    store: new FileStoreSession({
        path: path.join(__dirname, 'data', 'sessions'),
        ttl: 86400, // 1 day in seconds
        retries: 0
    }),
    secret: process.env.SESSION_SECRET || 'heirloom-hub-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to false for Docker deployments over HTTP
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/offers', offerRoutes);


// Get conversations for a listing (for sellers)
app.get('/api/messages/listing/:listingId/conversations', protect, restrictTo('Seller'), async (req, res) => {
    try {
        // Verify seller owns the listing
        const listingResult = await query(
            'SELECT * FROM listings WHERE id = $1 AND seller_id = $2',
            [req.params.listingId, req.user.id]
        );

        if (listingResult.rows.length === 0) {
            return res.status(403).json({ message: 'Not authorized to view messages for this listing' });
        }

        // Get unique buyers who have any messages about this listing
        // This query finds all unique buyers (excluding the seller) who have sent OR received messages
        const result = await query(
            `SELECT 
                buyer_id,
                buyer_email,
                COUNT(*) as message_count,
                MAX(last_message_at) as last_message_at
             FROM (
                 SELECT DISTINCT
                     CASE 
                         WHEN m.sender_id = $2 THEN m.receiver_id
                         ELSE m.sender_id
                     END as buyer_id,
                     m.created_at as last_message_at
                 FROM messages m
                 WHERE m.listing_id = $1
                     AND (m.sender_id = $2 OR m.receiver_id = $2)
             ) conversations
             JOIN users u ON conversations.buyer_id = u.id
             GROUP BY buyer_id, u.email
             ORDER BY last_message_at DESC`,
            [req.params.listingId, req.user.id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'HeirloomHub API is running' });
});

// Socket.IO for real-time chat
const chatRooms = new Map(); // Store active chat rooms

io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // Join chat room
    socket.on('join-chat', async ({ listingId, userId }) => {
        const roomId = `listing-${listingId}`;
        socket.join(roomId);

        chatRooms.set(socket.id, { roomId, userId, listingId });

        console.log(`👥 User ${userId} joined chat room: ${roomId}`);

        // Send chat history
        try {
            const result = await query(
                `SELECT m.id as _id,
                        m.listing_id,
                        m.sender_id,
                        m.receiver_id,
                        m.message,
                        m.created_at as createdAt,
                        u.id as sender_user_id,
                        u.email as sender_email,
                        u.role as sender_role
                 FROM messages m
                 JOIN users u ON m.sender_id = u.id
                 WHERE m.listing_id = $1
                 ORDER BY m.created_at ASC
                 LIMIT 100`,
                [listingId]
            );

            // Manually construct sender object for each message (SQLite compatible)
            const messages = result.rows.map(row => ({
                _id: row._id,
                listing_id: row.listing_id,
                sender_id: row.sender_id,
                receiver_id: row.receiver_id,
                message: row.message,
                createdAt: row.createdAt,
                sender: {
                    _id: row.sender_user_id,
                    id: row.sender_user_id,
                    email: row.sender_email,
                    role: row.sender_role
                }
            }));

            console.log(`📨 Sending ${messages.length} messages for listing ${listingId}`);
            socket.emit('chat-history', messages);
        } catch (error) {
            console.error('Error fetching chat history:', error);
        }
    });

    // Send message
    socket.on('send-message', async ({ listingId, senderId, receiverId, message }) => {
        try {
            console.log(`💬 New message: listing=${listingId}, sender=${senderId}, receiver=${receiverId}`);

            const result = await query(
                `INSERT INTO messages (listing_id, sender_id, receiver_id, message)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [listingId, senderId, receiverId, message]
            );

            const messageWithSender = await query(
                `SELECT m.id as _id,
                        m.listing_id,
                        m.sender_id,
                        m.receiver_id,
                        m.message,
                        m.created_at as createdAt,
                        u.id as sender_user_id,
                        u.email as sender_email,
                        u.role as sender_role
                 FROM messages m
                 JOIN users u ON m.sender_id = u.id
                 WHERE m.id = $1`,
                [result.rows[0].id]
            );

            // Manually construct sender object (SQLite compatible)
            const formattedMessage = {
                _id: messageWithSender.rows[0]._id,
                listing_id: messageWithSender.rows[0].listing_id,
                sender_id: messageWithSender.rows[0].sender_id,
                receiver_id: messageWithSender.rows[0].receiver_id,
                message: messageWithSender.rows[0].message,
                createdAt: messageWithSender.rows[0].createdAt,
                sender: {
                    _id: messageWithSender.rows[0].sender_user_id,
                    id: messageWithSender.rows[0].sender_user_id,
                    email: messageWithSender.rows[0].sender_email,
                    role: messageWithSender.rows[0].sender_role
                }
            };

            const roomId = `listing-${listingId}`;
            console.log(`📤 Broadcasting message to room: ${roomId}`);
            io.to(roomId).emit('new-message', formattedMessage);
        } catch (error) {
            console.error('Error saving message:', error);
            socket.emit('message-error', { message: 'Failed to send message' });
        }
    });

    // Typing indicator
    socket.on('typing', ({ listingId, userId }) => {
        const roomId = `listing-${listingId}`;
        socket.to(roomId).emit('user-typing', { userId });
    });

    socket.on('stop-typing', ({ listingId, userId }) => {
        const roomId = `listing-${listingId}`;
        socket.to(roomId).emit('user-stop-typing', { userId });
    });

    // Disconnect
    socket.on('disconnect', () => {
        const chatRoom = chatRooms.get(socket.id);
        if (chatRoom) {
            console.log(`👋 User ${chatRoom.userId} left chat room: ${chatRoom.roomId}`);
            chatRooms.delete(socket.id);
        }
        console.log('🔌 User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready for real-time chat`);
});
