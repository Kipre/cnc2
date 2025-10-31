// @ts-check

import { nx3, z3 } from "./cade/lib/defaults.js";
import {
  FlatPart,
} from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { Path } from "./cade/tools/path.js";
import { a2m } from "./cade/tools/transform.js";
import {
  carrierWheelbase,
  roundingRadius,
  woodThickness,
  zRailLength,
} from "./dimensions.js";


export const towerPlate = new FlatPart(
  "tower plate",
  woodThickness,
  Path.makeRoundedRect(carrierWheelbase, zRailLength, roundingRadius),
);

export const tower = new Assembly("tower");
tower.addChild(towerPlate, a2m([-90, -50, 0], nx3, z3));
