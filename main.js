// @ts-check

import { base } from "./base.js";
import { gantry } from "./gantry.js";
import { Model } from "./cade/lib/lib.js";
import { a2m } from "./cade/tools/transform.js";
import { x3 } from "./cade/lib/defaults.js";

export default 1;

const model = new Model("cnc");
model.addChild(base);
model.addChild(gantry, a2m([0, 400, 180], x3), true);

await model.loadMesh();
await model.watch();
// await bridge.watch();
// await model.export("C:/Users/kipr/Downloads/test.step");

