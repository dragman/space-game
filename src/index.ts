import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { Scene } from "@babylonjs/core/scene";

import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";

// Augments the scene with the debug methods
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

import { addLabelToMesh } from "./gui";
import { Behavior, Mesh, PointerEventTypes, PointerInfo, int } from "@babylonjs/core";

interface IPickableMesh {
    mesh: Mesh;
    onPicked(pointerInfo: PointerInfo): void;
}

class PickableMeshBehaviour implements Behavior<IPickableMesh> {
    public name: string;
    private pickable: IPickableMesh;
    private scene: Scene;

    constructor(name: string, scene: Scene) {
        this.name = name;
        this.scene = scene;
    }

    public init(): void {}

    public attach(pickable: IPickableMesh): void {
        this.pickable = pickable;
        this.scene.onPointerObservable.add(this.onPointerPick);
    }

    public detach(): void {
        this.scene.onPointerObservable.removeCallback(this.onPointerPick);
    }

    private onPointerPick = (pointerInfo: PointerInfo) => {
        switch (pointerInfo.type) {
            case PointerEventTypes.POINTERPICK:
                if (pointerInfo.pickInfo.pickedMesh === this.pickable.mesh) {
                    this.pickable.onPicked(pointerInfo);
                }
                break;
            default:
                break;
        }
    };
}

class Grid implements IPickableMesh {
    public gridSize: int;
    public gridSubdivisions: int;
    public mesh: Mesh;

    constructor(name: string, scene: Scene, size: int, subdivisions: int) {
        this.gridSize = size;
        this.gridSubdivisions = subdivisions;

        const material = new GridMaterial("grid", scene);
        material.gridRatio = 3;
        material.gridRatio = this.gridSize / this.gridSubdivisions;

        this.mesh = CreateGround("ground1", { width: size, height: size, subdivisions: subdivisions }, scene);

        this.mesh.material = material;
    }

    onPicked = (pointerInfo: PointerInfo): void => {
        alert("BAM!");
    };
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
        const camera = new ArcRotateCamera("camera1", -Math.PI / 2, Math.PI / 5, 10, Vector3.Zero(), this.scene);
        camera.setTarget(Vector3.Zero());
        camera.attachControl(this.canvas, true);

        const light = new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);
        light.intensity = 0.7;

        const ground = new Grid("ground1", this.scene, 12, 4);
        addLabelToMesh(ground.mesh);

        const pickableBehaviour = new PickableMeshBehaviour("pickableMeshBehaviour1", this.scene);
        pickableBehaviour.attach(ground);

        if (IS_DEVELOPMENT) {
            this.scene.debugLayer.show();
        }
    };

    run = (): void => {
        window.addEventListener("resize", this.onResize);

        if (this.scene.isReady()) {
            this.onIsReady();
        }

        this.scene.onPointerObservable.add();

        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    };
}

const app = new BabylonApp("renderCanvas").run();
