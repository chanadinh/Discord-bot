const { SlashCommandBuilder } = require('discord.js');
const { chatWithModel } = require('../services/openaiService');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('chat')
		.setDescription('Chat with an AI model')
		.addStringOption(option =>
			option.setName('model')
				.setDescription('The AI model to use')
				.setRequired(true)
				.addChoices(
					{ name: 'GPT-5.4 (Latest)', value: 'gpt-5.4' },
					{ name: 'GPT-5.4 Mini (Fast)', value: 'gpt-5.4-mini' },
					{ name: 'GPT-4o (Capable)', value: 'gpt-4o' },
					{ name: 'GPT-4o Mini (Efficient)', value: 'gpt-4o-mini' },
					{ name: 'o3-mini (Reasoning)', value: 'o3-mini' },
				))
		.addStringOption(option =>
			option.setName('message')
				.setDescription('The message you want to send to the AI')
				.setRequired(true)),
	async execute(interaction) {
		// Defer the reply as the API call might take a few seconds
		await interaction.deferReply();

		const model = interaction.options.getString('model');
		const message = interaction.options.getString('message');

		try {
			const replyContent = await chatWithModel(model, message);

            // Discord has a 2000 character limit for messages
            // We should truncate or split the message if it's too long
            if (replyContent.length > 2000) {
                const chunks = replyContent.match(/[\s\S]{1,1990}/g);
                await interaction.editReply(`**Model:** ${model}\n**You:** ${message}\n\n${chunks[0]}`);
                for (let i = 1; i < chunks.length; i++) {
                    await interaction.followUp(chunks[i]);
                }
            } else {
			    await interaction.editReply(`**Model:** ${model}\n**You:** ${message}\n\n${replyContent}`);
            }
		} catch (error) {
			console.error('Error in /chat command:', error);
			await interaction.editReply('There was an error trying to get a response from the AI.');
		}
	},
};
