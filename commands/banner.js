const { EmbedBuilder, MessageMentions } = require('discord.js');

module.exports = {
    name: 'banner',
    description: 'Show the user\'s banner',
    async execute(message, args){
        if(!args.extraArgs.length){
            return (async function fetchMember(){
                try{
                    const user = await message.client.users.fetch(message.author.id, {force: true});
                    if(!user.banner) return message.channel.send("Couldn't find this user's banner!");
                    const embed = new EmbedBuilder().setTitle('Banner').setAuthor({ name : `${user.username}#${user.discriminator}`, iconURL: `${user.displayAvatarURL({ format: "png" })}`}).setImage(`${user.bannerURL({ format: "png", size: 4096, dynamic: true })}`).setTimestamp();
                    return message.channel.send({ embeds: [embed] });
                } catch(err){
                    console.log(err);
                    message.channel.send('User not found.');
                }
            })();
        } 
        
        let regex = MessageMentions.UsersPattern;

        if(regex.test(message.content)){
            const userTest = getUserFromMention(args.extraArgsList[0]);
            if(!userTest) {return message.channel.send('User not found.')};
            return (async function fetchMember(){
                try{
                    const user = await message.client.users.fetch(userTest.id, {force: true});
                    if(!user.banner) return message.channel.send("Couldn't find this user's banner!");
                    const embed = new EmbedBuilder().setTitle('Banner').setAuthor({ name : `${user.username}#${user.discriminator}`, iconURL: `${user.displayAvatarURL({ format: "png" })}`}).setImage(`${user.bannerURL({ format: "png", size: 4096, dynamic: true })}`).setTimestamp();
                    return message.channel.send({ embeds: [embed] });
                } catch(err){
                    console.log(err);
                    message.channel.send('User not found.');
                }
            })();

        }

        (async function fetchMember(){
            try{
                const user = await message.client.users.fetch(args.extraArgsList[0], {force: true});
                if(!user.banner) return message.channel.send("Couldn't find this user's banner!");
                const embed = new EmbedBuilder().setTitle('Banner').setAuthor({ name : `${user.username}#${user.discriminator}`, iconURL: `${user.displayAvatarURL({ format: "png" })}`}).setImage(`${user.bannerURL({ format: "png", size: 4096, dynamic: true })}`).setTimestamp();
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