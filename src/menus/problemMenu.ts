import chalk from "chalk";
import prompts from "prompts";
import { problems } from "../data/problems";
import { StationState, Log, ProblemNarrative } from "../types";
import { d20, dN } from "../dice";

export async function problemMenu(
  stationState: StationState,
  log: Log,
  clear: () => void
): Promise<StationState> {
  const rarityRoll = d20();

  // make a list of candidate problems
  // choose problems with rarity equal/under the rarity roll and...
  // choose problems that have not been previously solved
  const candidateProblems = problems.filter(
    ({ name, rarity }) =>
      rarity > 0 &&
      rarity < rarityRoll &&
      stationState.previouslySolvedProblems.find(
        (problem) => problem.name == name
      ) === undefined
  );

  // choose a random problem among the candidates
  const problem = candidateProblems[dN(candidateProblems.length) - 1];
  if (problem && stationState) {
    return doProblem(stationState, problem, log, clear);
  }
  return stationState;
}

export async function doProblem(
  stationState: StationState,
  problem: ProblemNarrative,
  log: Log,
  clear: () => void
) {

  const problemSequenceInProgress = stationState.problemSequencesInProgress.find(p => p.name === problem.name);
  const indexOfLastSequenceSolved = problemSequenceInProgress !== undefined ? problemSequenceInProgress.indexOfLastSequenceSolved + 1: 0;

  clear();
  log(chalk.white.bold(problem.name));
  log(problem.narrativeSequence[indexOfLastSequenceSolved].narrative);
  const answer = await prompts(problem.narrativeSequence[indexOfLastSequenceSolved].questions(stationState));
  if (answer) {
    const result = problem.narrativeSequence[indexOfLastSequenceSolved].results.find(
      (result) => result.answer === answer.answer
    );
    if (result) {
      const mutation = result.mutateStation(stationState);
      log(mutation.narrative);
      await prompts({
        type: "confirm",
        name: "value",
        message: "Continue...",
        initial: true,
      });

      // add or iterate the sequence of the last problem sequence solved
      let problemSequencesInProgress = stationState.problemSequencesInProgress;
      if (stationState.problemSequencesInProgress.find(p => p.name === problem.name) === undefined) {
        problemSequencesInProgress.push({name: problem.name, indexOfLastSequenceSolved: 0});
      } else {
        problemSequencesInProgress = problemSequencesInProgress.map(p => {
          if (p.name === problem.name) {
            return {name: problem.name, indexOfLastSequenceSolved: p.indexOfLastSequenceSolved + 1}
          }
          return p;
        })
      }

      return stationState.fold({
        ...mutation.mutateStation,
        previouslySolvedProblems: stationState.previouslySolvedProblems.concat({
          name: problem.name,
          stardateSinceLastSolved: stationState.stardate,
        }),
        problemSequencesInProgress: problemSequencesInProgress,
      });
    }
  }
  return stationState;
}
