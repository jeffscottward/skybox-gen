import fs from "fs";
import Pusher from "pusher-js";
import { BlockadeLabsSdk } from "@blockadelabs/sdk";

//app_id: "1555452",
// const pusher = new Pusher("a6a7b7662238ce4494d5", {
//   cluster: "mt1",
// });

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
        const genImage = await getImage(prompts[prompt], styleID);
        console.log(genImage);
      } catch (error) {
        console.log(error);
      }
    }
  }
}

generateSkyboxes();
