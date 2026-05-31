const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        default: 'User'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional for guest chats
    },
    email: {
        type: String,
        required: false
    },
    messages: {
        type: Array,
        default: []
    },
    title: {
        type: String,
        default: 'New Chat'
    },
    Image: {
        type: String,
        default: ''
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Chat', ChatSchema);
