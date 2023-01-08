const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roll')
		.setDescription('Roll a dice, and see what you get.')
		.addIntegerOption(option =>
			option
				.setName('sides')
				.setDescription('Number of sides on the die.')
				.setRequired(true)
				.addChoices(
					{ name: 'd4', value: 4 },
					{ name: 'd6', value: 6 },
					{ name: 'd8', value: 8 },
					{ name: 'd10', value: 10 },
					{ name: 'd12', value: 12 },
					{ name: 'd20', value: 20 },
					{ name: 'd100', value: 100 },
				))
		.addIntegerOption(option =>
			option
				.setName('count')
				.setDescription('Number of dice to roll.')
				.setRequired(false)
				.setMinValue(1))
		.addIntegerOption(option =>
			option
				.setName('modifier')
				.setDescription('Modifier to add/subtract from the total.')
				.setRequired(false))
		.addBooleanOption(option =>
			option
				.setName('secret')
				.setDescription('Keep the result hidden from other users.')
				.setRequired(false)),
	execute: async function(interaction) {
		const secret = interaction.options.getBoolean('secret');
		const sides = interaction.options.getInteger('sides');
		const count = interaction.options.getInteger('count') || 1;
		const modifier = interaction.options.getInteger('modifier') || 0;
		const total = Math.floor(Math.random() * sides * count) + modifier;

		const embed = new EmbedBuilder()
			.setTitle(`${interaction.member.user.tag} rolled...`)
			.addFields(
				{ name: 'Dice:', value: `${count}d${sides}`, inline: true },
				{ name: 'Modifier:', value: modifier ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : 'None', inline: true },
				{ name: 'Total:', value: `${total}` },
			);

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('roll_again')
					.setEmoji('🎲')
					.setLabel('Roll again')
					.setStyle(1),
			);

		await interaction.reply({ embeds: [embed], components: [row], ephemeral: secret });

		const filter = i => i.customId === 'roll_again';
		const collector = interaction.channel.createMessageComponentCollector({ filter, time: 10000 });

		collector.on('collect', async i => {
			if (i.user.id === interaction.user.id) {
				const newTotal = Math.floor(Math.random() * sides * count) + modifier;

				const embed2 = new EmbedBuilder()
					.setTitle(`${interaction.member.user.tag} rolled...`)
					.addFields(
						{ name: 'Dice:', value: `${count}d${sides}`, inline: true },
						{ name: 'Modifier:', value: modifier ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : 'None', inline: true },
						{ name: 'Total:', value: `${newTotal}` },
					);

				await i.update({ embeds: [embed2] });
				await collector.resetTimer();
			}
			else {
				await i.reply({ content: 'You can\'t roll for someone else!', ephemeral: true });
			}
		});

		collector.on('end', async () => {
			await interaction.editReply({ components: [] });
		});
	},
};