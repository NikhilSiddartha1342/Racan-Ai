const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const Chat = require('./models/Chat');

const path = require('path');

// Load env vars from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        // console.log('MongoDB Connected'); // Log removed as requested
    })
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes

// Save or Update Chat
app.post('/api/chats', async (req, res) => {
    try {
        console.log('Received chat sync request:', req.body.sessionId);
        console.log('Payload userId:', req.body.userId, 'Email:', req.body.email); // Debug Log
        const { sessionId, messages, title, Image, username, userId, email } = req.body;

        const update = {
            $set: {
                messages,
                updatedAt: Date.now()
            },
            $setOnInsert: {
                username: username || 'User',
                sessionId
            }
        };

        if (title) update.$set.title = title;
        if (Image) update.$set.Image = Image;
        // Update user info if provided (associating guest chat with user)
        if (userId) update.$set.userId = userId;
        if (email) update.$set.email = email;

        const chat = await Chat.findOneAndUpdate(
            { sessionId },
            update,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        console.log('Chat saved successfully. ID:', chat._id, 'User:', chat.userId); // Debug Log
        res.status(200).json(chat);
    } catch (err) {
        console.error('Error saving chat:', err.message);
        // console.error(err.stack); // Reduce noise
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Get User Chats
app.get('/api/chats', async (req, res) => {
    try {
        const chats = await Chat.find({ isDeleted: false }).sort({ updatedAt: -1 });
        res.status(200).json(chats);
    } catch (err) {
        console.error('Error fetching chats:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Single Chat
app.get('/api/chats/:sessionId', async (req, res) => {
    try {
        const chat = await Chat.findOne({ sessionId: req.params.sessionId });
        if (!chat) return res.status(404).json({ error: 'Chat not found' });
        res.status(200).json(chat);
    } catch (err) {
        console.error('Error fetching chat:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

const User = require('./models/User');
const LoginHistory = require('./models/LoginHistory');

// ... existing imports ...

// Auth Route
app.post('/api/auth/google', async (req, res) => {
    try {
        const { token, userInfo } = req.body;
        // Note: In a production app, verify the token with Google's API here.
        // For this implementation, we trust the client-side info or verify if possible.

        const { email, name, picture, sub } = userInfo; // 'sub' is googleId

        let user = await User.findOne({ googleId: sub });

        if (!user) {
            user = new User({
                googleId: sub,
                email,
                name,
                avatar: picture,
                userType: 'LookBook user',
                auth_type: 'google'
            });
            await user.save();
        } else {
            // Update info if changed
            user.name = name;
            user.avatar = picture;
            await user.save();
        }

        // Log History
        const history = new LoginHistory({
            userId: user._id,
            email: user.email,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            device: 'pc', // Defaulting to pc as requested
            loginStatus: 'success',
            failureReason: null,
            status: 'success'
        });
        await history.save();

        res.status(200).json({ user, message: 'Login successful' });

    } catch (err) {
        console.error('Auth Error:', err);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../dist')));

// Anything that doesn't match the above, send back index.html
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
