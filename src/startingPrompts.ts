import prompts from "prompts";
import { StartingOptions } from "./types";

export async function askStartingOptions(): Promise<StartingOptions> {
    return {
      stationName: await prompts({
        type: "text",
        name: "value",
        message: "What is the name of your space station?",
        validate: (value) => (value === "" ? `Enter a name` : true),
      }),
  
      baseStation: await prompts({
        type: "select",
        name: "value",
        message:
          "Choose a starting station. This determines your starting modules, credits, and funding",
        choices: [
          {
            title: "Jeitai-47 Defense Platform",
            description: "Good starting credits, good funding",
            value: "defense",
          },
          {
            title: "New Hague Market",
            description: "Great starting credits, terrible funding",
            value: "trade",
          },
          {
            title: "Babel 6 Science Outpost",
            description: "Low starting credits, low funding",
            value: "science",
          },
        ],
        initial: 0,
      }),
  
      location: await prompts({
        type: "select",
        name: "value",
        message:
          "Choose a location. Your station is immobile and will remain at this place",
        choices: [
          {
            title: "Frontier",
            description: "Orbiting a star at edge of civilized space",
            value: "frontier",
          },
          {
            title: "Gate Nexus",
            description: "Parked in a nexus of FTL gates",
            value: "nexus",
          },
          {
            title: "Wormhole",
            description: "Orbiting a mysterious wormhole",
            value: "wormhole",
          },
        ],
        initial: 0,
      }),
    };
  }