import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { Scene } from "@babylonjs/core/scene";
import {
    AbstractMesh,
    Animation,
    AssetContainer,
    BackEase,
    Color3,
    Color4,
    EasingFunction,
    IAnimationKey,
    Mesh,
    MeshBuilder,
    Observable,
    PointerInfo,
    SceneLoader,
    StandardMaterial,
    int,
} from "@babylonjs/core";
import { TextBlock } from "@babylonjs/gui";
import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";
import "@babylonjs/loaders/glTF";

async function loadDebugModuleIfNeeded() {
    // Augments the scene with the debug methods
    await import("@babylonjs/core/Debug/debugLayer");
    await import("@babylonjs/inspector");
}

import { addLabelToMesh } from "./gui";
import { IPickableMesh, PickableMeshBehaviour } from "./behaviours";

let baseUrl = "";
if (!IS_DEVELOPMENT) {
    baseUrl = "public/";
}

let assetContainer: AssetContainer;

enum GameState {
    Plan,
    Resolve,
}

interface GameStateTransition {
    fromState: GameState;
    toState: GameState;
}

class GameStateMachine {
    public currentState: GameState;
    public onGameStateTransitionObservable: Observable<GameStateTransition>;

    constructor(initialState?: GameState) {
        this.currentState = initialState ?? GameState.Plan;
        this.onGameStateTransitionObservable = new Observable();
    }

    changeState = (targetState: GameState): void => {
        if (targetState === this.currentState) {
            throw new Error(`We're already in ${GameState[this.currentState]} state!`);
        }
        this.onGameStateTransitionObservable.notifyObservers({ fromState: this.currentState, toState: targetState });
    };
}

class Mover {
    private trackedPawns: Pawn[];
    constructor(public scene: Scene, public grid: Grid) {
        this.trackedPawns = [];
    }

    trackPawns = (...pawns: Pawn[]): void => {
        pawns.forEach((pawn) => {
            pawn.onSelectionObservable.add(this.onPawnSelected);
        });
        this.trackedPawns.push(...pawns);
    };

    onPawnSelected = (selectedPawn: Pawn): void => {
        this.grid.onGridPositionSelectedObservable.addOnce((gridPosition: GridPosition) => {
            const targetPosition = new Vector3(
                gridPosition.normalisedWorldPosition.x,
                selectedPawn.mesh.position.y,
                gridPosition.normalisedWorldPosition.z
            );

            // Put a simple cheeky animation in.
            const frameRate = 60;
            const easingFunction = new BackEase(0.5);
            easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
            const moveAnimation = new Animation("movePawn", "position", frameRate, Animation.ANIMATIONTYPE_VECTOR3);
            const moveAnimationKeys: IAnimationKey[] = [
                { frame: 0, value: selectedPawn.mesh.position, easingFunction: easingFunction },
                { frame: 1 * frameRate, value: targetPosition, easingFunction: easingFunction },
            ];
            moveAnimation.setKeys(moveAnimationKeys);

            const forward = selectedPawn.mesh.position.subtract(targetPosition).normalize();
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
                { frame: 0, value: selectedPawn.mesh.rotationQuaternion, easingFunction: easingFunction },
                { frame: 1 * frameRate, value: targetQuaternion, easingFunction: easingFunction },
            ];
            rotateAnimation.setKeys(rotateAnimationKeys);

            this.scene.beginDirectAnimation(
                selectedPawn.mesh,
                [rotateAnimation],
                0,
                1 * frameRate,
                undefined,
                undefined,
                (): void => {
                    this.scene.beginDirectAnimation(selectedPawn.mesh, [moveAnimation], 0, 1 * frameRate);
                }
            );
        });
    };
}

class Pawn implements IPickableMesh {
    public mesh: AbstractMesh;
    public selected: boolean;
    public onSelectionObservable: Observable<Pawn>;

    constructor(name: string, scene: Scene) {
        // this.mesh = MeshBuilder.CreateCapsule(name, { height: 2, radius: 0.5 }, scene);
        let rootMesh = assetContainer.meshes.find((mesh) => mesh.name === "__root__");
        const childMeshes = rootMesh.getChildMeshes(true);
        const boundingMesh = childMeshes.find((x) => x.name == "BoundingBox");
        const canopyMesh = childMeshes.find((x) => x.name == "Canopy");
        childMeshes.forEach((child_mesh) => {
            if (child_mesh !== boundingMesh) {
                child_mesh.setParent(boundingMesh);
                child_mesh.isPickable = false;
            }
        });
        rootMesh.dispose(true);
        rootMesh = boundingMesh;
        rootMesh.visibility = 0.0001;
        rootMesh.isPickable = true;
        rootMesh.name = `${name}_root`;
        this.mesh = rootMesh;

        this.mesh.scaling = new Vector3(0.25, 0.25, 0.25);
        this.mesh.position = new Vector3(0, 2 / 2, 0);
        this.mesh.edgesWidth = 2.0;
        this.mesh.edgesColor = Color4.FromColor3(Color3.Green());

        const material = new StandardMaterial(`${name}_material`, scene);
        material.diffuseColor = Color3.White();
        this.mesh.material = material;

        const canopyMaterial = new StandardMaterial(`${name}_canpoy_material`, scene);
        canopyMaterial.diffuseColor = new Color3(0.5, 0.2, 0.5);
        canopyMaterial.specularColor = new Color3(0.8, 0.2, 0.9);
        canopyMaterial.useReflectionFresnelFromSpecular = true;
        canopyMesh.material = canopyMaterial;

        const pickableBehaviour = new PickableMeshBehaviour(`${name}_pickable_behaviour`, scene);
        pickableBehaviour.attach(this);

        this.onSelectionObservable = new Observable();
        assetContainer.addAllToScene();
    }

    onPicked = (pointerInfo: PointerInfo): void => {
        this.mesh.enableEdgesRendering(0.99);
        if (this.selected !== true) {
            this.selected = true;
            this.onSelectionObservable.notifyObservers(this);
        }
    };

    onUnpicked = (pointerInfo: PointerInfo): void => {
        this.mesh.disableEdgesRendering();
        if (this.selected === true) {
            this.selected = false;
        }
    };
}

interface GridPosition {
    column: int;
    row: int;
    worldPosition: Vector3;
    normalisedWorldPosition: Vector3;
    localPosition: Vector3;
}

class Grid implements IPickableMesh {
    public gridSize: int;
    public gridSubdivisions: int;
    public mesh: Mesh;
    public onGridPositionSelectedObservable: Observable<GridPosition>;
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

        this.onGridPositionSelectedObservable = new Observable();
    }

    onPicked = (pointerInfo: PointerInfo): void => {
        const pickedPoint = pointerInfo.pickInfo.pickedPoint;
        const worldMatrix = this.mesh.getWorldMatrix();
        const localTransform = Matrix.Invert(worldMatrix);
        const localPoint = Vector3.TransformCoordinates(pickedPoint, localTransform);
        const gridPosition = this.getGridPosition(localPoint);
        const normalisedLocalPosition = new Vector3(gridPosition.x, this.mesh.position.y, gridPosition.z);
        const normalisedWorldPosition = Vector3.TransformCoordinates(normalisedLocalPosition, worldMatrix);
        this.label.text = `(${gridPosition.row}, ${gridPosition.column})`;
        this.onGridPositionSelectedObservable.notifyObservers({
            column: gridPosition.column,
            row: gridPosition.row,
            worldPosition: pickedPoint,
            normalisedWorldPosition: normalisedWorldPosition,
            localPosition: localPoint,
        });
    };

    onUnpicked = (pointerInfo: PointerInfo): void => {
        this.label.text = "";
    };

    getGridPosition = (localPoint: Vector3): { row: int; column: int; x: number; z: number } => {
        const cellHeight = this.gridSize / this.gridSubdivisions;

        const normalizedX = localPoint.x + this.gridSize / 2;
        const normalizedZ = localPoint.z + this.gridSize / 2;

        const column = Math.floor(normalizedX / cellHeight);
        const row = Math.floor(normalizedZ / cellHeight);

        const clampedRow = Math.max(0, Math.min(row, this.gridSubdivisions - 1));
        const clampedColumn = Math.max(0, Math.min(column, this.gridSubdivisions - 1));

        const x = column * cellHeight + cellHeight / 2 - this.gridSize / 2;
        const z = row * cellHeight + cellHeight / 2 - this.gridSize / 2;

        return { row: clampedRow, column: clampedColumn, x: x, z: z };
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
        this.scene.clearColor = Color4.FromColor3(new Color3(0.05, 0.05, 0.1));
        const camera = new ArcRotateCamera("camera1", -Math.PI / 4, Math.PI / 3, 20, Vector3.Zero(), this.scene);
        camera.setTarget(Vector3.Zero());
        camera.attachControl(this.canvas, true);

        const light = new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);
        light.intensity = 0.9;

        const grid = new Grid("grid1", this.scene, 12, 4);

        assetContainer = await SceneLoader.LoadAssetContainerAsync(`${baseUrl}models/`, "ship1.glb", this.scene);

        const pawn = new Pawn("pawn1", this.scene);

        const stateMachine = new GameStateMachine(GameState.Plan);
        const mover = new Mover(this.scene, grid);
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
