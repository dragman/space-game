import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { AbstractMesh, Color3, Color4, Observable, SceneLoader, StandardMaterial } from "@babylonjs/core";
import { IPickableMesh, PickableMeshBehaviour } from "./behaviours";

export class Pawn implements IPickableMesh {
    public mesh: AbstractMesh;
    public selected: boolean;
    public onSelectionObservable: Observable<Pawn>;
    public onDeselectionObservable: Observable<Pawn>;

    constructor(public name: string, public scene: Scene, private file_path: string, private file_name: string) {}

    async init() {
        const assetContainer = await SceneLoader.LoadAssetContainerAsync(this.file_path, this.file_name, this.scene);
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

        const material = new StandardMaterial(`${name}_material`, this.scene);
        material.diffuseColor = Color3.White();
        this.mesh.material = material;

        const canopyMaterial = new StandardMaterial(`${name}_canpoy_material`, this.scene);
        canopyMaterial.diffuseColor = new Color3(0.5, 0.2, 0.5);
        canopyMaterial.specularColor = new Color3(0.8, 0.2, 0.9);
        canopyMaterial.useReflectionFresnelFromSpecular = true;
        canopyMesh.material = canopyMaterial;

        const pickableBehaviour = new PickableMeshBehaviour(`${name}_pickable_behaviour`, this.scene);
        pickableBehaviour.attach(this);

        this.onSelectionObservable = new Observable();
        this.onDeselectionObservable = new Observable();
        assetContainer.addAllToScene();
    }

    static async from_file(name: string, scene: Scene, file_path: string, file_name: string): Promise<Pawn> {
        const instance = new Pawn(name, scene, file_path, file_name);
        await instance.init();
        return instance;
    }

    select = (): void => {
        this.mesh.enableEdgesRendering(0.99);
        if (this.selected !== true) {
            this.selected = true;
            this.onSelectionObservable.notifyObservers(this);
        }
    };

    deselect = (): void => {
        this.mesh.disableEdgesRendering();
        if (this.selected === true) {
            this.selected = false;
            this.onDeselectionObservable.notifyObservers(this);
        }
    };

    onPicked = (_pickedPoint: Vector3): void => {
        this.select();
    };

    onUnpicked(): void {}
    onHover(_pickedPoint: Vector3): void {}
    onUnhover(): void {}
}
