import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { Scene } from '@babylonjs/core/scene';

import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial';

// Augments the scene with the debug methods
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

import { addLabelToMesh } from "./gui";

const canvas_ = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine_ = new Engine(canvas_);
const scene_ = new Scene(engine_);

const onResize = () => {
    engine_.resize();
}

const onIsReady = async (scene: Scene): Promise<void> => {
    const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);
    camera.setTarget(Vector3.Zero());
    camera.attachControl(canvas_, true);

    const light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    const material = new GridMaterial("grid", scene);

    const sphere = CreateSphere('sphere1', { segments: 16, diameter: 2 }, scene);
    sphere.position.y = 1;
    sphere.material = material;

    addLabelToMesh(sphere);

    const ground = CreateGround('ground1', { width: 6, height: 6, subdivisions: 2 }, scene);
    ground.material = material;

    if (IS_DEVELOPMENT) {
        scene.debugLayer.show();
    }
}

window.addEventListener("resize", onResize);

if (scene_.isReady()) {
    onIsReady(scene_);
}

engine_.runRenderLoop(() => {
    scene_.render();
});
