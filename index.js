'use strict'

//Getting the needed discord.js classes and modules
const { Client, GatewayIntentBits, Collection, messageLink } = require("discord.js");
const { token } = require('./config.json');
const fs = require('node:fs');
require('dotenv').config();



//Instantiating client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent], });
client.commands = new Collection();

//Requiring commands so they can be used
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	client.commands.set(command.name, command);
}


//Same as above but with events
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for(const file of eventFiles){
    const event = require (`./events/${file}`);
    if(event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    };
};
    


//Login to Discord 
client.login(process.env.token);