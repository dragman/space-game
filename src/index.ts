import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { Scene } from "@babylonjs/core/scene";
import { Color3, Color4, Mesh, MeshBuilder, PointerInfo, StandardMaterial, int } from "@babylonjs/core";
import { TextBlock } from "@babylonjs/gui";
import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";

// Augments the scene with the debug methods
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

import { addLabelToMesh } from "./gui";
import { IPickableMesh, PickableMeshBehaviour } from "./behaviours";

class Pawn implements IPickableMesh {
    public mesh: Mesh;

    constructor(name: string, scene: Scene) {
        this.mesh = MeshBuilder.CreateCapsule(name, { height: 2, radius: 0.5 }, scene);
        this.mesh.position = new Vector3(0, 2 / 2, 0);
        this.mesh.edgesWidth = 2.0;
        this.mesh.edgesColor = Color4.FromColor3(Color3.Black());


        const material = new StandardMaterial(`${name}_material`, scene);
        material.diffuseColor = Color3.White();
        this.mesh.material = material;

        const pickableBehaviour = new PickableMeshBehaviour(`${name}_pickable_behaviour`, scene);
        pickableBehaviour.attach(this);
    }

    onPicked(pointerInfo: PointerInfo): void {
        this.mesh.enableEdgesRendering(0.99);
    }

    onUnpicked = (pointerInfo: PointerInfo): void => {
        this.mesh.disableEdgesRendering();
    };
}

class Grid implements IPickableMesh {
    public gridSize: int;
    public gridSubdivisions: int;
    public mesh: Mesh;
    private label: TextBlock;

    constructor(name: string, scene: Scene, size: int, subdivisions: int) {
        this.gridSize = size;
        this.gridSubdivisions = subdivisions;

        this.mesh = CreateGround(`${name}_ground`, { width: size, height: size, subdivisions: subdivisions }, scene);
        this.mesh.position = new Vector3(0, 0, 0);

        const material = new GridMaterial(`${name}_material`, scene);
        material.gridRatio = 3;
        material.gridRatio = this.gridSize / this.gridSubdivisions;
        this.mesh.material = material;

        this.label = addLabelToMesh(this.mesh, "");

        const pickableBehaviour = new PickableMeshBehaviour(`${name}_pickable_behaviour`, scene);
        pickableBehaviour.attach(this);
    }

    onPicked = (pointerInfo: PointerInfo): void => {
        const pickedPoint = pointerInfo.pickInfo.pickedPoint;
        const localTransform = Matrix.Invert(this.mesh.getWorldMatrix());
        const localPoint = Vector3.TransformCoordinates(pickedPoint, localTransform);
        const gridPosition = this.getGridPosition(localPoint);
        this.label.text = `(${gridPosition.row}, ${gridPosition.column})`;
    };

    onUnpicked = (pointerInfo: PointerInfo): void => {
        this.label.text = "";
    };

    getGridPosition = (localPoint: Vector3): { row: int; column: int } => {
        const cellHeight = this.gridSize / this.gridSubdivisions;

        const normalizedX = localPoint.x + this.gridSize / 2;
        const normalizedZ = localPoint.z + this.gridSize / 2;

        const column = Math.floor(normalizedX / cellHeight);
        const row = Math.floor(normalizedZ / cellHeight);

        const clampedRow = Math.max(0, Math.min(row, this.gridSubdivisions - 1));
        const clampedColumn = Math.max(0, Math.min(column, this.gridSubdivisions - 1));

        return { row: clampedRow, column: clampedColumn };
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
        const camera = new ArcRotateCamera("camera1", -Math.PI / 4, Math.PI / 3, 20, Vector3.Zero(), this.scene);
        camera.setTarget(Vector3.Zero());
        camera.attachControl(this.canvas, true);

        const light = new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);
        light.intensity = 0.9;

        const ground = new Grid("ground1", this.scene, 12, 4);
        const pawn = new Pawn("pawn1", this.scene);

        if (IS_DEVELOPMENT) {
            this.scene.debugLayer.show();
        }
    };

    run = (): void => {
        window.addEventListener("resize", this.onResize);

        if (this.scene.isReady()) {
            this.onIsReady();
        }

        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    };
}

const app = new BabylonApp("renderCanvas").run();
