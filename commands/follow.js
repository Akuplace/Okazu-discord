const { ETwitterStreamEvent, TweetStream, TwitterApi, ETwitterApiError } = require('twitter-api-v2');
const Guild = require('../models/guildSchema');
const { TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, TWITTER_ACCESSTOKEN, TWITTER_ACCESSTOKEN_SECRET, bearer_token } = require('../config.json');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'follow',
    description: 'Add or remove a twitter user to follow.',
    permissions: 'MANAGE_CHANNELS',
    usage: '<add/remove> <user>',
    args: true,
    async execute(message, args){
        try{
            if(!args.extraArgsList[1]) return message.channel.send('Please provide a user to follow or unfollow.');
            if(args.extraArgsList[0] !== 'add' && args.extraArgsList[0] !== 'remove') return message.channel.send('You need to <add> or <remove> a user to follow/unfollow.')

            const twitterClient = new TwitterApi(bearer_token);
            

            if(args.extraArgsList[0] === 'add'){
                let tweetUser;
                
                
                tweetUser = await twitterClient.v2.userByUsername(args.extraArgsList[1]);

                if(!tweetUser.data) return message.channel.send("Couldn't find a twitter with this username.");

                let alreadyExists = await Guild.findOne({ _id: message.guild.id }).lean();

                if(alreadyExists.followedTweets.includes(`${args.extraArgsList[1]}`) ) return message.channel.send('You\'re already following this channel.');
                
                if(alreadyExists.followedTweets.length) return message.channel.send('You can only follow 1 user at a time. Please remove the current user before adding a new one.');

                stream(args.extraArgsList[1]);
            
                let guildProfile = await Guild.findOneAndUpdate({ _id: message.guild.id }, { $addToSet: { followedTweets: args.extraArgsList[1] }, logChannel: message.channel.id }, { upsert: true, new: true });

                return message.channel.send(`You are now following ${args.extraArgsList[1]}.`);
            }

            if(args.extraArgsList[0] === 'remove'){
                const guildUpdated = await Guild.findOneAndUpdate({ _id: message.guild.id, followedTweets: args.extraArgsList[1] }, { $pull: { followedTweets: args.extraArgsList[1] }, logChannel: "" }, { new: true });
                if(!guildUpdated) return message.channel.send("You are not following this user.");
                const channel = await message.client.channels.cache.get(guildUpdated.logChannel);
                
                const webhooks = await channel.fetchWebhooks();
                
                await webhooks.forEach(async webhook => {
                    if (webhook.owner.id == message.client.user.id && webhook.name === "Tweeter") return webhook.delete();
                });
                return message.channel.send(`You stopped following ${args.extraArgsList[1]}.`);
            }



            async function stream(userId, client){
                const rules = await twitterClient.v2.streamRules();
                
                let newRules = []
                for(const rule in rules){
                    newRules.push( {"value": `${rule.value}`} )
                }
                newRules.push({ "value": `from:${userId}` });
            
                await twitterClient.v2.updateStreamRules({
                    add: newRules,
                  });
                };
            } catch (err) {
            console.error(err);
            message.channel.send('Something went wrong while executing this command.');
        }
    }
}