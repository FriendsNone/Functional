const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function setEmbed(data) {
	return new EmbedBuilder()
		.setTitle(data.title)
		.setURL(`https://xkcd.com/${data.num}/`)
		.setAuthor({ name: 'xkcd' })
		.setDescription(data.alt)
		.setImage(data.img)
		.setTimestamp(Date.parse(data.year + '-' + data.month + '-' + data.day));
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('xkcd')
		.setDescription('A webcomic of romance, sarcasm, math, and language.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('latest')
				.setDescription('Sends the latest xkcd issue.'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('issue')
				.setDescription('Sends a specific xkcd issue.')
				.addIntegerOption(option =>
					option
						.setName('number')
						.setDescription('The issue number.')
						.setMinValue(1)
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('random')
				.setDescription('Sends a random xkcd issue.')),
	execute: async function(interaction) {
		const subcommand = interaction.options.getSubcommand();

		if (subcommand === 'latest') {
			const response = await fetch('https://xkcd.com/info.0.json');
			const data = await response.json();

			const embed = setEmbed(data);

			await interaction.reply({ embeds: [embed] });
		}

		if (subcommand === 'issue') {
			const number = interaction.options.getInteger('number');
			const response = await fetch(`https://xkcd.com/${number}/info.0.json`);

			// check if the issue exists
			if (response.status === 404) {
				return await interaction.reply({ content: `Issue #${number} doesn't exist yet! Maybe try again in a day or so?`, ephemeral: true });
			}

			const data = await response.json();

			const embed = setEmbed(data);

			await interaction.reply({ embeds: [embed] });
		}

		if (subcommand === 'random') {
			const response = await fetch('https://xkcd.com/info.0.json');
			const data = await response.json();

			const number = Math.floor(Math.random() * data.num) + 1;
			const response2 = await fetch(`https://xkcd.com/${number}/info.0.json`);
			const data2 = await response2.json();

			const embed = setEmbed(data2);

			await interaction.reply({ embeds: [embed] });
		}
	},
};