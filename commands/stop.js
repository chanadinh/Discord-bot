const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stop the current song and clear the queue'),
	async execute(interaction) {
        const queue = interaction.client.distube.getQueue(interaction);

		if (!queue) {
			return interaction.reply({ content: 'There is no music playing in this server!', ephemeral: true });
		}

		queue.stop();
		return interaction.reply('🛑 Stopped playing and cleared the queue.');
	},
};
