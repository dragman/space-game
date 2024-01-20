import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { Scene } from "@babylonjs/core/scene";
import { AbstractMesh, Color3, Mesh, Observable, StandardMaterial, int } from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";
import { log } from "./gui";
import { IPickableMesh, PickableMeshBehaviour } from "./behaviours";

export class Grid implements IPickableMesh {
    public gridSize: int;
    public gridSubdivisions: int;
    public mesh: Mesh;
    public onGridPositionSelectedObservable: Observable<GridPosition>;

    private highlightMesh: AbstractMesh;

    constructor(name: string, scene: Scene, size: int, subdivisions: int) {
        this.gridSize = size;
        this.gridSubdivisions = subdivisions;

        this.mesh = CreateGround(`${name}_ground`, { width: size, height: size, subdivisions: subdivisions }, scene);
        this.mesh.position = new Vector3(0, 0, 0);

        const material = new GridMaterial(`${name}_material`, scene);
        const subdivisionSize = this.gridSize / this.gridSubdivisions;
        material.gridRatio = subdivisionSize;
        this.mesh.material = material;

        const pickableBehaviour = new PickableMeshBehaviour(`${name}_pickable_behaviour`, scene);
        pickableBehaviour.attach(this);

        this.onGridPositionSelectedObservable = new Observable();

        this.highlightMesh = this.makeHighlightMesh(scene, subdivisionSize);
    }

    private makeHighlightMesh(scene: Scene, subdivisionSize: number): AbstractMesh {
        const mesh = CreateGround(
            `${this.mesh.name}_highlight`,
            { width: subdivisionSize, height: subdivisionSize },
            scene
        );
        mesh.visibility = 0;
        mesh.position = new Vector3(0, 0, 0);
        mesh.isPickable = false;
        const material = new StandardMaterial(`${mesh.name}_material`, scene);
        material.alpha = 0.5;
        material.diffuseColor = Color3.Green();
        mesh.material = material;
        return mesh;
    }

    onPicked = (pickedPoint: Vector3): void => {
        const gridPosition = this.getGridPosition(pickedPoint);
        log(`Picked grid: (${gridPosition.row}, ${gridPosition.column})`);
        this.onGridPositionSelectedObservable.notifyObservers(gridPosition);
    };

    onUnpicked(): void {}

    onHover(pickedPoint: Vector3): void {
        const gridPosition = this.getGridPosition(pickedPoint);
        this.highlightMesh.position = new Vector3(
            gridPosition.normalisedWorldPosition.x,
            gridPosition.normalisedWorldPosition.y + 0.01,
            gridPosition.normalisedWorldPosition.z
        );
        this.highlightMesh.visibility = 1;
    }

    onUnhover(): void {
        this.highlightMesh.visibility = 0;
    }

    getGridCoordinates = (localPoint: Vector3): { row: int; column: int; x: number; z: number } => {
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

    getGridPosition = (worldPoint: Vector3): GridPosition => {
        const worldMatrix = this.mesh.getWorldMatrix();
        const localTransform = Matrix.Invert(worldMatrix);
        const localPoint = Vector3.TransformCoordinates(worldPoint, localTransform);
        const gridCoords = this.getGridCoordinates(localPoint);
        const normalisedLocalPosition = new Vector3(gridCoords.x, this.mesh.position.y, gridCoords.z);
        const normalisedWorldPosition = Vector3.TransformCoordinates(normalisedLocalPosition, worldMatrix);
        return {
            column: gridCoords.column,
            row: gridCoords.row,
            worldPosition: worldPoint,
            normalisedWorldPosition: normalisedWorldPosition,
            localPosition: localPoint,
        };
    };
}
export interface GridPosition {
    column: int;
    row: int;
    worldPosition: Vector3;
    normalisedWorldPosition: Vector3;
    localPosition: Vector3;
}
