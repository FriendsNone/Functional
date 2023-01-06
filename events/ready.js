const { Events } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		client.user.setPresence({
			activities: [{ name: 'for commands | v0.1', type: 3 }],
			status: 'online',
		});
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};