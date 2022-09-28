import { testingStationState } from "./data/testStartingState";
import { gameLoop } from "./game";

startGame().then((val => {

}), (reject) => {
    console.log(reject);
})

async function startGame() {
    let stationState = testingStationState;
    while (true) {
        try {
            stationState = await gameLoop(stationState, console.log, console.clear);
        } catch (reject) {
            return Promise.reject(reject);
        }
    }
}