// @ts-check

import { metalMaterial } from "./cade/lib/materials.js";
import { extrusion } from "./cade/lib/operations.js";
import { Part } from "./cade/lib/part.js";
import { Path } from "./cade/tools/path.js";
import { a2m } from "./cade/tools/transform.js";
import {
  aluExtrusionHeight,
  aluExtrusionLength,
  aluExtrusionThickness,
} from "./dimensions.js";

export const aluExtrusion = new Part(
  "alu extrusion",
  extrusion(
    a2m(),
    aluExtrusionLength,
    Path.makeRoundedRect(aluExtrusionThickness, aluExtrusionHeight, 3),
  ),
);
aluExtrusion.material = metalMaterial;
