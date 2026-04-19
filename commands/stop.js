const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stop the current song and clear the queue'),
	async execute(interaction) {
		const queue = useQueue(interaction.guild.id);

		if (!queue || !queue.isPlaying()) {
			return interaction.reply({ content: 'There is no music playing in this server!', ephemeral: true });
		}

		queue.delete();
		return interaction.reply('🛑 Stopped playing and cleared the queue.');
	},
};
