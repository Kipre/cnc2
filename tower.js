// @ts-check

import { nx3, ny3, nz3, x3, y3, z3, zero3 } from "./cade/lib/defaults.js";
import { FlatPart } from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { Path } from "./cade/tools/path.js";
import { a2m } from "./cade/tools/transform.js";
import {
  carrierWheelbase,
  interFlatRail,
  roundingRadius,
  woodThickness,
  zRailLength,
} from "./dimensions.js";
import {
  flatChariot,
  flatChariotHolesIterator,
  flatChariotLength,
  flatChariotWidth,
  flatRailTotalHeight,
} from "./flatRails.js";
import { boltThreadedSubpartToFlatPart } from "./rails.js";

export const towerPlate = new FlatPart(
  "tower plate",
  woodThickness,
  Path.makeRoundedRect(carrierWheelbase, zRailLength, roundingRadius),
);

export const towerBottomToRail =  woodThickness;
export const tower = new Assembly("tower");
// tower.addChild(towerPlate, a2m([-90 - 1 - flatRailTotalHeight, -50, 0], nx3, z3));
tower.addChild(towerPlate, a2m(zero3, nx3, z3));

for (const x of [0, carrierWheelbase - flatChariotLength]) {
  for (const y of [0, interFlatRail]) {
    tower.addChild(
      flatChariot,
      a2m(
        [flatRailTotalHeight, 50 + flatChariotWidth / 2 + y, x],
        z3,
        y3,
      ),
    );
  }
}

boltThreadedSubpartToFlatPart(
  tower,
  flatChariot,
  towerPlate,
  flatChariotHolesIterator,
);
