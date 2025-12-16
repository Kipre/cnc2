// @ts-check
/** @import * as types from './cade/tools/types' */

import {
  FlatPart,
} from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import {
  nx3,
  y3,
  z3,
  zero3,
} from "./cade/tools/defaults.js";
import { Path } from "./cade/tools/path.js";
import {
  a2m,
} from "./cade/tools/transform.js";
import {
  carrierWheelbase,
  woodThickness,
} from "./dimensions.js";
import {
  flatChariot,
  flatChariotLength,
  flatChariotWidth,
  flatRailTotalHeight,
} from "./flatRails.js";

export const plate = new FlatPart(
  "head plate",
  woodThickness,
  Path.makeRect(carrierWheelbase, carrierWheelbase).recenter({ onlyX: true }),
);

export const head = new Assembly("head");
const headPlatePlacement = a2m(zero3, nx3, z3);
const locatedFrontPlate = head.addChild(plate, headPlatePlacement);

const interChariot = carrierWheelbase;
for (const x of [-interChariot / 2, interChariot / 2 - flatChariotLength]) {
  for (const y of [flatChariotWidth / 2, carrierWheelbase- flatChariotWidth / 2]) {
    head.addChild(flatChariot, a2m([flatRailTotalHeight, y, x], z3, y3));
  }
}
