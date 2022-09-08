const User = require('../models/userSchema');
const { EmbedBuilder } = require('discord.js');


module.exports = {
    name: 'top',
    description: 'Shows the top 5 more active members and their number of messages',
    permissions: 'MANAGE_CHANNELS',
    async execute(message){
        try{
            const guildProfile = await User.find({ guildID: message.guild.id }).lean();
        
            guildProfile.sort((x, y) => y.messages - x.messages);
            const topFive = guildProfile.slice(0, 5);

            let topFiveSum = 0;
            for(let i = 0; i < topFive.length; i++){
                topFiveSum += topFive[i].messages;
            };

            const embed = new EmbedBuilder().setTitle(`Messages | Top 5 - Members`).setDescription(`Top Member Sum: \`${topFiveSum}\`\n\n\`1st.\`<@${topFive[0].id}>: \`${topFive[0].messages} messages\`\n
            \`2nd.\`<@${topFive[1].id}>: \`${topFive[1].messages} messages\`\n
            \`3rd.\`<@${topFive[2].id}>: \`${topFive[2].messages} messages\`\n
            \`4th.\`<@${topFive[3].id}>: \`${topFive[3].messages} messages\`\n
            \`5th.\`<@${topFive[4].id}>: \`${topFive[4].messages} messages\`
            `).setTimestamp();
            message.channel.send({ embeds: [embed] });
        } catch (err) {
            console.error(err);
        }
    }
};