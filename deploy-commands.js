require('dotenv').config();
const args = process.argv.slice(2);
const fs = require('node:fs');
const { REST, Routes } = require('discord.js');

const commands = [];

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		if (args[0] === 'testing') {
			const data = await rest.put(
				Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.DEV_GUILD),
				{ body: commands },
			);

			console.log(`Successfully reloaded ${data.length} application (/) commands to test.`);
		}
		else {
			const data = await rest.put(
				Routes.applicationCommands(process.env.CLIENT_ID),
				{ body: commands },
			);

			console.log(`Successfully reloaded ${data.length} application (/) commands.`);
		}
	}
	catch (error) {
		console.error(error);
	}
})();
