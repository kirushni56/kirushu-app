import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { systemPrompt, text } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      return NextResponse.json({ error: "Missing or invalid GROQ_API_KEY in .env.local" }, { status: 401 });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "system", "content": systemPrompt },
          { role: "user", "content": text }
        ],
        max_tokens: 150
      })
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return NextResponse.json({ error: `Groq API Error: ${response.status}`, details: errData }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ reply: data.choices[0].message.content });

  } catch (error) {
    console.error("Chat API fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
