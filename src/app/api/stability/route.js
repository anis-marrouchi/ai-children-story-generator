import { NextResponse } from "next/server";

export async function POST(req) {
  const body = await req.json();
  const { story } = body;
  let allImages = [];
  const prompts = await getPrompts(story);
  for (let i = 0; i < prompts.length; i++) {
    const text_prompts = [{ text: prompts[i] }];
    const response = await fetch(
      "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
        },
        body: JSON.stringify({ text_prompts }),
      }
    );
    const images = await response.json();
    allImages.push(images.artifacts[0].base64);
  }
  return NextResponse.json({ images: allImages });
}

async function getPrompts(story) {
  const OpenAI = require("openai");
  const openai = new OpenAI(process.env.OPENAI_API_KEY);
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-16k",
    messages: [
      {
        role: "system",
        content: `You are a friendly assistant. Your job is to generate image prompts based on the following story. Each prompt should be a short descriptive sentence. Please list all three prompts, separated by a "|" symbol. For example, "a bright sunny day|a dark spooky night|a bustling city street".`,
      },
      {
        role: "user",
        content: `story: ${story}\n`,
      },
    ],
  });
  const prompts =
    response.choices[0]?.message?.content?.trim().split("|") || "";
  return prompts;
}
