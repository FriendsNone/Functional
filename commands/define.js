const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const fetch = require('node-fetch');

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
		.setName('define')
		.setDescription('Define a word')
		.addStringOption(option =>
			option
				.setName('word')
				.setDescription('The word to define.')
				.setRequired(true)),
	execute: async function(interaction) {
		const word = interaction.options.getString('word');
		const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);

		if (response.status === 404) {
			const response2 = await fetch(`https://api.datamuse.com/words?ml=${word}`);
			const data2 = await response2.json();

			if (data2.length === 0) return await interaction.reply({ content: `No definition for "${word}"`, ephemeral: true });

			const embed = new EmbedBuilder()
				.setTitle(`No definition for "${word}"`)
				.setDescription('Try one of these instead:')
				.addFields(
					{ name: ' ', value: data2.length > 0 ? data2.map(m => m.word).slice(0, 5).join('\n') : ' ', inline: true },
					{ name: ' ', value: data2.length > 5 ? data2.map(m => m.word).slice(5, 10).join('\n') : ' ', inline: true },
					{ name: ' ', value: data2.length > 10 ? data2.map(m => m.word).slice(10, 15).join('\n') : ' ', inline: true });

			return await interaction.reply({ embeds: [embed], ephemeral: true });
		}

		const data = await response.json();
		const phonetic = data[0].phonetic ? data[0].phonetic : data[0].phonetics.find(p => p.text) ? data[0].phonetics.find(p => p.text).text : 'No phonetic found';
		const definitions = [];
		let number = 0;

		data[0].meanings.forEach(meaning => {
			meaning.definitions.forEach(definition => {
				definitions.push({ name: meaning.partOfSpeech, value: definition.definition });
			});
		});


		const embed = new EmbedBuilder()
			.setTitle(`${data[0].word}`)
			.setDescription(`*${phonetic}*`)
			.addFields({ name: definitions[number].name, value: definitions[number].value })
			.setFooter({ text: `${number + 1} of ${definitions.length} definitions` });

		const row = new ActionRowBuilder()
			.addComponents(setGenericButton('previous', '⬅️', 'Previous', number === 0))
			.addComponents(setGenericButton('next', '➡️', 'Next', number === definitions.length - 1));

		await interaction.reply({ embeds: [embed], components: [row] });

		const filter = i => i.customId === 'previous' || i.customId === 'next';
		const collector = interaction.channel.createMessageComponentCollector({ filter, time: 10000 });

		collector.on('collect', async i => {
			if (i.user.id === interaction.user.id) {
				if (i.customId === 'previous') number--;
				if (i.customId === 'next') number++;

				const embed2 = new EmbedBuilder()
					.setTitle(`${data[0].word}`)
					.setDescription(`**${phonetic}**`)
					.addFields({ name: definitions[number].name, value: definitions[number].value })
					.setFooter({ text: `${number + 1} of ${definitions.length} definitions` });

				const row2 = new ActionRowBuilder()
					.addComponents(setGenericButton('previous', '⬅️', 'Previous', number === 0))
					.addComponents(setGenericButton('next', '➡️', 'Next', number === definitions.length - 1));

				await i.update({ embeds: [embed2], components: [row2] });
				collector.resetTimer();
			}
			else {
				await i.reply({ content: 'Only the user who used the command can use this button!', ephemeral: true });
			}
		});

		collector.on('end', async () => {
			await interaction.editReply({ components: [] });
		});
	},
};