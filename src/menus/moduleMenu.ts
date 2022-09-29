import chalk from "chalk";
import prompts, { Answers } from "prompts";
import { stationModules } from "../data/stationModules";
import { Log, StationModule, StationState } from "../types";
import { printTable } from "../utils";

export async function moduleMenu(
  stationState: StationState,
  log: Log,
  clear: () => void
): Promise<StationState> {
  const modChoice = await prompts({
    type: "select",
    name: "value",
    choices: stationModules.map((module) => {
      return {
        title: `${
          module.crewApplied >= module.crewRequired
            ? chalk.green(module.name)
            : chalk.grey(module.name)
        } ${getModuleShortCodes(module)} `,
        value: module.name,
      };
    }),
    message: "Choose a module to manage",
  });

  const module = stationState.stationModules.find(
    ({ name }) => name === modChoice.value
  );
  if (module) {
    printModule(module, log);

    const moduleSelectionChoice = await prompts({
      type: "select",
      name: "value",
      warn: "Cannot decommission the command module",
      choices: [
        {
          title: "Back",
          value: "back",
        },
        {
          title: "Decommission",
          value: "decommission",
          disabled: module.name === "Command Module"
        },
      ],
      message: "What to do with this module?",
    });

    if (moduleSelectionChoice.value === "decommission") {
      const decommission: Answers<string> = await prompts({
        type: "toggle",
        name: "value",
        active: "yes",
        inactive: "no",
        message: `Really decommission the ${module.name}? This will unassign crew and jettison the module for deorbit destruction`,
        initial: false,
      });
      if (decommission.value === true) {
        return stationState.foldAndCombine((station) => {
          return {
            stationModules: station.stationModules.filter(
              (mod) => mod.name !== module.name
            ),
          };
        });
      }
    }
  }

  return stationState;
}

export function getModuleShortCodes(module: StationModule): string {
  // +generate -consume ~store
  const generate = `+${module.morale > 0 ? chalk.bold.red(`M`) : ""}${
    module.power > 0 ? chalk.bold.yellow("P") : ""
  }${module.air > 0 ? chalk.bold.white(`A`) : ""}${
    module.food > 0 ? chalk.bold.magenta(`F`) : ""
  }`;
  const consume = `-${module.morale < 0 ? chalk.red(`M`) : ""}${
    module.power < 0 ? chalk.yellow("P") : ""
  }${module.air < 0 ? chalk.white(`A`) : ""}${
    module.food < 0 ? chalk.magenta(`F`) : ""
  }`;
  const store = `~${module.powerStorage > 0 ? chalk.yellow("P") : ""}${
    module.airStorage > 0 ? chalk.white(`A`) : ""
  }${module.foodStorage > 0 ? chalk.magenta(`F`) : ""}`;
  return `${generate !== "+" ? generate : ""} ${
    consume !== "-" ? consume : ""
  } ${store !== "~" ? store : ""}`;
}

export function printModule(module: StationModule, log: Log) {
  const op =
    module.crewApplied >= module.crewRequired
      ? chalk.yellow(`Operational`)
      : chalk.grey(`Not Operational `);
  log(
    `${chalk.bold.white.bgGreen(module.name)} ${op} - ${chalk.gray(
      module.description
    )}`
  );

  if (module.dockingPorts > 0) {
    log(
      `Provides ${module.dockingPorts} docking port${
        module.dockingPorts > 1 ? `s` : ``
      }`
    );
  }

  if (module.crewRequired === 0) {
    log(chalk.gray(` Requires no crew`));
  } else if (module.crewApplied === module.crewRequired) {
    log(
      chalk.yellow(
        ` Requires ${module.crewRequired} crew (${module.crewApplied} assigned)`
      )
    );
  } else if (module.crewApplied <= module.crewRequired) {
    log(
      chalk.red(
        ` Requires ${module.crewRequired} crew (${module.crewApplied} assigned)`
      )
    );
  }
  const moduleTable: string[][] = [
    [
      `Generation:`,
      `${
        module.morale > 0
          ? chalk.bold.red(`Morale ${module.morale}`)
          : chalk.gray(`Morale 0`)
      }`,
      `${
        module.power > 0
          ? chalk.bold.yellow(`Power ${module.power}`)
          : chalk.gray(`Power 0`)
      }`,
      `${
        module.air > 0
          ? chalk.bold.white(`Air ${module.air}`)
          : chalk.gray(`Air 0`)
      }`,
      `${
        module.food > 0
          ? chalk.bold.magenta(`Food ${module.food}`)
          : chalk.gray(`Food 0`)
      }`,
    ],
    [
      `Consumption:`,
      `${
        module.morale < 0
          ? chalk.red(`Morale ${module.morale}`)
          : chalk.gray(`Power 0`)
      }`,
      `${
        module.power < 0
          ? chalk.yellow(`Power ${module.power}`)
          : chalk.gray(`Power 0`)
      }`,
      `${
        module.air < 0 ? chalk.white(`Air ${module.air}`) : chalk.gray(`Air 0`)
      }`,
      `${
        module.food < 0
          ? chalk.magenta(`Food ${module.food}`)
          : chalk.gray(`Food 0`)
      }`,
    ],
    [
      `Storage:`,
      chalk.gray(`Morale 0`),
      `${
        module.powerStorage > 0
          ? chalk.yellow(`Power ${module.powerStorage}`)
          : chalk.gray(`Power 0`)
      }`,
      `${
        module.airStorage > 0
          ? chalk.white(`Air ${module.airStorage}`)
          : chalk.gray(`Air 0`)
      }`,
      `${
        module.foodStorage > 0
          ? chalk.magenta(`Food ${module.foodStorage}`)
          : chalk.gray(`Food 0`)
      }`,
    ],
  ];
  printTable(moduleTable);
}
