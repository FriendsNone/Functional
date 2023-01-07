const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const responses = [
	[
		'It is certain.',
		'It is decidedly so.',
		'Without a doubt.',
		'Yes definitely.',
		'You may rely on it.',
		'As I see it, yes.',
		'Most likely.',
		'Outlook good.',
		'Yes.',
		'Signs point to yes.',
	],
	[
		'Reply hazy, try again.',
		'Ask again later.',
		'Better not tell you now.',
		'Cannot predict now.',
		'Concentrate and ask again.',
	],
	[
		'Don\'t count on it.',
		'My reply is no.',
		'My sources say no.',
		'Outlook not so good.',
		'Very doubtful.',
	],
];

const colors = [0x57F287, 0xFEE75C, 0xED4245];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('8ball')
		.setDescription('Ask a question, and see what the future lies!')
		.addStringOption(option =>
			option
				.setName('question')
				.setDescription('Ask anything you want.')
				.setRequired(true)),
	async execute(interaction) {
		const question = interaction.options.getString('question');
		const category = Math.floor(Math.random() * responses.length);
		const response = Math.floor(Math.random() * responses[category].length);

		const embed = new EmbedBuilder()
			.setColor(colors[category])
			.setTitle(`${interaction.member.user.tag} asked...`)
			.addFields(
				{ name: 'Question:', value: question },
				{ name: 'Answer:', value: responses[category][response] },
			);

		await interaction.reply({ embeds: [embed] });
	},
};