const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const fetch = require('node-fetch');

function setEmbed(data) {
	return new EmbedBuilder()
		.setTitle(`xkcd - ${data.title}`)
		.setDescription(data.alt)
		.setImage(data.img)
		.setFooter({ text: `Issue #${data.num}` })
		.setTimestamp(Date.parse(data.year + '-' + data.month + '-' + data.day));
}

function setSourceButton(data) {
	return new ButtonBuilder()
		.setLabel('Source')
		.setStyle(5)
		.setURL(`https://xkcd.com/${data.num}`);
}

function setGenericButton(id, emoji, label, state) {
	return new ButtonBuilder()
		.setCustomId(id)
		.setEmoji(emoji)
		.setLabel(label)
		.setStyle(1)
		.setDisabled(state);
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
			const row = new ActionRowBuilder()
				.addComponents(setSourceButton(data));

			await interaction.reply({ embeds: [embed], components: [row] });
		}

		if (subcommand === 'issue') {
			let number = interaction.options.getInteger('number');
			let response = await fetch(`https://xkcd.com/${number}/info.0.json`);

			// check if the issue exists
			if (response.status === 404) {
				return await interaction.reply({ content: `Issue #${number} doesn't exist yet! Maybe try again in a day or so?`, ephemeral: true });
			}

			let data = await response.json();

			const embed = setEmbed(data);
			const row = new ActionRowBuilder()
				.addComponents(setGenericButton('previous', '⬅️', 'Previous', number === 1))
				.addComponents(setGenericButton('next', '➡️', 'Next', false))
				.addComponents(setSourceButton(data));

			await interaction.reply({ embeds: [embed], components: [row] });

			const filter = i => i.customId === 'previous' || i.customId === 'next';
			const collector = interaction.channel.createMessageComponentCollector({ filter, time: 10000 });

			collector.on('collect', async i => {
				if (i.user.id === interaction.user.id) {
					if (i.customId === 'previous') number--;
					if (i.customId === 'next') number++;

					response = await fetch(`https://xkcd.com/${number}/info.0.json`);
					data = await response.json();

					const embed2 = setEmbed(data);
					const row2 = new ActionRowBuilder()
						.addComponents(setGenericButton('previous', '⬅️', 'Previous', number === 1))
						.addComponents(setGenericButton('next', '➡️', 'Next', false))
						.addComponents(setSourceButton(data));

					await i.update({ embeds: [embed2], components: [row2] });
					collector.resetTimer();
				}
				else {
					await i.reply({ content: 'Only the user who used the command can use this button!', ephemeral: true });
				}
			});

			collector.on('end', async () => {
				const row3 = new ActionRowBuilder()
					.addComponents(setSourceButton(data));

				await interaction.editReply({ components: [row3] });
			});
		}

		if (subcommand === 'random') {
			let response = await fetch('https://xkcd.com/info.0.json');
			let data = await response.json();

			let number = Math.floor(Math.random() * data.num) + 1;
			response = await fetch(`https://xkcd.com/${number}/info.0.json`);
			data = await response.json();

			const embed = setEmbed(data);
			const row = new ActionRowBuilder()
				.addComponents(setGenericButton('random', '🎲', 'Randomize', false))
				.addComponents(setSourceButton(data));

			await interaction.reply({ embeds: [embed], components: [row] });

			const filter = i => i.customId === 'random';
			const collector = interaction.channel.createMessageComponentCollector({ filter, time: 10000 });

			collector.on('collect', async i => {
				// check if the interaction is from the same user
				if (i.user.id === interaction.user.id) {
					response = await fetch('https://xkcd.com/info.0.json');
					data = await response.json();

					number = Math.floor(Math.random() * data.num) + 1;
					response = await fetch(`https://xkcd.com/${number}/info.0.json`);
					data = await response.json();

					const embed2 = setEmbed(data);
					const row2 = new ActionRowBuilder()
						.addComponents(setGenericButton('random', '🎲', 'Randomize', false))
						.addComponents(setSourceButton(data));

					await i.update({ embeds: [embed2], components: [row2] });
					collector.resetTimer();
				}
				else {
					await i.reply({ content: 'Only the user who used the command can use this button!', ephemeral: true });
				}
			});

			collector.on('end', async () => {
				const row3 = new ActionRowBuilder()
					.addComponents(setSourceButton(data));

				await interaction.editReply({ components: [row3] });
			});
		}
	},
};