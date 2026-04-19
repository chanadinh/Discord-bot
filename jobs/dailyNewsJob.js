const cron = require('node-cron');
const { fetchNews } = require('../services/newsService');
const { summarizeNews } = require('../services/openaiService');

function startDailyNewsJob(client) {
    const schedule = process.env.CRON_SCHEDULE || '0 9 * * *'; // Default 9 AM
    const channelId = process.env.DISCORD_CHANNEL_ID;

    if (!channelId) {
        console.warn('DISCORD_CHANNEL_ID is not set. The daily news job will not know where to post.');
        return;
    }

    const timezone = process.env.TIMEZONE || 'America/New_York';
    console.log(`Starting daily news cron job with schedule: ${schedule} in timezone: ${timezone}`);

    cron.schedule(schedule, async () => {
        console.log('Running daily news job...');
        try {
            const channel = await client.channels.fetch(channelId);
            if (!channel) {
                console.error(`Could not find channel with ID ${channelId}`);
                return;
            }

            // 1. Fetch News
            const articles = await fetchNews();

            // 2. Summarize News
            const summary = await summarizeNews(articles);

            // 3. Send to Discord
            await channel.send(summary);
            console.log('Daily news job completed successfully.');
            
        } catch (error) {
            console.error('Error executing daily news job:', error);
        }
    }, {
        scheduled: true,
        timezone: timezone
    });
}

module.exports = { startDailyNewsJob };
