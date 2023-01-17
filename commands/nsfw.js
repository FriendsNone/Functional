const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const fetch = require('node-fetch');

function setEmbed(data) {
	return new EmbedBuilder()
		.setTitle('Rule34')
		.addFields(
			{ name: 'Uploader', value: data.owner, inline: true },
			{ name: 'Rating', value: data.rating, inline: true },
			{ name: 'Score', value: data.score.toString(), inline: true },
			{ name: 'Tags', value: data.tags.length > 1024 ? data.tags.slice(0, 1021) + '...' : data.tags })
		.setImage(data.file_url.endsWith('.mp4') ? data.sample_url : data.file_url);
}

function setSourceButton(data) {
	return new ButtonBuilder()
		.setLabel('Source')
		.setStyle(5)
		.setURL(`https://rule34.xxx/index.php?page=post&s=view&id=${data.id}`);
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
		.setName('nsfw')
		.setDescription('Sends a NSFW image')
		.addSubcommand(subcommand =>
			subcommand
				.setName('random')
				.setDescription('Sends a random NSFW image.'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('search')
				.setDescription('Sends a random NSFW image from a search query.')
				.addStringOption(option =>
					option
						.setName('tags')
						.setDescription('Tags to search for.')
						.setRequired(true))),
	execute: async function(interaction) {
		const subcommand = interaction.options.getSubcommand();

		if (subcommand === 'random') {
			if (!interaction.channel.nsfw) {
				return await interaction.reply({ content: 'You must have the guts to do this here.', ephemeral: true });
			}

			const response = await fetch('https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1');
			const data = await response.json();
			let number = Math.floor(Math.random() * data.length);

			const embed = setEmbed(data[number]);
			const row = new ActionRowBuilder()
				.addComponents(setGenericButton('random', '🎲', 'Randomize', false))
				.addComponents(setSourceButton(data[number]));

			await interaction.reply({ embeds: [embed], components: [row] });

			const filter = i => i.customId === 'random';
			const collector = interaction.channel.createMessageComponentCollector({ filter, time: 10000 });

			collector.on('collect', async i => {
				if (i.user.id === interaction.user.id) {
					number = Math.floor(Math.random() * data.length);

					const embed2 = setEmbed(data[number]);
					const row2 = new ActionRowBuilder()
						.addComponents(setGenericButton('random', '🎲', 'Randomize', false))
						.addComponents(setSourceButton(data[number]));

					await i.update({ embeds: [embed2], components: [row2] });
					collector.resetTimer();
				}
				else {
					await i.reply({ content: 'Only the user who used the command can use this button!', ephemeral: true });
				}
			});

			collector.on('end', async () => {
				const row3 = new ActionRowBuilder()
					.addComponents(setSourceButton(data[number]));

				await interaction.editReply({ components: [row3] });
			});
		}

		if (subcommand === 'search') {
			if (!interaction.channel.nsfw) {
				return await interaction.reply({ content: 'You must have the guts to do this here.', ephemeral: true });
			}

			const tags = interaction.options.getString('tags');
			const response = await fetch(`https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=${tags}&json=1`);

			let data, number = 0;

			try {
				data = await response.json();
			}
			catch (error) {
				return await interaction.reply({ content: 'Nobody here but us chickens! Double check your spelling.', ephemeral: true });
			}

			const embed = setEmbed(data[number]);
			const row = new ActionRowBuilder()
				.addComponents(setGenericButton('previous', '⬅️', 'Previous', number === 0))
				.addComponents(setGenericButton('next', '➡️', 'Next', false))
				.addComponents(setGenericButton('random', '🎲', 'Randomize', false))
				.addComponents(setSourceButton(data[number]));

			await interaction.reply({ embeds: [embed], components: [row] });

			const filter = i => i.customId === 'previous' || i.customId === 'next' || i.customId === 'random';
			const collector = interaction.channel.createMessageComponentCollector({ filter, time: 10000 });

			collector.on('collect', async i => {
				if (i.user.id === interaction.user.id) {
					if (i.customId === 'previous') number--;
					if (i.customId === 'next') number++;
					if (i.customId === 'random') number = Math.floor(Math.random() * data.length);

					const embed2 = setEmbed(data[number]);
					const row2 = new ActionRowBuilder()
						.addComponents(setGenericButton('previous', '⬅️', 'Previous', number === 0))
						.addComponents(setGenericButton('next', '➡️', 'Next', false))
						.addComponents(setGenericButton('random', '🎲', 'Randomize', false))
						.addComponents(setSourceButton(data[number]));

					await i.update({ embeds: [embed2], components: [row2] });
					collector.resetTimer();
				}
				else {
					await i.reply({ content: 'Only the user who used the command can use this button!', ephemeral: true });
				}
			});

			collector.on('end', async () => {
				const row3 = new ActionRowBuilder()
					.addComponents(setSourceButton(data[number]));

				await interaction.editReply({ components: [row3] });
			});
		}
	},
};