module.exports = {
    name: 'purge',
    description: 'Delete the amount of messages indicated (up to a maximum of 100).',
    permissions: 'MANAGE_MESSAGES',
    aliases: ['prune'],
    usage: '<count>',
    args: true,
    execute(message, args){
        const amount = +args.extraArgs;
        if(isNaN(amount)) return message.channel.send(`That doesn't seem like a valid number.`);
        else if(amount < 2 || amount > 100) return message.channel.send("The number of messages to be purged must be between 2 and 100.");

        message.channel.bulkDelete(amount, true).catch(err => {
            console.error(err);
            message.channel.send("Messages older than 2 weeks can't be deleted.")
        });
        message.channel.send(`Deleted ${amount} messages.`);
    }
}