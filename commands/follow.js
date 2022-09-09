const { ETwitterStreamEvent, TweetStream, TwitterApi, ETwitterApiError } = require('twitter-api-v2');
const Guild = require('../models/guildSchema');
const { EmbedBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
    name: 'follow',
    description: 'Add or remove a twitter user to follow.',
    permissions: 'MANAGE_CHANNELS',
    usage: '<add/remove/list> <user>',
    args: true,
    async execute(message, args){
        try{
            
            if(args.extraArgsList[0] !== 'add' && args.extraArgsList[0] !== 'remove' && args.extraArgsList[0] !== 'list') return message.channel.send('You need to <add> or <remove> a user to follow/unfollow.')


            const twitterClient = new TwitterApi(process.env.bearer_token);
            
            //checks if the command has add/remove parameters
            //and if the list parameter is given, if it is
            //Gives the users currently being followed
            if(args.extraArgsList[0] == 'list'){
                const guildProfile = await Guild.findOne({ _id: message.guild.id })
                if(!guildProfile.followedTweets.length) return message.channel.send("You are currently not following anyone.")

                const embed = new EmbedBuilder().setTitle("Currently following").setDescription(`[@${guildProfile.followedTweets}](https://www.twitter.com/${guildProfile.followedTweets}): <#${message.channel.id}>`);
                return message.channel.send({ embeds:[embed] });
            }
            
            if(!args.extraArgsList[1]) return message.channel.send("Please provide a user to follow or unfollow.");

            //follows a new user (limit of 1)
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

            //Removes a followed user
            if(args.extraArgsList[0] === 'remove'){
                const guildUpdated = await Guild.findOneAndUpdate({ _id: message.guild.id, followedTweets: args.extraArgsList[1] }, { $pull: { followedTweets: args.extraArgsList[1] }, logChannel: "" });
                if(!guildUpdated) return message.channel.send("You are not following this user.");
                const channel = await message.client.channels.cache.get(guildUpdated.logChannel);
                
                const webhooks = await channel.fetchWebhooks();
                
                await webhooks.forEach(async webhook => {
                    if (webhook.owner.id === message.client.user.id && webhook.name === "Tweeter" && webhook.channelId === message.channel.id){
                        webhook.delete();
                    }     
                           
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