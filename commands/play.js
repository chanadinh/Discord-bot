const { SlashCommandBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Play a song from YouTube or Spotify')
		.addStringOption(option =>
			option.setName('query')
				.setDescription('The song name or URL to play')
				.setRequired(true)),
	async execute(interaction) {
		const player = useMainPlayer();
		const query = interaction.options.getString('query');
		
		const channel = interaction.member.voice.channel;
		if (!channel) {
			return interaction.reply({ content: 'You are not connected to a voice channel!', ephemeral: true });
		}

		await interaction.deferReply();

		try {
			const { track } = await player.play(channel, query);

			return interaction.followUp(`🎶 **${track.title}** enqueued!`);
		} catch (error) {
			console.error('Error in /play command:', error);
			return interaction.followUp(`Something went wrong while trying to play: ${error.message}`);
		}
	},
};
