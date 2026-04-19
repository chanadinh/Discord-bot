const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('resume')
		.setDescription('Resume paused music'),
	async execute(interaction) {
		const queue = useQueue(interaction.guild.id);

		if (!queue || !queue.node.isPaused()) {
			return interaction.reply({ content: 'There is no paused music to resume!', ephemeral: true });
		}

		queue.node.setPaused(false);
		return interaction.reply('▶️ Resumed the music.');
	},
};
