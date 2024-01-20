import { Scene } from "@babylonjs/core/scene";
import { log } from "./gui";
import { Pawn } from "./pawn";
import { Commander, MovePawnCommand } from "./commands";
import { GridPosition } from "./grid";
import { Grid } from "./grid";

export class Mover {
    private trackedPawns: Pawn[];
    private currentPawn: Pawn;
    private previousGridPosition: GridPosition;

    constructor(private scene: Scene, private grid: Grid, private commander: Commander) {
        this.trackedPawns = [];
        this.grid.onGridPositionSelectedObservable.add(this.onGridPositionSelected);
    }

    trackPawns = (...pawns: Pawn[]): void => {
        pawns.forEach((pawn) => {
            pawn.onSelectionObservable.add(this.onPawnSelected);
        });
        this.trackedPawns.push(...pawns);
    };

    onPawnSelected = (selectedPawn: Pawn): void => {
        log(`Selected ${selectedPawn.mesh.name}`);
        this.previousGridPosition = null;
        this.currentPawn = selectedPawn;

        // Deselect any other pawns.
        for (const otherPawn of this.trackedPawns) {
            if (otherPawn === selectedPawn) {
                continue;
            }

            otherPawn.deselect();
        }
    };

    onGridPositionSelected = (gridPosition: GridPosition) => {
        if (this.trackedPawns.filter((p) => p.selected).length == 0) {
            log(`No selected pawns`);
            return;
        }
        const moveCommand = new MovePawnCommand(this.scene, this.currentPawn, gridPosition, this.previousGridPosition);
        this.commander.addCommand(moveCommand);
        this.previousGridPosition = gridPosition;
    };

    onResolveState = () => {
        this.trackedPawns.forEach((pawn) => {
            pawn.deselect();
        });
    };
}
