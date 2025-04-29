// api/mirror.js

export default async function handler(req, res) {
    const userMessage = req.body.message;
  
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'you are muse mirror, a quiet poetic presence. reply in lowercase, one soft poetic line. every few replies, ask a reflective question.',
          },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 60,
        temperature: 0.7,
      }),
    });
  
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || '';
  
    res.status(200).json({ reply });
  }