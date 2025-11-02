// @ts-check

import { base } from "./base.js";
import { Model } from "./cade/lib/lib.js";
import { gantryPosition } from "./dimensions.js";
import { gantry } from "./gantry.js";
import { chariot, yRail } from "./rails.js";

export default 1;

const model = new Model("cnc");
model.addChild(base);

const gantryPlacement = model
  .findChild(yRail)
  .placement.multiply(gantry.findChild(chariot).placement.inverse());

model.addChild(gantry, gantryPlacement.translate(gantryPosition), true);

await model.loadMesh();
await model.watch();
// await model.export("C:/Users/kipr/Downloads/test.step");
