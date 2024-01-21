import { Scene } from "@babylonjs/core/scene";
import { log } from "./gui";
import { Pawn } from "./pawn";
import { Commander, MovePawnCommand } from "./commands";
import { GridPosition } from "./grid";
import { Grid } from "./grid";
import { Vector3 } from "@babylonjs/core";

export class Mover {
    private trackedPawns: Pawn[];
    private previousGridPosition: GridPosition;
    private currentPawn: Pawn | null = null;

    constructor(private scene: Scene, private grid: Grid, private commander: Commander) {
        this.trackedPawns = [];
        this.grid.onGridPositionSelectedObservable.add(this.onGridPositionSelected);
        this.grid.onGridPositionHoveredObservable.add(this.onGridPositionHovered);
    }

    public trackPawns = (...pawns: Pawn[]): void => {
        pawns.forEach((pawn) => {
            pawn.onSelectionObservable.add(this.onPawnSelected);
        });
        this.trackedPawns.push(...pawns);
    };

    private onPawnSelected = (selectedPawn: Pawn): void => {
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

    private onGridPositionSelected = (gridPosition: GridPosition) => {
        if (this.currentPawn === null) {
            log(`No selected pawns`);
            return;
        }
        const moveCommand = new MovePawnCommand(this.scene, this.currentPawn, gridPosition, this.previousGridPosition);
        this.commander.addCommand(moveCommand);
        this.previousGridPosition = gridPosition;
    };

    private onGridPositionHovered = (gridPosition: GridPosition | null): void => {
        if (this.currentPawn === null || gridPosition === null) {
            return;
        }

        this.currentPawn.ghost.mesh.position = new Vector3(
            gridPosition.normalisedWorldPosition.x,
            this.currentPawn.ghost.mesh.position.y,
            gridPosition.normalisedWorldPosition.z
        );
    };

    public onResolveState = () => {
        this.trackedPawns.forEach((pawn) => {
            pawn.deselect();
        });
    };
}
