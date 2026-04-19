require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
const { Player } = require('discord-player');
const { startDailyNewsJob } = require('./jobs/dailyNewsJob');
const { fetchNews } = require('./services/newsService');
const { summarizeNews } = require('./services/openaiService');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Initialize discord-player
process.env.FFMPEG_PATH = require('ffmpeg-static');
const player = new Player(client);

client.once(Events.ClientReady, async c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);

    // Load audio extractors (YouTube, Spotify, etc.)
    try {
        await player.extractors.loadDefault();
        console.log('Audio extractors loaded successfully.');
    } catch (error) {
        console.error('Failed to load audio extractors:', error.message);
        console.error('Music commands may not work. Other commands will still function.');
    }
    
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

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing ${interaction.commandName}`);
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error("No DISCORD_TOKEN provided in .env");
    process.exit(1);
}

client.login(token);
