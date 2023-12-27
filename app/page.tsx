"use client";

import React from "react";
import { Vector3, HemisphericLight, CreateLineSystem, Mesh, Scene } from "@babylonjs/core";
import BabylonScene from "../components/BabylonScene";
import "./globals.css";


let box: Mesh;

const onSceneReady = (scene: Scene) => {
  const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
  
  const gridSize = 50;
  const gridSpacing = 1;
  
  const lines = [];
  for (let i = -gridSize; i <= gridSize; i += gridSpacing) {
    lines.push([new Vector3(-gridSize, 0, i), new Vector3(gridSize, 0, i)]);
    lines.push([new Vector3(i, 0, -gridSize), new Vector3(i, 0, gridSize)]);
  }
  
  let grid = CreateLineSystem('grid', { lines: lines, }, scene);
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