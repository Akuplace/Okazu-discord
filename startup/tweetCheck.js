const { ETwitterStreamEvent, TwitterApi } = require('twitter-api-v2');
const Guild = require('../models/guildSchema');
require('dotenv').config();
let arrayFollowedTweets = [];
module.exports = {
    
    rulesClean: async function cleanRules(){
        const twitterClient = new TwitterApi(process.env.bearer_token);

        await twitterClient.v2.updateStreamRules({
            add: [],
        });
    },
    
    streamCheck: async function stream(client, guildProfile){
        const twitterClient = new TwitterApi(process.env.bearer_token);
        let value = { "value": `${guildProfile.followedTweets[0]}` };
        

        arrayFollowedTweets.push(value);

        await twitterClient.v2.updateStreamRules({
            add: arrayFollowedTweets,
          });
        },
    
    streamStart: async function stream(client){
        const twitterClient = new TwitterApi(process.env.bearer_token);
        
        const stream = await twitterClient.v2.searchStream({
            expansions: ['attachments.media_keys', 'referenced_tweets.id', 'author_id', 'referenced_tweets.id.author_id'], "media.fields": ['url', 'preview_image_url', 'variants'], "user.fields": ['profile_image_url','url'], "tweet.fields": ['entities']
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
                    
                    let embed = {
                        author: { 
                            name: `${tweet.includes.users[0].name} (@${tweet.includes.users[0].username})`,
                            icon_url: `${tweet.includes.users[0].profile_image_url}`,
                            url: `https://www.twitter.com/${tweet.includes.users[0].username}`, 
                        },
                        description: `${tweet.data.text}`,
                        footer: { 
                            text: "Twitter", 
                            iconURL: "https://i.pinimg.com/originals/4c/c2/3e/4cc23e28035d3bef286c29139319c044.png" 
                        },
                        color: 0x00ACEE,
                        timestamp: new Date().toISOString(),
                    }
                    
                    let webhookContent = {
                        content: `${tweet.includes.users[0].username} just posted a tweet!\nhttps://www.twitter.com/${tweet.includes.users[0].username}/status/${tweet.data.id}`,
                        username: `${tweet.includes.users[0].name}`,
                        avatarURL: `${tweet.includes.users[0].profile_image_url}`,
                        embeds: [embed],
                    };

                    if(tweet.data.referenced_tweets){
                        if(tweet.data.referenced_tweets[0].type === 'quoted'){
                            
                            let quotedUsername = tweet.includes.users[1]?.username || tweet.includes.users[0].username
                            let quotedName = tweet.includes.users[1]?.name || tweet.includes.users[0].name
                            
                            webhookContent.content = `${tweet.includes.users[0].username} just quoted @${quotedUsername}!\nhttps://www.twitter.com/${tweet.includes.users[0].username}/status/${tweet.data.id}`
                            
                            let embedQuote = {
                                author: { 
                                    name: `${tweet.includes.users[0].name} (@${tweet.includes.users[0].username})`,
                                    icon_url: `${tweet.includes.users[0].profile_image_url}`,
                                    url: `https://www.twitter.com/${tweet.includes.users[0].username}`, 
                                },
                                description: `${tweet.data.text}`,
                                color: 0x00ACEE,
                            }


                            if(tweet.includes.media){
                                if (tweet.includes.media[0].type === 'photo') embedQuote.image = ({ url: `${tweet.includes.media[0].url}` });

                                if (tweet.includes.media[0].type === 'animated_gif') embedQuote.image = ({ url: `${tweet.includes.media[0].preview_image_url}` });
                                
                                if (tweet.includes.media[0].type === 'video') embedQuote.image = ({ url: `${tweet.includes.media[0].preview_image_url}` });
                            }
                            

                            let embedQuoted = {
                                author: { 
                                    name: `[QUOTED] ${quotedName} (@${quotedUsername})`,
                                    icon_url: `${tweet.includes.users[1]?.profile_image_url || tweet.includes.users[0].profile_image_url}`,
                                    url: `https://www.twitter.com/${quotedUsername}`, 
                                },
                                description: `${tweet.includes.tweets[0].text}`,
                                color: 0x00ACEE,
                                footer: { 
                                    text: "Twitter", 
                                    iconURL: "https://i.pinimg.com/originals/4c/c2/3e/4cc23e28035d3bef286c29139319c044.png" 
                                },
                                timestamp: new Date().toISOString(),
                            }

                            webhookContent.embeds = [embedQuote, embedQuoted]

                            return await webhook.send(webhookContent);
                        }

                        if(tweet.data.referenced_tweets[0].type === 'replied_to'){
                            webhookContent.content = `${tweet.includes.users[0].username} just replied to @${tweet.includes.users[1]?.username || tweet.includes.users[0].username}!\nhttps://www.twitter.com/${tweet.includes.users[0].username}/status/${tweet.data.id}`;
                            
                            let tweetData = tweet.data.text.slice(tweet.includes.users[1].username.length + 1)
                            
                            embed.description = `[@${tweet.includes.users[1]?.name || tweet.includes.users[0].name}](https://twitter.com/${tweet.includes.users[1]?.username || tweet.includes.users[0].username})${tweetData}`
                            
                            return await sendWebhook(tweet, embed, webhook, webhookContent);                            
                        }

                        return await sendWebhook(tweet, embed, webhook, webhookContent);
                    }
                    
                    
                    await sendWebhook(tweet, embed, webhook, webhookContent);
                    return;
                } catch (err) {
                    console.error(err);
                    const channel = await client.channels.fetch(Guilds[i].logChannel);
                    return channel.send('Something went wrong trying to make and send a webhook. Please check the bot\'s permissions.');
                };
            }
        });

        async function sendWebhook(tweet, embed, webhook, webhookContent) {
	        let file;
            
            if(tweet.includes.media){
	            if (tweet.includes.media[0].type === 'photo'){
	                embed.image = ({ url: `${tweet.includes.media[0].url}` });
                };
                
                if (tweet.includes.media[0].type === 'animated_gif') {
	
	                embed.image = ({ url: `${tweet.includes.media[0].preview_image_url}` });
	
	                let gif_url = tweet.includes.media[0].variants[0].url;
	
	                let fileName = gif_url.split('/')[4];
	                file = {
	                    attachment: gif_url,
	                    name: fileName,
	                };
	            };
                
	            if (tweet.includes.media[0].type === 'video') {
	
	                embed.image = ({ url: `${tweet.includes.media[0].preview_image_url}` });
	
	                let bitrate = 0;
	                let hq_video_url;
	
	                for (let j = 0; j < tweet.includes.media[0].variants.length; j++) {
	                    if (tweet.includes.media[0].variants[j].bit_rate && tweet.includes.media[0].variants[j].content_type === 'video/mp4') {
	                        if (tweet.includes.media[0].variants[j].bit_rate > bitrate) {
	                            bitrate = tweet.includes.media[0].variants[j].bit_rate;
	                            hq_video_url = tweet.includes.media[0].variants[j].url;
	                        }
	                    }
	                }
	                let fileName = hq_video_url.split('/')[8].slice(0, -7);
	                file = {
	                    attachment: hq_video_url,
	                    name: fileName,
	                };
	            };
            }

            await webhook.send(webhookContent);
            if (file) {
                await webhook.send({
                    username: `${tweet.includes.users[0].name}`,
                    avatarURL: `${tweet.includes.users[0].profile_image_url}`,
                    files: [file],
                });
            }
            return;
        }
    }
};