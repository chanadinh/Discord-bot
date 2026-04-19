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

		// Check bot permissions in the voice channel
		const permissions = channel.permissionsFor(interaction.client.user);
		if (!permissions.has('Connect') || !permissions.has('Speak')) {
			return interaction.reply({ content: 'I need permissions to join and speak in your voice channel!', ephemeral: true });
		}

		await interaction.deferReply();

		try {
			const searchResult = await player.search(query, {
				requestedBy: interaction.user
			});

			if (!searchResult || !searchResult.hasTracks()) {
				return interaction.editReply(`❌ No results found for **${query}**.`);
			}

			await player.play(channel, searchResult, {
				nodeOptions: {
					metadata: {
						channel: interaction.channel
					}
				}
			});

			const track = searchResult.tracks[0];
			return interaction.editReply(`🎶 **${track.title}** by ${track.author} enqueued!`);
		} catch (error) {
			console.error('Error in /play command:', error);
			return interaction.editReply(`Something went wrong: ${error.message}`);
		}
	},
};
