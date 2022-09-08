const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
    _id: String,
    prefix: {
        type: String,
        default: "!!"
    },
    name: String,
    messages: {
        type: Number,
        default: 0,
    },
    logChannel: {
        type: String,
        default: "",
    },
    followedTweets: {
        type: Array,
        default: []
    },
});

module.exports = mongoose.model('Guild', guildSchema, 'guilds');