import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import {
    AbstractMesh,
    AssetContainer,
    Color3,
    Color4,
    Observable,
    SceneLoader,
    StandardMaterial,
} from "@babylonjs/core";
import { IPickableMesh, PickableMeshBehaviour } from "./behaviours";
import { setMeshPropertyRecursively } from "./util";

export class PawnGhost {
    public mesh: AbstractMesh;

    constructor(other_mesh: AbstractMesh) {
        this.mesh = other_mesh.clone(`${other_mesh.name}_ghost`, null);
        this.mesh.isPickable = false;
        this.hide();
    }

    show(): void {
        setMeshPropertyRecursively(this.mesh, "visibility", 1.0, (mesh) => mesh.name !== this.mesh.name);
    }

    hide(): void {
        setMeshPropertyRecursively(this.mesh, "visibility", 0.0, (mesh) => mesh.name !== this.mesh.name);
    }
}

export class Pawn implements IPickableMesh {
    public mesh: AbstractMesh;
    public selected: boolean;
    public onSelectionObservable: Observable<Pawn>;
    public onDeselectionObservable: Observable<Pawn>;
    public ghost: PawnGhost;

    constructor(public name: string, public scene: Scene, private file_path: string, private file_name: string) {
        this.onSelectionObservable = new Observable();
        this.onDeselectionObservable = new Observable();
    }

    async init(): Promise<void> {
        const assetContainer = await SceneLoader.LoadAssetContainerAsync(this.file_path, this.file_name, this.scene);
        this.mesh = this.make_mesh(assetContainer);
        const pickableBehaviour = new PickableMeshBehaviour(`${this.name}_pickable_behaviour`, this.scene);
        pickableBehaviour.attach(this);

        this.ghost = new PawnGhost(this.mesh);
    }

    make_mesh = (assetContainer: AssetContainer): AbstractMesh => {
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
        rootMesh.name = `${this.name}_root`;
        const mesh = rootMesh;

        mesh.scaling = new Vector3(0.25, 0.25, 0.25);
        mesh.position = new Vector3(0, 1, 0);
        mesh.edgesWidth = 2.0;
        mesh.edgesColor = Color4.FromColor3(Color3.Green());

        const material = new StandardMaterial(`${this.name}_material`, this.scene);
        material.diffuseColor = Color3.White();
        mesh.material = material;

        const canopyMaterial = new StandardMaterial(`${this.name}_canpoy_material`, this.scene);
        canopyMaterial.diffuseColor = new Color3(0.5, 0.2, 0.5);
        canopyMaterial.specularColor = new Color3(0.8, 0.2, 0.9);
        canopyMaterial.useReflectionFresnelFromSpecular = true;
        canopyMesh.material = canopyMaterial;

        assetContainer.addAllToScene();
        return mesh;
    };

    static async from_file(name: string, scene: Scene, file_path: string, file_name: string): Promise<Pawn> {
        const instance = new Pawn(name, scene, file_path, file_name);
        await instance.init();
        return instance;
    }

    select = async (): Promise<void> => {
        this.mesh.enableEdgesRendering(0.9);
        if (this.selected !== true) {
            this.ghost.show();
            this.selected = true;
            this.onSelectionObservable.notifyObservers(this);
        }
    };

    deselect = (): void => {
        this.mesh.disableEdgesRendering();
        if (this.selected === true) {
            this.ghost.hide();
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
