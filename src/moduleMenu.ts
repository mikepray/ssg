import chalk from "chalk";
import { log } from "console";
import prompts from "prompts";
import { StationState } from "./types";
import { printTable } from "./utils";

export async function moduleMenu(stationState: StationState) {
    console.clear();
    stationState.stationModules.forEach(module => {
        const op = module.crewApplied >= module.crewRequired ? 
            chalk.yellow(`Operational` ) :
            chalk.grey(`Not Operational `);
        log(`${chalk.bold.white.bgGreen(module.name)} ${op} - ${chalk.gray(module.description)}`)
        
        if (module.crewRequired === 0) {
            log(chalk.gray(` Requires no crew`));
        } else if (module.crewApplied === module.crewRequired) {
            log(chalk.yellow(` Requires ${module.crewRequired} crew (${module.crewApplied} assigned)`));
        } else if (module.crewApplied <= module.crewRequired) {
            log(chalk.red(` Requires ${module.crewRequired} crew (${module.crewApplied} assigned)`));
        }
        const moduleTable: string[][] = 
        [
            [`Generation:`, 
            `Power ${module.power > 0 ? chalk.bold.black.bgYellow(module.power) : chalk.gray(0)}`, 
            `Air ${module.air > 0 ? chalk.black.bgWhite(module.air) : chalk.gray(0)}`, 
            `Food ${module.food > 0 ? chalk.bgMagenta(module.food) : chalk.gray(0)}`],
            [`Consumption:`,
            `Power ${module.power < 0 ? chalk.bold.black.bgYellow(module.power) : chalk.gray(0)}`,
            `Air ${module.air < 0 ? chalk.black.bgWhite(module.air) : chalk.gray(0)}`,
            `Food ${module.food < 0 ? chalk.bgMagenta(module.food) : chalk.gray(0)}`],
            [`Storage:`, 
            `Power ${module.powerStorage > 0 ? chalk.bold.black.bgYellow(module.powerStorage) : chalk.gray(0)}`,
            `Air ${module.airStorage > 0 ? chalk.black.bgWhite(module.airStorage) : chalk.gray(0)}`,
            `Food ${module.foodStorage > 0 ? chalk.bgMagenta(module.foodStorage) : chalk.gray(0)}`]
        ];
        log(printTable(moduleTable));

    });

    const cont = await prompts({
        type: 'confirm',
        name: 'value',
        message: 'Continue...',
        initial: true
      });
}