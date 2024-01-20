import { Scene } from "@babylonjs/core/scene";
import { AbstractMesh, Behavior, Matrix, PointerEventTypes, PointerInfo, Vector3 } from "@babylonjs/core";
import { log } from "./gui";

export interface IPickableMesh {
    mesh: AbstractMesh;
    onPicked(pickedPoint: Vector3): void;
    onUnpicked(pickedPoint: Vector3): void;
    onHover(hoveredPoint: Vector3): void;
    onUnhover(): void;
}

export class PickableMeshBehaviour implements Behavior<IPickableMesh> {
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

    private onPointerPick = (pointerInfo: PointerInfo): void => {
        switch (pointerInfo.type) {
            case PointerEventTypes.POINTERPICK:
                const isThisMesh = pointerInfo.pickInfo.pickedMesh === this.pickable.mesh;
                const pickedPoint = pointerInfo.pickInfo.pickedPoint;
                if (isThisMesh) {
                    this.pickable.onPicked(pickedPoint);
                } else {
                    this.pickable.onUnpicked(pickedPoint);
                }
                break;

            case PointerEventTypes.POINTERMOVE:
                const hoveredPoint = this.rayHitsMesh();
                if (hoveredPoint) {
                    this.pickable.onHover(hoveredPoint);
                } else {
                    this.pickable.onUnhover();
                }
            default:
                break;
        }
    };

    private rayHitsMesh = (): Vector3 | null => {
        const ray = this.scene.createPickingRay(
            this.scene.pointerX,
            this.scene.pointerY,
            Matrix.Identity(),
            this.scene.activeCamera
        );
        const hit = this.scene.pickWithRay(ray);
        if (hit.pickedMesh === this.pickable.mesh) {
            return hit.pickedPoint;
        }
        return null;
    };
}
