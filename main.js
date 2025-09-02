import { base } from "./base.js";
import { Model } from "./cade/lib/lib.js";

export default 1;

const model = new Model("cnc");
model.addChild(base);

await model.loadMesh();
await model.watch();
