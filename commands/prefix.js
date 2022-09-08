const Guild = require('../models/guildSchema');

module.exports = {
    name: 'prefix',
    description: "Change the bot's prefix.",
    permissions: 'MANAGE_GUILD',
    usage: "<prefix>",
    args: true,
    async execute(message, args){
        await Guild.findOneAndUpdate({ _id: message.guild.id }, { prefix: args.extraArgsList[0] });

        message.channel.send(`Changed the prefix to ${args.extraArgsList[0]}.`);
    }
}