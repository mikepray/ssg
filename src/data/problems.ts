import chalk from "chalk";
import { ProblemNarrative } from "../types";
import { d100 } from "../utils";

export const problems: ProblemNarrative[] = [
  {
    name: "Micro-Meteor Storm",
    narrative: `Scanners indicate a storm of micro-meteors on an intercept path with the station's orbit. The station may lose air if the meteors impact the station.`,
    rarity: 1,
    respawnWait: 100,
    questions: {
      type: "select",
      name: "answer",
      message: "What is your choice?",
      choices: [
        {
          title: `Move the station's orbit (-10 power)`,
          value: "move",
        },
        {
          title: "Brace for impact (chance to lose air)",
          value: "brace",
        },
      ],
    },
    results: [
      {
        answer: "move",
        mutation: (station) => {
            return {
                narrative: 'The station fires thrusters and modifies the orbit to miss the meteors (-10 power)',
                mutateStation: {
                    power: station.power - 10,
                },
          };
        },
      },
      {
        answer: "brace",
        mutation: (station) => {
          const roll = d100();
          const airLost = roll > 60 ? roll > 70 ? roll > 80 ? 
            0 : 2 : 3 : 7;
          const narrative = roll > 60 && roll < 80 
          ? chalk.red(`Meteors hit the station! ${airLost} air is lost before repairs can be made`)
          : chalk.greenBright(`The meteors pass narrowly by the station and no air is lost!`)
          return {
            narrative: narrative,
            mutateStation: {
            air:
              station.air - airLost
            }
          };
        },
      },
    ],
  },
];
