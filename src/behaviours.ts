import { Scene } from "@babylonjs/core/scene";
import { Behavior, Mesh, PointerEventTypes, PointerInfo } from "@babylonjs/core";

export interface IPickableMesh {
    mesh: Mesh;
    onPicked(pointerInfo: PointerInfo): void;
    onUnpicked(pointerInfo: PointerInfo): void;
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
                if (pointerInfo.pickInfo.pickedMesh === this.pickable.mesh) {
                    this.pickable.onPicked(pointerInfo);
                } else {
                    this.pickable.onUnpicked(pointerInfo);
                }
                break;
            default:
                break;
        }
    };
}
