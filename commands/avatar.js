const { EmbedBuilder, MessageMentions } = require('discord.js');

module.exports = {
    name: 'avatar',
    description: 'Show the user\'s avatar',
    async execute(message, args){

        //Retrieves own avatar if no ID or mention is provided, or the replied user's avatar if the message is a reply
        if(!args.extraArgs.length){
            let embed;

            //message is a reply, so we'll get the replied user's avatar
            if(message.reference){
                const originalMessage = await message.channel.messages.fetch(message.reference.messageId);
                const repliedUser = await message.client.users.fetch(originalMessage.author.id);
                const guildRepliedUser = await message.guild.members.fetch(repliedUser.id);

                embed = new EmbedBuilder().setTitle('Avatar').setAuthor({ name : `${repliedUser.username}#${repliedUser.discriminator}`, iconURL: `${repliedUser.displayAvatarURL({ format: "png" })}`}).setImage(`${guildRepliedUser.displayAvatarURL({ format: "png", size: 4096, dynamic: true })}`).setTimestamp();
            } 
            //message is not a reply, so we just get the message author's avatar
            else{
                const guildUser = await message.guild.members.fetch(message.author.id);
                embed = new EmbedBuilder().setTitle('Avatar').setAuthor({ name : `${message.author.username}#${message.author.discriminator}`, iconURL: `${message.author.displayAvatarURL({ format: "png" })}`}).setImage(`${guildUser.displayAvatarURL({ format: "png", size: 4096, dynamic: true })}`).setTimestamp();
            }

            return message.channel.send({ embeds: [embed] });
        } 

        
        let regex = MessageMentions.UsersPattern;

        //Retrieve's avatar from the user mentioned in the command
        if(regex.test(message.content)){
            const user = getUserFromMention(args.extraArgsList[0]);
            const guildUser = await message.guild.members.fetch(user.id);
            if(!user) {return message.channel.send('User not found.')};

            const embed = new EmbedBuilder().setTitle('Avatar').setAuthor({ name : `${user.username}#${user.discriminator}`, iconURL: `${user.displayAvatarURL({ format: "png" })}`}).setImage(`${guildUser.displayAvatarURL({ format: "png", size: 4096, dynamic: true })}`).setTimestamp();
            return message.channel.send({ embeds: [embed] });

        }

        //Retrieve's avatar from the given user id
        (async function fetchMember(){
            try{
                const user = await message.client.users.fetch(args.extraArgsList[0]);
                const guildUser = await message.guild.members.fetch(user.id);
                const embed = new EmbedBuilder().setTitle('Avatar').setAuthor({ name : `${user.username}#${user.discriminator}`, iconURL: `${user.displayAvatarURL({ format: "png" })}`}).setImage(`${guildUser.displayAvatarURL({ format: "png", size: 4096, dynamic: true })}`).setTimestamp();
                message.channel.send({ embeds: [embed] });
            } catch(err){
                console.log(err);
                message.channel.send('User not found.');
            }
        })();

        function getUserFromMention(mention) {
            if (!mention) return;
            if (mention.startsWith('<@') && mention.endsWith('>')) {
                mention = mention.slice(2, -1);
        
                if (mention.startsWith('!')) {
                    mention = mention.slice(1);
                }
        
                return message.client.users.cache.get(mention);
            }
        }
    }
}