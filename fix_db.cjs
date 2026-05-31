const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("MONGODB_URI not found in .env");
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        try {
            // Define a minimal schema to access the collection
            const Chat = mongoose.model('Chat', new mongoose.Schema({}, { strict: false }));

            // Delete all documents in 'chats' collection
            const result = await Chat.deleteMany({});
            console.log(`Deleted ${result.deletedCount} documents from 'chats' collection.`);

            process.exit(0);
        } catch (err) {
            console.error('Error deleting chats:', err);
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });
