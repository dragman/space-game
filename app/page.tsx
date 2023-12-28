"use client";

import React from "react";
import { Vector3, HemisphericLight, CreateGreasedLine, Mesh, Scene, Color3, StandardMaterial, GreasedLineMeshColorMode, Color4 } from "@babylonjs/core";
import BabylonScene from "../components/BabylonScene";
import "./globals.css";


let box: Mesh;

const makeGrid = (scene: Scene) => {
  const gridSize = 1000;
  const gridSpacing = 1;

  const line = CreateGreasedLine('line', { points: [new Vector3(-gridSize, 0, 0), new Vector3(gridSize, 0, 0)] }, {
    color: new Color3(1, 0, 1),
    sizeAttenuation: false,
    colorMode: GreasedLineMeshColorMode.COLOR_MODE_MULTIPLY,
    width: 0.05,
  });
  line.material!.backFaceCulling = false;

  const lines = [];
  for (let i = -gridSize; i <= gridSize; i += gridSpacing) {
    lines.push([new Vector3(-gridSize, 0, i), new Vector3(gridSize, 0, i)]);
    lines.push([new Vector3(i, 0, -gridSize), new Vector3(i, 0, gridSize)]);
  }

  return CreateGreasedLine('grid', { instance: line, points: lines })
}

const onSceneReady = (scene: Scene) => {
  const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
  scene.clearColor = Color4.FromColor3(Color3.Black())
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.02;
  scene.fogColor = new Color3(0, 0, 0);

  const gridSize = 50;
  const gridSpacing = 1;

  let grid = makeGrid(scene)
};

/**
 * Will run on every frame render.  We are spinning the box on y-axis.
 */
const onRender = (scene: Scene) => {
  if (box !== undefined) {
    const deltaTimeInMillis = scene.getEngine().getDeltaTime();

    const rpm = 10;
    box.rotation.y += (rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
  }
};

export default () => (
  <div>
    <BabylonScene antialias onSceneReady={onSceneReady} onRender={onRender} id="my-canvas" />
  </div>
);