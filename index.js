require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { startDailyNewsJob } = require('./jobs/dailyNewsJob');
const { fetchNews } = require('./services/newsService');
const { summarizeNews, generateAgentResponse } = require('./services/openaiService');

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

// Initialize DisTube
client.distube = new DisTube(client, {
    emitNewSongOnly: true,
    emitAddSongWhenCreatingQueue: false,
    emitAddListWhenCreatingQueue: false,
    plugins: [
        new SpotifyPlugin({
            emitEventsAfterFetching: true
        })
    ]
});

client.once(Events.ClientReady, async c => {
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
        return; // Don't let the agent respond to command messages
    }

    // Autonomous Chat Agent Logic
    
    // Check if the bot should reply
    // Conditions: 1) Bot is mentioned, 2) Message is a reply to the bot, 3) 5% random chance
    const isMentioned = message.mentions.has(client.user);
    const isReplyToBot = message.reference && message.mentions.repliedUser && message.mentions.repliedUser.id === client.user.id;
    const isRandomHit = Math.random() < 0.05; // 5% chance

    if (isMentioned || isReplyToBot || isRandomHit) {
        try {
            // Show typing indicator
            await message.channel.sendTyping();

            // Fetch the last 8 messages for context
            const fetchedMessages = await message.channel.messages.fetch({ limit: 8 });
            
            // Map messages to OpenAI format (oldest first)
            const chatHistory = fetchedMessages.reverse().map(m => {
                const role = m.author.id === client.user.id ? 'assistant' : 'user';
                let content = m.content;
                // Prepend username for user messages to give the bot context of who is speaking
                if (role === 'user') {
                    content = `${m.author.username}: ${content}`;
                }
                return { role, content };
            });

            const agentResponse = await generateAgentResponse(chatHistory);
            
            if (agentResponse) {
                await message.reply(agentResponse);
            }
        } catch (error) {
            console.error('Error in autonomous agent:', error);
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
