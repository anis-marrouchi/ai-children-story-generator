### Build an AI-Driven Children’s Storytelling Web App using Next.js, OpenAI, [Stability.ai](http://stability.ai/), and ElevenLabs

### Introduction

In this tutorial, we’ll walk you through creating a children’s storytelling web application that leverages the power of artificial intelligence. Using Next.js for the frontend and APIs from OpenAI, [Stability.ai](http://stability.ai/), and ElevenLabs, we’ll generate a story, corresponding images, and even an audio version of the story that auto-plays. Ready? Let’s get started!

### Prerequisites

- Node.js installed
- Familiarity with Next.js
- API keys from OpenAI, [Stability.ai](http://stability.ai/), and ElevenLabs

### Step 1: Setting up Next.js

### Why Next.js?

Next.js allows for easy server-side rendering, which is useful when you’re making API calls and handling dynamic content like we are in this project.

#### Commands
```bash
npx create-next-app@latest <name-of-your-application>  
cd <name-of-your-application>  
npm run dev
```

### Step 2: Text Generation with OpenAI API

### Why OpenAI?

OpenAI offers one of the most powerful language models, which we’ll use to generate our story text.

#### Commands

Create a folder and a new file:
```bash
mkdir -p src/app/api/openai && touch src/app/api/openai/route.js
```

#### Code Snippet in `route.js`
```javascript
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
```

### Step 3: Image Generation with [Stability.ai](http://stability.ai/) API

### Why [Stability.ai](http://stability.ai/)?

[Stability.ai](http://stability.ai/) offers an image generation API that we will use to create visuals based on the story.

#### Commands
```bash
mkdir -p src/app/api/stability && touch src/app/api/stability/route.js
```

#### Code Snippet in `route.js`
```javascript
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
```

### Step 4: Audio Generation with ElevenLabs API

### Why ElevenLabs?

ElevenLabs provides an API to convert text to speech. We’ll use this API to make our story even more engaging with an audio narration.

#### Commands
```sh
mkdir -p src/app/api/elevenlabs && touch src/app/api/elevenlabs/route.js
```

#### Code Snippet in `route.js`
```javascript
import { config } from "dotenv";  
config();  
export async function POST(request, res) {  
const body = await request.json();  
let { textInput } = body;  
let voice_id = "21m00Tcm4TlvDq8ikWAM"; //Change the value to the available voice ID you prefer.

const url =  
`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`;  
const headers = {  
Accept: "audio/mpeg",  
"xi-api-key": process.env.ELEVENLABS_API_KEY,  
"Content-Type": "application/json",  
};  
const reqBody = JSON.stringify({  
text: textInput,  
model_id: "eleven_monolingual_v1",  
voice_settings: {  
stability: 0.5,  
similarity_boost: 0.5,  
},  
});

try {  
const response = await fetch(url, {  
method: "POST",  
headers: headers,  
body: reqBody,  
});

if (!response.ok) {  
throw new Error(response.statusText);  
}

const arrayBuffer = await response.arrayBuffer();  
const buffer = Buffer.from(arrayBuffer);  
return new Response(buffer);  
} catch (error) {  
return new Response(JSON.stringify({ error: error.message }));  
}  
}
```

### Step 5: Create the Frontend Page

### Why a Single Page?

We are using a single page to keep things simple. The page will display the form, story, images, and audio player.

#### Create a single frontend page `src/app/page.js`
```jsx
"use client";  
import Image from "next/image";  
import { useEffect, useRef, useState } from "react";

export default function StoryPage() {  
const [prompt, setPrompt] = useState("");  
const [story, setStory] = useState("");  
const [images, setImages] = useState([]);  
const [audio, setAudio] = useState("");  
const audioRef = useRef(null);

useEffect(() => {  
if (audio && audioRef.current) {  
audioRef.current.play();  
}  
}, [audio]);  
const handleSubmit = async (event) => {  
event.preventDefault();

// Fetching a story based on the prompt  
const storyResponse = await fetch("/api/openai", {  
method: "POST",  
headers: { "Content-Type": "application/json" },  
body: JSON.stringify({ prompt }),  
});  
const storyData = await storyResponse.json();  
setStory(storyData.story);

// Fetching images based on the story  
const imageResponse = await fetch("/api/stability", {  
method: "POST",  
headers: { "Content-Type": "application/json" },  
body: JSON.stringify({ story: storyData.story }),  
});  
const imageData = await imageResponse.json();  
setImages(imageData.images);

// Fetching audio based on the story  
const audioResponse = await fetch("/api/elevenlabs", {  
method: "POST",  
headers: { "Content-Type": "application/json" },  
body: JSON.stringify({ textInput: storyData.story }),  
});

const arrayBuffer = await audioResponse.arrayBuffer();  
const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });  
const blobUrl = URL.createObjectURL(blob);  
setAudio(blobUrl);  
};

const resetStory = () => {  
setStory("");  
setImages([]);  
setAudio("");  
setPrompt("");  
};

return (

<div  className="flex flex-col items-center justify-center h-screen bg-gray-100">  
{!story ? (  
<form  
onSubmit={handleSubmit}  
className="p-8 bg-white rounded shadow-md w-1/3"  
>  
<div  className="mb-4">  
<label  
htmlFor="prompt"  
className="block text-sm font-medium text-gray-600"  
>  
Prompt:  
</label>  
<input  
id="prompt"  
type="text"  
value={prompt}  
onChange={(e) =>  setPrompt(e.target.value)}  
className="mt-1 p-2 w-full rounded-md border-gray-300 bg-gray-100"  
/>  
</div>  
<button  
type="submit"  
className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"  
>  
Generate Story  
</button>  
</form>  
) : (  
<div  className="flex flex-col items-center justify-center h-screen bg-gray-100">  
{story && (  
<div  className="p-8 bg-white rounded shadow-md w-full max-w-2xl">  
<h1  className="text-2xl font-semibold mb-4">Generated Story</h1>  
    
{/* Story Section */}  
<div  className="max-h-[40vh] overflow-y-auto mb-4">  
<p  className="text-lg text-gray-700">{story}</p>  
</div>  
    
{/* Images Section */}  
{images.length > 0 && (  
<div  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">  
{images.map((img, index) => (  
<div  key={index}  className="bg-gray-200 rounded">  
{/* Replace with actual Image component */}  
<Image  
alt=""  
width={512}  
height={512}  
src={`data:image/jpeg;base64,${img}`}  
/>  
</div>  
))}  
</div>  
)}  
    
{/* Audio Section */}  
{audio && (  
<div  className="mb-4">  
<audio  ref={audioRef}  controls  src={`${audio}`}  className="w-full"  />  
</div>  
)}  
    
{/* Reset Button */}  
<button  
onClick={resetStory}  
className="mt-4 px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"  
>  
Generate New Story  
</button>  
</div>  
)}  
</div>  
)}  
</div>  
);  
}
```

### Conclusion

You’ve successfully built a fully-functioning children’s storytelling web application that not only generates a textual story but also creates relevant images and an audio narration. You’ve harnessed the power of AI to create an engaging multi-media experience. Well done!

By following this tutorial, you’ll gain a deeper understanding of how to integrate multiple APIs into a Next.js project, and more importantly, how to use AI to create dynamic and engaging web applications. Happy coding!
