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
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      {!story ? (
        <form
          onSubmit={handleSubmit}
          className="p-8 bg-white rounded shadow-md w-1/3"
        >
          <div className="mb-4">
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
              onChange={(e) => setPrompt(e.target.value)}
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
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
          {story && (
            <div className="p-8 bg-white rounded shadow-md w-full max-w-2xl">
              <h1 className="text-2xl font-semibold mb-4">Generated Story</h1>

              {/* Story Section */}
              <div className="max-h-[40vh] overflow-y-auto mb-4">
                <p className="text-lg text-gray-700">{story}</p>
              </div>

              {/* Images Section */}
              {images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {images.map((img, index) => (
                    <div key={index} className="bg-gray-200 rounded">
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
                <div className="mb-4">
                  <audio ref={audioRef} controls src={`${audio}`} className="w-full" />
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
