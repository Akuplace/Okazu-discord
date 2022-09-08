const mongoose = require('mongoose');
const Guild = require('../models/guildSchema');
const { streamStart, streamCheck, rulesClean } = require('../startup/tweetCheck');
require('dotenv').config();

module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {
        await mongoose.connect(process.env.MONGO_URL, { keepAlive: true }).then(() => console.log('Connected to the database!')).catch((err) => console.log(err));

		rulesClean();
		const Guilds = await Guild.find().lean();
		for(const guild of Guilds){
			if(!guild.followedTweets.length) continue;
			streamCheck(client, guild);
		}

		streamStart(client);
        console.log('Mogu mogu');
	},
};