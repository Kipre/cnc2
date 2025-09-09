// @ts-check

import { base } from "./base.js";
import { Model } from "./cade/lib/lib.js";
import { bridge } from "./woodenBase.js";

export default 1;

const model = new Model("cnc");
model.addChild(base);

await model.loadMesh();
await model.watch();
// await bridge.watch();
// await model.export("C:/Users/kipr/Downloads/test.step");
