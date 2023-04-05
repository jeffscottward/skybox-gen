import fs from "fs";
import fetch from "node-fetch";
import Pusher from "pusher-js";
import { BlockadeLabsSdk } from "@blockadelabs/sdk";

// Setup the Pusher client
const pusher = new Pusher("a6a7b7662238ce4494d5", {
  cluster: "mt1",
});

// Setup the SDK
const sdk = new BlockadeLabsSdk({
  api_key: "SnIPcw1UH490N0N8MDJHpd88RXxZ805En50DzWfesXOaWAoAbxAhlWmxbU00",
  env: "production",
});

// Read in the prompts file
function readLocalPromptsFILE() {
  try {
    // Read the file synchronously
    const fileData = fs.readFileSync("./SkyboxPromptsTEST.json", "utf8");

    // Parse the JSON data
    const jsonData = JSON.parse(fileData);

    return jsonData;
  } catch (err) {
    console.error(err);
  }
}

// Generate the skybox
async function getImage(promptText, styleID) {
  const generation = await sdk.generateSkybox({
    prompt: promptText, // Required
    skybox_style_id: styleID, // Required
  });

  // Subscribe to the Pusher channel for this generation
  const channelName = generation.pusher_channel;
  const channel = pusher.subscribe(channelName);

  // Listen for status updates on the channel
  channel.bind("status_update", async function (data) {
    const { status, file_url } = data;

    if (status === "complete") {
      // Save the file to disk
      const filename = `${generation.id}.png`;
      const fileData = fs.createWriteStream(`./${filename}`);
      const response = await fetch(file_url);
      response.body.pipe(fileData);

      console.log(`Image saved to ${filename}`);

      // Unsubscribe from the channel
      channel.unsubscribe();
    } else {
      console.log(status);
    }
  });

  return generation;
}

// Loop through the prompts and generate the skyboxes
async function generateSkyboxes() {
  // Get the prompts
  const SKYBOXLIST = readLocalPromptsFILE();

  for (const promptGroup in SKYBOXLIST) {
    const styleID = SKYBOXLIST[promptGroup]["id"];
    const prompts = SKYBOXLIST[promptGroup]["prompts"];

    for (const prompt in prompts) {
      try {
        const req = await getImage(prompts[prompt], styleID);
        console.log("🚀 ~ file: index.mjs:78 ~ generateSkyboxes ~ req:", req);
      } catch (error) {
        console.log(error);
      }
    }
  }
}

generateSkyboxes();
