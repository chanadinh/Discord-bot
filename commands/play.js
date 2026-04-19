const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Play a song from YouTube or Spotify')
		.addStringOption(option =>
			option.setName('query')
				.setDescription('The song name or URL to play')
				.setRequired(true)),
	async execute(interaction) {
		const query = interaction.options.getString('query');
		
		const channel = interaction.member.voice.channel;
		if (!channel) {
			return interaction.reply({ content: 'You are not connected to a voice channel!', ephemeral: true });
		}

		// Check bot permissions in the voice channel
		const permissions = channel.permissionsFor(interaction.client.user);
		if (!permissions.has('Connect') || !permissions.has('Speak')) {
			return interaction.reply({ content: 'I need permissions to join and speak in your voice channel!', ephemeral: true });
		}

		await interaction.deferReply();

		try {
            await interaction.client.distube.play(channel, query, {
                member: interaction.member,
                textChannel: interaction.channel,
                interaction
            });
			
            return interaction.editReply(`🔎 Searching and enqueuing: **${query}**...`);
		} catch (error) {
			console.error('Error in /play command:', error);
			return interaction.editReply(`Something went wrong: ${error.message}`);
		}
	},
};
