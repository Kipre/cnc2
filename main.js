// @ts-check

import { base } from "./base.js";
// import { box } from "./box.js";
// import { box } from "./test.js";
import { Model } from "./cade/lib/lib.js";
import {
  gantryPosition,
  tunnelWidth,
  woodThickness,
  yRailLength,
} from "./dimensions.js";
import { gantry, top } from "./gantry.js";
import { chariot, yRail } from "./rails.js";
import { makeChain } from "./cableChain.js";
import { a2m, atm3 } from "./cade/tools/transform.js";
import { nz3, y3, z3, zero3 } from "./cade/lib/defaults.js";
import { secondTunnelJoin } from "./woodenBase.js";

export default 1;

const model = new Model("cnc");
model.addChild(base);
// model.addChild(box);

const gantryPlacement = model
  .findChild(yRail)
  .placement.multiply(gantry.findChild(chariot).placement.inverse());

model.addChild(gantry, gantryPlacement.translate(gantryPosition), true);

const topPlacement = model.findChild(top).placement;
const botPlacement = model.findChild(secondTunnelJoin).placement;
const diffVector = atm3(botPlacement.inverse().multiply(topPlacement), zero3);
const height = -diffVector[2];
const offcenter = 200;
const diff = diffVector[0] - 470 - offcenter;

console.log(diffVector);

model.addChild(
  makeChain(diff, height + woodThickness, 500),
  base
    .findChild(secondTunnelJoin)
    .placement.multiply(
      a2m([yRailLength / 2 + offcenter, tunnelWidth + 4 * woodThickness, 0], nz3),
    ),
);

await model.loadMesh();
await model.watch();
// await model.export("C:/Users/kipr/Downloads/test.step");
// await model.project("C:/Users/kipr/Downloads/test.step");
