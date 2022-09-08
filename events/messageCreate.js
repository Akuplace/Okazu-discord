const { EmbedBuilder } = require("discord.js");
const User = require('../models/userSchema');
const Guild = require('../models/guildSchema');
module.exports = {
    name: 'messageCreate',
    once: false,
    async execute(message, client) {

        //Ignores message if it's sent by a bot
        if(message.author.bot) return;
        //Finds user in the database, if doesn't exist makes a new profile
        let userProfile = await User.findOne({ id: message.author.id, guildID: message.guild.id });
        if(!userProfile){
            userProfile = await new User({
                id: message.author.id,
                guildID: message.guild.id,
            })
            await userProfile.save();
        }
        await User.findOneAndUpdate({ id: message.author.id, guildID: message.guild.id }, { $inc: { messages: 1 } });

        //Same as above but guilds
        let guildProfile = await Guild.findOne({ _id : message.guild.id });
        if(!guildProfile) {
            guildProfile = await new Guild({
                _id: message.guild.id,
                name: message.guild.name,
            })
            await guildProfile.save();
        }

        //Where commands are handled, message is ignored if it does not start with the guild's prefix
        if(!message.content.startsWith(guildProfile.prefix)) return;

        const args = {}
        args.args = message.content.split(/\s+/g);
        args.extraArgsList = args.args.slice(1);
        args.extraArgs = args.extraArgsList.join(" ")
        const commandName = args.args[0].slice(guildProfile.prefix.length).toLowerCase();    
        const command = client.commands.get(commandName) || client.commands.find(command => command.aliases && command.aliases.includes(commandName));


	    if (!command) return;
    
        if (command.permissions) {
            const authorPerms = message.channel.permissionsFor(message.author);
            if (!authorPerms || !authorPerms.has(command.permissions)) {
                return message.channel.send('You don\'t have permissions to execute this command!');
            }
        };

        if(command.args && !args.extraArgs){
            let help = new EmbedBuilder().setColor("#dcd0ff").setTitle(`${guildProfile.prefix}${command.name}`).setDescription(`**Description:** ${command.description}\n**Usage:** ${guildProfile.prefix}${command.name} ${command.usage}`);

            return message.channel.send({ embeds: [help] });
        };

	    try {
	    	command.execute(message, args, guildProfile);
	    } catch (error) {
	    	console.error(error);
	    	message.channel.send('There was an error trying to execute that command!');
	    };
    },
};