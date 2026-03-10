// @ts-check

import { blackMetalMaterial, metalMaterial } from "../cade/lib/materials.js";
import {
  cut,
  extrusion,
  fuse,
  multiExtrusion,
  retrieveOperations,
} from "../cade/lib/operations.js";
import { Part } from "../cade/lib/part.js";
import { nx3, ny3, nz3, x3, y3, z3, zero3 } from "../cade/tools/defaults.js";
import { Path } from "../cade/tools/path.js";
import { debugGeometry } from "../cade/tools/svg.js";
import { a2m } from "../cade/tools/transform.js";
import { joinOffset, roundingRadius } from "../dimensions.js";

// TODO: confirm
const controllerWidth = 70;
const controllerThickness = 10;
const controllerLength = 70;

const body = extrusion(
  a2m(),
  controllerThickness,
  Path.makeRect(controllerWidth, controllerLength),
);

export const controller = new Part("controller", body);
// controller.material = blackMetalMaterial;

