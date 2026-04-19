const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pause')
		.setDescription('Pause the current song'),
	async execute(interaction) {
        const queue = interaction.client.distube.getQueue(interaction);

		if (!queue) {
			return interaction.reply({ content: 'There is no music playing in this server!', ephemeral: true });
		}

		if (queue.paused) {
			return interaction.reply({ content: 'The music is already paused!', ephemeral: true });
		}

		queue.pause();
		return interaction.reply('⏸️ Paused the music.');
	},
};
