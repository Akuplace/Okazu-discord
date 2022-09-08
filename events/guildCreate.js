const Guild = require('../models/guildSchema');
module.exports = {
    name: 'guildCreate',
    once: false,
    async execute(guild, client){
        let owner = await client.users.fetch('389165881609027584');
        await owner.send({
            content: `Joined a server name: ${guild.name}\nServer's id: ${guild.id}`
        });
        let guildProfile = await Guild.findOne({ _id : guild.id });
        if(!guildProfile) {
            guildProfile = await new Guild({
                _id: guild.id,
                name: guild.name
            })
            await guildProfile.save();
            return;
        }
        return;
    }
}