import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { Color3, Color4 } from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

async function loadDebugModuleIfNeeded() {
    // Augments the scene with the debug methods
    await import("@babylonjs/core/Debug/debugLayer");
    await import("@babylonjs/inspector");
}

import { log } from "./gui";
import { Pawn } from "./pawn";
import { GameStateMachine, GameState } from "./stateMachine";
import { Commander } from "./commands";
import { Mover } from "./mover";
import { Grid } from "./grid";

let baseUrl = "";
if (!IS_DEVELOPMENT) {
    baseUrl = "public/";
}

class BabylonApp {
    private engine: Engine;
    private scene: Scene;
    private canvas: HTMLCanvasElement;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.engine = new Engine(this.canvas);
        this.scene = new Scene(this.engine);
    }

    onResize = (): void => {
        this.engine.resize();
    };

    onIsReady = async (): Promise<void> => {
        this.scene.clearColor = Color4.FromColor3(new Color3(0.05, 0.05, 0.1));
        const camera = new ArcRotateCamera("camera1", -Math.PI / 4, Math.PI / 3, 20, Vector3.Zero(), this.scene);
        camera.setTarget(Vector3.Zero());
        camera.attachControl(this.canvas, true);

        const light = new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);
        light.intensity = 0.9;

        log("Hello");

        const grid = new Grid("grid1", this.scene, 12, 4);

        const pawn = await Pawn.from_file("pawn1", this.scene, `${baseUrl}models/`, "ship1.glb");

        const commander = new Commander();

        const stateMachine = new GameStateMachine(commander, GameState.Plan);
        const mover = new Mover(this.scene, grid, commander);

        stateMachine.onResolveStateObserver.add(mover.onResolveState);
        mover.trackPawns(pawn);

        if (IS_DEVELOPMENT) {
            await loadDebugModuleIfNeeded();
            this.scene.debugLayer.show();
        }
    };

    run = async (): Promise<void> => {
        window.addEventListener("resize", this.onResize);

        if (this.scene.isReady()) {
            await this.onIsReady();
        }

        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    };
}

const app = new BabylonApp("renderCanvas");

(async () => app.run())();
