require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const { startDailyNewsJob } = require('./jobs/dailyNewsJob');
const { fetchNews } = require('./services/newsService');
const { summarizeNews } = require('./services/openaiService');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    
    // Start the cron job
    startDailyNewsJob(client);
});

// Simple command to test the news generation manually
client.on(Events.MessageCreate, async message => {
    // Ignore bot messages
    if (message.author.bot) return;

    // Check if the message is the test command
    if (message.content === '!test-news') {
        const channelId = process.env.DISCORD_CHANNEL_ID;
        
        // Ensure command is run in the right channel or let the user know
        if (channelId && message.channel.id !== channelId) {
            return message.reply(`This command only works in the configured news channel: <#${channelId}>`);
        }

        await message.reply('Fetching and summarizing news... This might take a minute ⏳');

        try {
            const articles = await fetchNews();
            const summary = await summarizeNews(articles);
            await message.channel.send(summary);
        } catch (error) {
            console.error('Error in manual trigger:', error);
            await message.channel.send('Failed to generate news. Please check console logs.');
        }
    }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error("No DISCORD_TOKEN provided in .env");
    process.exit(1);
}

client.login(token);
