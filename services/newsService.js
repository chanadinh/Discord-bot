const axios = require('axios');

async function fetchNews() {
    const NEWS_API_KEY = process.env.NEWS_API_KEY;
    if (!NEWS_API_KEY) {
        throw new Error('NEWS_API_KEY is not defined in the environment variables.');
    }

    // Queries to fetch news for
    const queries = ['Artificial Intelligence', 'OT Cybersecurity', 'Cybersecurity'];
    const articles = [];

    // Note: This uses NewsAPI as the default source. GNews is an alternative.
    // Ensure you use a valid endpoint for your chosen API.
    for (const query of queries) {
        try {
            const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=3&language=en&apiKey=${NEWS_API_KEY}`;
            const response = await axios.get(url);
            
            if (response.data.status === 'ok' && response.data.articles.length > 0) {
                // Get top 3 articles for each topic
                const topicArticles = response.data.articles.map(article => ({
                    title: article.title,
                    description: article.description,
                    url: article.url,
                    source: article.source.name,
                    topic: query
                }));
                articles.push(...topicArticles);
            }
        } catch (error) {
            console.error(`Error fetching news for query "${query}":`, error.message);
        }
    }

    return articles;
}

module.exports = { fetchNews };
