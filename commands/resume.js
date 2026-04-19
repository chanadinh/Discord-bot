const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('resume')
		.setDescription('Resume paused music'),
	async execute(interaction) {
        const queue = interaction.client.distube.getQueue(interaction);

		if (!queue) {
			return interaction.reply({ content: 'There is no music playing in this server!', ephemeral: true });
		}

		if (!queue.paused) {
			return interaction.reply({ content: 'The music is not paused!', ephemeral: true });
		}

		queue.resume();
		return interaction.reply('▶️ Resumed the music.');
	},
};
