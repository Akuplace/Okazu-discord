const { bearer_token } = require('../config.json');
const { ETwitterStreamEvent, TweetStream, TwitterApi, ETwitterApiError } = require('twitter-api-v2');
const { EmbedBuilder, messageLink } = require('discord.js');
const Guild = require('../models/guildSchema');
let arrayFollowedTweets = [];
module.exports = {
    
    rulesClean: async function cleanRules(){
        const twitterClient = new TwitterApi(bearer_token);

        await twitterClient.v2.updateStreamRules({
            add: [],
        });
    },
    
    streamCheck: async function stream(client, guildProfile){
        const twitterClient = new TwitterApi(bearer_token);
        let value = { "value": `${guildProfile.followedTweets[0]}` };
        

        arrayFollowedTweets.push(value);

        await twitterClient.v2.updateStreamRules({
            add: arrayFollowedTweets,
          });
        },
    
    streamStart: async function stream(client){
        const twitterClient = new TwitterApi(bearer_token);
        
        const stream = await twitterClient.v2.searchStream({
            expansions: ['attachments.media_keys', 'referenced_tweets.id', 'author_id', 'referenced_tweets.id.author_id'], "media.fields": ['url'], "user.fields": ['profile_image_url','url'],
        })
        
        
        stream.autoReconnect = true;
    
        stream.on(ETwitterStreamEvent.Data, async tweet => {
            // Ignore RTs or self-sent tweets
            const isARt = tweet.data.referenced_tweets?.some(tweet => tweet.type === 'retweeted') ?? false;
            if (isARt) return;

            const Guilds = await Guild.find({ followedTweets: tweet.includes.users[0].username }).lean();
            if(!Guilds) return;
            
            for(let i = 0; i < Guilds.length; i++){
                const channel = await client.channels.cache.get(Guilds[i].logChannel);

                try {
                    const webhooks = await channel.fetchWebhooks();
                    let webhook = webhooks.find(wh => wh.token);

                    if(!webhook) {
                        webhook = await channel.createWebhook({
                            name: 'Tweeter',
                        });
                    }
                
                    let embed = new EmbedBuilder().setAuthor({ name: `${tweet.includes.users[0].name} (@${tweet.includes.users[0].username})`, url: `${tweet.includes.users[0].url}`, iconURL: `${tweet.includes.users[0].profile_image_url}` }).setDescription(`${tweet.data.text}`).setFooter({ text: "Twitter", iconURL: "https://logodownload.org/wp-content/uploads/2014/09/twitter-logo-4.png" }).setTimestamp();

                    // if(tweet.includes.media) embed = new EmbedBuilder().setAuthor({ name: `${tweet.includes.users[0].name} (@${tweet.includes.users[0].username})`, url: `${tweet.includes.users[0].url}`, iconURL: `${tweet.includes.users[0].profile_image_url}` }).setDescription(`${tweet.data.text}`).setFooter({ text: "Twitter", iconURL: `https://imgur.com/a/AnOrrZN` }).setTimestamp().setImage(`${tweet.includes.media[0].preview_image_url}`);

                    await webhook.send({
                        content: `${tweet.includes.users[0].username} just posted a tweet!\nhttps://www.twitter.com/${tweet.includes.users[0].username}/status/${tweet.data.id}`,
                        username: `${tweet.includes.users[0].name}`,
                        avatarURL: `${tweet.includes.users[0].profile_image_url}`,
                        embeds: [embed]
                    });
                
                    return;
                } catch (err) {
                    console.error(err);
                    const channel = await client.channels.fetch(guild.logChannel);
                    return channel.send('Something went wrong trying to make and send a webhook. Please check the bot\'s permissions.');
                };
            }
        });
    }
}