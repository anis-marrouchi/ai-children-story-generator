import { NextResponse } from "next/server";
export async function POST(req) {
  const OpenAI = require("openai");
  const openai = new OpenAI(process.env.OPENAI_API_KEY);
  const prompt = req.body.prompt;
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-16k",
    messages: [
      {
        role: "system",
        content: `You are a children story writer.
        Your job is to write a story based on the following prompt.
        `,
      },
      {
        role: "user",
        content: `prompt: ${prompt}\n`,
      },
    ],
    max_tokens: 100,
  });

  return NextResponse.json({
    story: response.choices[0]?.message?.content?.trim() || "",
  });
}
