const { OpenAI } = require('openai');

async function summarizeNews(articles) {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not defined in the environment variables.');
    }

    if (!articles || articles.length === 0) {
        return "No news articles found to summarize today.";
    }

    const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
    });

    // Format articles for the prompt
    const articlesText = articles.map((a, index) => 
        `[${index + 1}] Topic: ${a.topic}\nTitle: ${a.title}\nDescription: ${a.description}\nURL: ${a.url}\nSource: ${a.source}\n`
    ).join('\n');

    const prompt = `
You are a highly capable AI cybersecurity analyst and news curator. I will provide you with a list of recent news articles related to Artificial Intelligence, OT Cybersecurity, and general Cybersecurity.
Your task is to create a concise, engaging, and professional "TLDR" summary report suitable for a daily Discord message.

Here are the articles:
${articlesText}

Format your response exactly as follows:
## 🗞️ Daily Tech & Cyber TLDR
*A quick summary of today's top stories in AI and Cybersecurity.*

**🤖 Artificial Intelligence**
- Summarize the AI articles briefly in 1-2 bullet points. Include the link to the most relevant article like this: [Read more](URL).

**🏭 OT Cybersecurity**
- Summarize the OT Cyber articles briefly in 1-2 bullet points. Include the link to the most relevant article.

**🛡️ General Cybersecurity**
- Summarize the General Cyber articles briefly in 1-2 bullet points. Include the link to the most relevant article.

Keep the tone informative and concise. Emphasize the key takeaways. Do not include articles if there is no relevant information provided.
`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // gpt-4o-mini is cost effective and high performance
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5,
            max_tokens: 800,
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error("Error generating summary with OpenAI:", error.message);
        return "An error occurred while generating the daily summary.";
    }
}

module.exports = { summarizeNews };
