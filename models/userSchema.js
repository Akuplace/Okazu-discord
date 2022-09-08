const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: false
    },
    guildID: {
        type: String,
        unique: false
    },
    messages: {
        type: Number,
        default: 0
    },
});

module.exports = mongoose.model('User', userSchema, 'users');