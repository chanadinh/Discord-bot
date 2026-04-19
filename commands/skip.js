const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skip the current song'),
	async execute(interaction) {
		const queue = useQueue(interaction.guild.id);

		if (!queue || !queue.isPlaying()) {
			return interaction.reply({ content: 'There is no music playing in this server!', ephemeral: true });
		}

		queue.node.skip();
		return interaction.reply('⏭️ Skipped to the next track.');
	},
};
