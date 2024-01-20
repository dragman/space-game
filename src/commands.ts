import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import {
    Animation,
    BackEase,
    Color3, EasingFunction,
    IAnimationKey,
    LinesMesh, MeshBuilder
} from "@babylonjs/core";
import { log } from "./gui";
import { Pawn } from "./pawn";
import { GridPosition } from "./grid";

interface Command {
    execute(): Promise<void>;
    toString(): string;
}

export class Commander {
    pendingCommands: Command[];
    constructor() {
        this.pendingCommands = [];
    }

    addCommand = (command: Command) => {
        log(`Adding command ${command.toString()}`);
        this.pendingCommands.push(command);
    };

    drainCommands = async () => {
        const num_commands = this.pendingCommands.length;
        if (num_commands > 0) {
            log(`Starting to run ${this.pendingCommands.length} commands`);
            while (this.pendingCommands.length > 0) {
                const command = this.pendingCommands.shift();
                await command.execute();
            }
            log(`Finished running commands`);
        } else {
            log(`No commands to run`);
        }
    };
}
export class MovePawnCommand implements Command {
    mesh: LinesMesh;

    constructor(
        private scene: Scene,
        private pawn: Pawn,
        private gridPosition: GridPosition,
        private previousGridPosition?: GridPosition
    ) {
        const targetPosition = new Vector3(
            this.gridPosition.normalisedWorldPosition.x,
            this.pawn.mesh.position.y,
            this.gridPosition.normalisedWorldPosition.z
        );

        let startPosition: Vector3;
        if (this.previousGridPosition) {
            startPosition = new Vector3(
                this.previousGridPosition.normalisedWorldPosition.x,
                this.pawn.mesh.position.y,
                this.previousGridPosition.normalisedWorldPosition.z
            );
        } else {
            startPosition = this.pawn.mesh.position.clone();
        }
        this.mesh = MeshBuilder.CreateLines(`moveLine`, { points: [startPosition, targetPosition] }, this.scene);
        this.mesh.color = Color3.Green();
    }

    toString(): string {
        return `{MovePawnCommand}`;
    }

    async execute(): Promise<void> {
        const targetPosition = new Vector3(
            this.gridPosition.normalisedWorldPosition.x,
            this.pawn.mesh.position.y,
            this.gridPosition.normalisedWorldPosition.z
        );

        // Put a simple cheeky animation in.
        const frameRate = 60;
        const easingFunction = new BackEase(0.5);
        easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
        const moveAnimation = new Animation("movePawn", "position", frameRate, Animation.ANIMATIONTYPE_VECTOR3);
        const moveAnimationKeys: IAnimationKey[] = [
            { frame: 0, value: this.pawn.mesh.position, easingFunction: easingFunction },
            { frame: 1 * frameRate, value: targetPosition, easingFunction: easingFunction },
        ];
        moveAnimation.setKeys(moveAnimationKeys);

        const forward = this.pawn.mesh.position.subtract(targetPosition).normalize();
        let up = Vector3.Up();
        const right = Vector3.Cross(up, forward);
        up = Vector3.Cross(forward, right);
        const targetQuaternion = Quaternion.RotationQuaternionFromAxis(right, up, forward);

        const rotateAnimation = new Animation(
            "rotatePawn",
            "rotationQuaternion",
            frameRate,
            Animation.ANIMATIONTYPE_QUATERNION
        );

        const rotateAnimationKeys: IAnimationKey[] = [
            { frame: 0, value: this.pawn.mesh.rotationQuaternion, easingFunction: easingFunction },
            { frame: 1 * frameRate, value: targetQuaternion, easingFunction: easingFunction },
        ];
        rotateAnimation.setKeys(rotateAnimationKeys);

        await this.waitForAnimation([rotateAnimation], 0, 1 * frameRate);
        await this.waitForAnimation([moveAnimation], 0, 1 * frameRate);

        this.mesh.dispose();
    }

    async waitForAnimation(animations: Animation[], from: number, to: number): Promise<void> {
        return new Promise((resolve) => {
            this.scene.beginDirectAnimation(this.pawn.mesh, animations, from, to, undefined, undefined, resolve);
        });
    }
}
