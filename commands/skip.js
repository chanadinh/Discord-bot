const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skip the current song'),
	async execute(interaction) {
        const queue = interaction.client.distube.getQueue(interaction);

		if (!queue) {
			return interaction.reply({ content: 'There is no music playing in this server!', ephemeral: true });
		}

		try {
			const song = await queue.skip();
			return interaction.reply(`⏭️ Skipped! Now playing: **${song.name}**`);
		} catch (e) {
			return interaction.reply(`⏭️ Skipped! (No more songs in queue)`);
		}
	},
};
