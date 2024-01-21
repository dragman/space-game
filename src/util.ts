import { AbstractMesh } from "@babylonjs/core";

export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function setMeshPropertyRecursively<K extends keyof AbstractMesh>(
    mesh: AbstractMesh,
    property: K,
    value: AbstractMesh[K],
    predicate: (mesh: AbstractMesh) => boolean = () => true,
    predicateShortCircuit: boolean = false
): void {
    if (predicate(mesh)) {
        mesh[property] = value;
        if (predicateShortCircuit) {
            return;
        }
    }

    const childMeshes = mesh.getChildMeshes();
    childMeshes.forEach((child) => {
        if (predicate(child)) {
            setMeshPropertyRecursively(child, property, value, predicate);
        }
    });
}
