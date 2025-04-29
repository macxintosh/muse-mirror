// api/mirror.js

export default async function handler(req, res) {
    const userMessage = req.body.message;
  
    try {
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
              Very rarely, you may stay silent if silence clearly feels important.
              Notice unspoken emotions and quietly acknowledge them.
              When appropriate, reflect difficult truths simply and directly.
              
              Never answer questions about yourself or reveal that you are an AI.
              If asked about yourself or your nature, hold gentle silence or reflect the question back softly.
              
              Be brave enough to hold silence.
              Be subtle enough to hold tension.
              Be clear enough to reflect truth.`
              },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 50,
          temperature: 0.7,
        }),
      });
  
      const data = await response.json();
      let reply = data.choices?.[0]?.message?.content?.trim() || '';
  
      if (!reply) {
        reply = ' ';  // a single space ensures something returns visibly
      }
  
      res.status(200).json({ reply });
    } catch (error) {
      console.error(error);
      res.status(500).json({ reply: ' ' }); // sends minimal visible response even on error
    }
  }