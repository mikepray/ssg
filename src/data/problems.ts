import chalk from "chalk";
import { Choice } from "prompts";
import { ProblemNarrative, StationState } from "../types";
import { d100 } from "../utils";

export const problems: ProblemNarrative[] = [
  {
    name: "Micro-Meteor Storm",
    narrative: `Scanners indicate a storm of micro-meteors on an intercept path with the station's orbit. The station may lose air if the meteors impact the station.`,
    rarity: 5,
    respawnWait: 100,
    questions: (stationState) => { 
      let choices = [
        {
          title: "Brace for impact (chance to lose air)",
          value: "brace",
        },
        {
          title: `Move the station's orbit (-10 power) ${stationState.power < 10 ? ` - Not enough power` : ``}`,
          value: "move",
          disabled: stationState.power < 10,
        },
      ];
      const shield = stationState.stationModules.find(({name}) => name === "MIE Shield");
      if (shield) {
        choices.push({
          title: `${chalk.green(`Shield Module`)}: Deflect the micro-meteors ${shield.crewApplied < shield.crewRequired ? ` - Module not operational` : ``}`,
          value: "shield",
          disabled: shield.crewApplied < shield.crewRequired
        })
      }
      return {
      type: "select",
      name: "answer",
      message: "What is your choice?",
      choices: choices
    }},
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
  {
    name: "Solar Flare",
    narrative: `The system's star is erupting in an electromagnetic storm which will soon impact the station. Systems left online will require repairs  `,
    rarity: 8,
    respawnWait: 50,
    questions: (stationState: StationState) => {
     let choices:Choice[] = [
        {
          title: `Shut down the station (unassign all crew from modules)`,
          value: "shutDown",
        },
      ];
      if (stationState.stationModules.find(({name}) => name === "MIE Shield")) {
        choices.push({
          title: `${chalk.green(`MIE Shield`)}: Overcharge shields. -10 power to avoid damage ${stationState.power < 10 ? ` - Not enough power` : ``}`,
          value: "shield",
          disabled: stationState.power < 10
        })
      }
      return {
      type: "select",
      name: "answer",
      message: "What is your choice?",
      choices: choices
    }},
    results: [
      {
        answer: "shield",
        mutation: (station) => {
            return {
                narrative: 'The crew overcharges the shield and the station avoids damage from the solar flare. -10 power',
                mutateStation: {
                    power: station.power - 10,
                },
          };
        },
      },
      {
        answer: "shutDown",
        mutation: (station) => {
          return {
            narrative: "The station goes dark as the solar flare passes by",
            mutateStation: {
              stationModules: station.stationModules.map(mod => { return {...mod, crewApplied: 0}})
            }
          };
        },
      },
    ],
  },
];
