import { Observable } from "@babylonjs/core";
import { Gui, log } from "./gui";
import { Commander } from "./commands";

export enum GameState {
    Plan,
    Resolve
}
export class GameStateMachine {
    currentState: GameState;
    onResolveStateObserver: Observable<void>;

    private validTransitions: Map<GameState, GameState[]> = new Map([
        [GameState.Plan, [GameState.Resolve]],
        [GameState.Resolve, [GameState.Plan]],
    ]);

    constructor(private commander: Commander, initialState?: GameState) {
        this.currentState = initialState ?? GameState.Plan;
        this.onResolveStateObserver = new Observable();

        Gui.getInstance().nextTurnButton.onPointerClickObservable.add(async () => {
            if (this.currentState === GameState.Plan) {
                await this.changeState(GameState.Resolve);
            } else if (this.currentState === GameState.Resolve) {
                log("Still resolving...");
            }
        });
    }

    canTransition = (targetState: GameState): boolean => {
        return this.validTransitions.get(this.currentState).includes(targetState);
    };

    changeState = async (targetState: GameState): Promise<void> => {
        if (targetState === this.currentState) {
            throw new Error(`We're already in ${GameState[this.currentState]} state!`);
        }

        if (!this.canTransition(targetState)) {
            throw new Error(
                `Cannot transition from state ${GameState[this.currentState]} to ${GameState[targetState]}`
            );
        }

        this.currentState = GameState.Resolve;
        this.onResolveStateObserver.notifyObservers();

        await this.commander.drainCommands();

        this.currentState = GameState.Plan;
    };
}
