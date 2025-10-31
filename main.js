// @ts-check

import { base } from "./base.js";
import { x3 } from "./cade/lib/defaults.js";
import { Model } from "./cade/lib/lib.js";
import { a2m } from "./cade/tools/transform.js";
import { gantryPosition, xPosition } from "./dimensions.js";
import { gantry, gantryHalf } from "./gantry.js";
import { tower } from "./tower.js";

export default 1;

const model = new Model("cnc");
model.addChild(base);
model.addChild(gantry, a2m([0, gantryPosition - 50, 180], x3), true);

await model.loadMesh();
await model.watch();
// await model.export("C:/Users/kipr/Downloads/test.step");

