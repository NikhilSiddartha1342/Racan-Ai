const mongoose = require('mongoose');

const LoginHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email: {
        type: String,
        required: true
    },
    loginTime: {
        type: Date,
        default: Date.now
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    device: {
        type: String,
        default: 'pc'
    },
    loginStatus: {
        type: String,
        default: 'success'
    },
    failureReason: {
        type: String,
        default: null
    },
    status: {
        type: String,
        default: 'success'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('LoginHistory', LoginHistorySchema);
