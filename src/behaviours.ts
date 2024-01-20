import { Scene } from "@babylonjs/core/scene";
import { AbstractMesh, Behavior, Matrix, PointerEventTypes, PointerInfo, Vector3 } from "@babylonjs/core";

export interface IPickableMesh {
    mesh: AbstractMesh;
    onPicked(pickedPoint: Vector3): void;
    onUnpicked(): void;
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
        const isThisMesh = pointerInfo.pickInfo.pickedMesh === this.pickable.mesh;
        const pickedPoint = pointerInfo.pickInfo.pickedPoint;
        const hoveredPoint = this.rayHitsMesh();

        switch (pointerInfo.type) {
            case PointerEventTypes.POINTERPICK:
                if (isThisMesh) {
                    this.pickable.onPicked(pickedPoint);
                } else {
                    this.pickable.onUnpicked();
                }
                break;

            case PointerEventTypes.POINTERMOVE:
                if (hoveredPoint) {
                    this.pickable.onHover(hoveredPoint);
                } else {
                    this.pickable.onUnhover();
                }
                break;
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
