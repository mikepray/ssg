import chalk from "chalk";
import { Choice } from "prompts";
import { printStationStatus, reduceModuleCrew } from "../game";
import { ProblemNarrative, StationState } from "../types";
import { d100 } from "../dice";

export const problems: ProblemNarrative[] = [
  {
    name: "Micro-Meteor Storm",
    rarity: 5,
    respawnWait: 100,
    narrativeSequence: [
      {
        narrative: `Scanners indicate a storm of micro-meteors on an intercept path with the station's orbit. The station may lose air if the meteors impact the station.`,
        activationPredicate: (stationState: StationState) => true,
        questions: (stationState) => {
          let choices = [
            {
              title: "Brace for impact (chance to lose air)",
              value: "brace",
            },
            {
              title: `Move the station's orbit (-10 power) ${
                stationState.power < 10 ? ` - Not enough power` : ``
              }`,
              value: "move",
              disabled: stationState.power < 10,
            },
          ];
          const shield = stationState.stationModules.find(
            ({ name }) => name === "MIE Shield"
          );
          if (shield) {
            choices.push({
              title: `${chalk.green(
                `Shield Module`
              )}: Deflect the micro-meteors ${
                shield.crewApplied < shield.crewRequired
                  ? ` - Module not operational`
                  : ``
              }`,
              value: "shield",
              disabled: shield.crewApplied < shield.crewRequired,
            });
          }
          return {
            type: "select",
            name: "answer",
            message: "What is your choice?",
            choices: choices,
          };
        },
        results: [
          {
            answer: "move",
            mutateStation: (station) => {
              return {
                narrative:
                  "The station fires thrusters and modifies the orbit to miss the meteors (-10 power)",
                mutateStation: {
                  power: station.power - 10,
                },
              };
            },
          },
          {
            answer: "brace",
            mutateStation: (station) => {
              const roll = d100();
              const airLost =
                roll > 60 ? (roll > 70 ? (roll > 80 ? 0 : 2) : 3) : 7;
              const narrative =
                roll > 60 && roll < 80
                  ? chalk.red(
                      `Meteors hit the station! ${airLost} air is lost before repairs can be made`
                    )
                  : chalk.greenBright(
                      `The meteors pass narrowly by the station and no air is lost!`
                    );
              return {
                narrative: narrative,
                mutateStation: {
                  air: station.air - airLost,
                },
              };
            },
          },
        ],
      },
    ],
  },
  {
    name: "Solar Flare",
    rarity: 8,
    respawnWait: 50,
    narrativeSequence: [
      {
        narrative: `The system's star is erupting in an electromagnetic storm which will soon impact the station. Systems left online will require repairs  `,
        activationPredicate: (stationState: StationState) => true,
        questions: (stationState: StationState) => {
          let choices: Choice[] = [
            {
              title: `Shut down the station (unassign all crew from modules)`,
              value: "shutDown",
            },
          ];
          const shield = stationState.stationModules.find(
            ({ name }) => name === "MIE Shield"
          );
          if (shield) {
            choices.push({
              title: `${chalk.green(
                `MIE Shield`
              )}: Overcharge shields. -10 power to avoid damage ${
                stationState.power < Math.abs(shield.power)
                  ? ` - Not enough power`
                  : ``
              }`,
              value: "shield",
              disabled: stationState.power < Math.abs(shield.power),
            });
          }
          return {
            type: "select",
            name: "answer",
            message: "What is your choice?",
            choices: choices,
          };
        },
        results: [
          {
            answer: "shield",
            mutateStation: (station) => {
              return {
                narrative:
                  "The crew overcharges the shield and the station avoids damage from the solar flare. -10 power",
                mutateStation: {
                  power: station.power - 10,
                },
              };
            },
          },
          {
            answer: "shutDown",
            mutateStation: (station) => {
              return {
                narrative: "The station goes dark as the solar flare passes by",
                mutateStation: {
                  stationModules: station.stationModules.map((mod) => {
                    return { ...mod, crewApplied: 0 };
                  }),
                },
              };
            },
          },
        ],
      },
    ],
  },
  {
    name: "Space Crazy",
    rarity: 2,
    respawnWait: 10,
    narrativeSequence: [
      {
        narrative: `Conditions in the station are terrible and one of the crew has gone insane. They are attempting to throw themselves out the airlock.`,
        activationPredicate: (stationState: StationState) =>
          stationState.morale <= 25,
        questions: (stationState: StationState) => {
          let choices: Choice[] = [
            {
              title: `Do nothing and allow them to die`,
              value: "nothing",
            },
          ];
          const brig = stationState.stationModules.find(
            ({ name }) => name === "Brig"
          );
          if (brig) {
            choices.push({
              title: `${chalk.green(`Brig`)}: Imprison the crew in the brig`,
              value: "brig",
              disabled:
                stationState.power < Math.abs(brig.power) &&
                brig.crewApplied >= brig.crewRequired,
            });
          }
          const medbay = stationState.stationModules.find(
            ({ name }) => name === "MedBay"
          );
          if (medbay) {
            choices.push({
              title: `${chalk.green(`MedBay`)}: Sedate the crew in the medbay`,
              value: "medbay",
              disabled:
                stationState.power < Math.abs(medbay.power) &&
                medbay.crewApplied >= medbay.crewRequired,
            });
          }
          return {
            type: "select",
            name: "answer",
            message: "What is your choice?",
            choices: choices,
          };
        },
        results: [
          {
            answer: "nothing",
            mutateStation: (station) => {
              return {
                narrative:
                  "The crew laughs with manic glee as they float to their death",
                mutateStation: {
                  ...reduceModuleCrew(
                    station,
                    station.stationModules.find(
                      ({ crewApplied }) => crewApplied > 0
                    )
                  ),
                  crew: station.crew - 1,
                },
              };
            },
          },
          {
            answer: "brig",
            mutateStation: (station) => {
              return {
                narrative:
                  "The crew is imprisoned in the brig and eventually recovers",
                mutateStation: {
                  ...reduceModuleCrew(
                    station,
                    station.stationModules.find(
                      ({ crewApplied }) => crewApplied > 0
                    )
                  ),
                },
              };
            },
          },
          {
            answer: "medbay",
            mutateStation: (station) => {
              return {
                narrative: "The crew is sedated until they recover",
                mutateStation: {
                  ...reduceModuleCrew(
                    station,
                    station.stationModules.find(
                      ({ crewApplied }) => crewApplied > 0
                    )
                  ),
                },
              };
            },
          },
        ],
      },
    ],
  },
  {
    name: "Mold",
    rarity: 12,
    respawnWait: 10,
    narrativeSequence: [
      {
        narrative: `Mold is growing in the station's air recycler. There are no ill effects noted by the crew`,
        activationPredicate: (stationState: StationState) =>
          stationState.stardate > 50 &&
          stationState.stationModules.find(
            (module) => module.name === "Air Recycler"
          ) !== undefined,
        questions: (stationState: StationState) => {
          let choices: Choice[] = [
            {
              title: `Do nothing`,
              value: "nothing",
            },
          ];

          return {
            type: "select",
            name: "answer",
            message: "What is your choice?",
            choices: choices,
          };
        },
        results: [
          {
            answer: "nothing",
            mutateStation: (station) => {
              return {
                narrative: `The mold continues to grow`,
                mutateStation: {
                  ...reduceModuleCrew(
                    station,
                    station.stationModules.find(
                      ({ crewApplied }) => crewApplied > 0
                    )
                  ),
                  crew: station.crew - 1,
                },
              };
            },
          },
        ],
      },
      {
        narrative: `The mold is getting worse. Some crew have noted respiratory issues`,
        activationPredicate: (stationState: StationState) =>
          stationState.stationModules.find(
            (module) => module.name === "Air Recycler"
          ) !== undefined,
        questions: (stationState: StationState) => {
          let choices: Choice[] = [
            {
              title: `Do nothing`,
              value: "nothing",
            },
          ];
    
          return {
            type: "select",
            name: "answer",
            message: "What is your choice?",
            choices: choices,
          };
        },
        results: [
          {
            answer: "nothing",
            mutateStation: (station) => {
              return {
                narrative: `The mold continues to grow. A crew has died`,
                mutateStation: {
                  ...reduceModuleCrew(
                    station,
                    station.stationModules.find(
                      ({ crewApplied }) => crewApplied > 0
                    )
                  ),
                  crew: station.crew - 1,
                },
              };
            },
          },
        ],
      },
    ],
  },
];
