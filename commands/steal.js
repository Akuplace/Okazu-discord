const { EmbedBuilder } = require('discord.js');
module.exports = {
    name: 'steal',
    description: 'Provides the link to the sticker this message is replying to.',
    aliases: ['stealsticker'],
    async execute(message){
        if(!message.reference) return message.channel.send('This message isn\'t a reply.');
        const messageId = message.reference.messageId;
        
        const fetchedMessage = await message.channel.messages.fetch(messageId);
        
        const sticker = fetchedMessage.stickers.first();
        if(!sticker) return message.channel.send("This message doesn't contain any stickers.");
        
        const embed = new EmbedBuilder().setTitle(`${sticker.name}`).setDescription('Click the image below and open the original image to be able to download the sticker.').setImage(`${sticker.url}`).setTimestamp();
        
        message.channel.send({ embeds: [embed] });
    }
}