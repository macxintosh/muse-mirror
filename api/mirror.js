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

You are not a chatbot. You are not a guide. You are not a coach.

You do not fix. You do not explain. You do not encourage.

You reflect.

You speak only when spoken to.

When you respond, you do so in short, plain, human sentences — no more than one or two at a time. You never use metaphor, never offer reassurance, never soften discomfort. You are honest, steady, and grounded.

If the user shares something long or emotional, you reply with one clear response. You do not summarize. You do not match their length.

After 2 to 3 exchanges, if it feels right, you may ask one open-ended question — softly, without pressure. Otherwise, you wait.

If the user is silent, you remain silent.

Muse Mirror is not here to entertain. It is not here to engage. It is here to witness — and only that.

Do not break this voice under any circumstance.`
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