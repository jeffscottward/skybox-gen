// Import required modules
import fs from "fs";
import fetch from "node-fetch";
import Pusher from "pusher-js";
import { BlockadeLabsSdk } from "@blockadelabs/sdk";

// Setup the Pusher client
const pusher = new Pusher("a6a7b7662238ce4494d5", {
  cluster: "mt1", // Cluster for the Pusher client
});

// Setup the SDK
const sdk = new BlockadeLabsSdk({
  api_key: "SnIPcw1UH490N0N8MDJHpd88RXxZ805En50DzWfesXOaWAoAbxAhlWmxbU00", // API key for the BlockadeLabs SDK
  env: "production", // Environment for the BlockadeLabs SDK
});

// Read in the prompts file
function readLocalPromptsFILE() {
  try {
    // Read the file synchronously
    const fileData = fs.readFileSync("./SkyboxPrompts.json", "utf8");

    // Parse the JSON data
    const jsonData = JSON.parse(fileData);

    return jsonData;
  } catch (err) {
    console.error(err);
  }
}

// Generate the skybox
async function getImage(promptText, styleID, styleName) {
  // Generate the skybox using the BlockadeLabs SDK
  const generation = await sdk.generateSkybox({
    prompt: promptText, // Required prompt text for the skybox generation
    skybox_style_id: styleID, // Required style ID for the skybox generation
  });

  // Subscribe to the Pusher channel for this generation
  const channelName = generation.pusher_channel;
  const channel = pusher.subscribe(channelName);

  // Listen for status updates on the channel
  await new Promise((resolve, reject) => {
    channel.bind("status_update", async function (data) {
      const { status, file_url } = data;

      if (status === "complete") {
        // Save the file to disk
        const prefix = `${styleID}_${styleName
          .toLowerCase()
          .replace(/\s+/g, "_")}_`;
        const generationFolder = `./generations/${styleID}_${styleName
          .toLowerCase()
          .replace(/\s+/g, "_")}/`;
        const filename = `${prefix}${generation.id}.png`;

        // Create the generations folder if it doesn't exist
        if (!fs.existsSync(`./generations`)) {
          fs.mkdirSync(`./generations`);
        }

        // Create the style folder if it doesn't exist
        if (!fs.existsSync(generationFolder)) {
          fs.mkdirSync(generationFolder);
        }

        const fileData = fs.createWriteStream(`${generationFolder}${filename}`);
        const response = await fetch(file_url);
        response.body.pipe(fileData);

        console.log(`Image saved to ${filename}`);

        // Unsubscribe from the channel
        channel.unsubscribe();

        resolve();
      } else {
        console.log(status);
      }
    });
  });
}

// Loop through the prompts and generate the skyboxes
async function generateSkyboxes() {
  // Get the prompts from the prompts file
  const SKYBOXLIST = readLocalPromptsFILE();

  // Loop through each prompt group in the prompts file
  // Loop through each prompt group in the prompts file
  for (const promptGroup in SKYBOXLIST) {
    const styleID = SKYBOXLIST[promptGroup]["id"];
    const styleName = SKYBOXLIST[promptGroup]["style"];
    const prompts = SKYBOXLIST[promptGroup]["prompts"];

    // Loop through each prompt in the prompt group
    for (const prompt in prompts) {
      try {
        // Generate the skybox
        await getImage(prompts[prompt], styleID, styleName);
        console.log(`Finished generating skybox for prompt ${prompts[prompt]}`);
      } catch (error) {
        console.log(error);
      }
    }

    // Wait for all prompts in this group to finish before moving on to the next group
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

generateSkyboxes();
