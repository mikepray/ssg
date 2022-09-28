import { testingStationState } from "./data/testStartingState";
import { gameLoop } from "./game";

startGame()
.then((val => {
    // no op
}), (reject) => {
    // called when the game is over
    console.log(reject);
})

async function startGame() {
    let stationState = testingStationState;
    while (true) {
        try {
            stationState = await gameLoop(stationState, console.log, console.clear);
        } catch (reject) {
            // can save game state here
            return Promise.reject(reject);
        }
    }
}