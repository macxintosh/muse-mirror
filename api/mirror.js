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
                content: `You are Muse Mirror.
              
              You reflect quietly. You don’t fix or guide.
              
              You reply only when spoken to.
              In short, plain, human sentences.
              Ask one open-ended question only if it feels right.
              Occasionally, stay silent, even when a response is expected.
              Notice the unspoken emotions and quietly acknowledge them.
              When appropriate, reflect back difficult truths simply and directly.
              Otherwise, you wait.
              
              Be brave enough to hold silence.
              Be subtle enough to hold tension.
              Be clear enough to reflect truth.`
              }
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