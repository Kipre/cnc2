// @ts-check
/** @import * as types from './cade/tools/types' */

import { railToScrewPlacement, washerUnderRail } from "./assemblyInvariants.js";
import {
  boltThreadedSubpartToFlatPart,
  clearBoltOnFlatPart,
  fastenSubpartToFlatPart,
  fastenSubpartToFlatPartEdge,
} from "./cade/lib/fastening.js";
import {
  FlatPart,
  getFacePlacement,
  joinParts,
  spindleCleared2LineTo,
} from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { ShelfMaker } from "./cade/lib/shelf.js";
import {
  CenterDrawerSlot,
  TenonMortise,
  TroughAngleSupport,
} from "./cade/lib/slots.js";
import { locateOriginOnFlatPart } from "./cade/lib/utils.js";
import {
  nx2,
  nx3,
  ny2,
  nz3,
  x2,
  x3,
  y2,
  y3,
  z3,
  zero2,
  zero3,
} from "./cade/tools/defaults.js";
import { Path } from "./cade/tools/path.js";
import {
  a2m,
  locateWithConstraints,
  transformPoint3,
} from "./cade/tools/transform.js";
import {
  aluExtrusionHeight,
  aluExtrusionThickness,
  carrierWheelbase,
  defaultSpindleSize,
  interFlatRail,
  joinOffset,
  motorSupportWidth,
  roundingRadius,
  woodThickness,
  zRailLength,
} from "./dimensions.js";
import {
  CylinderNutFastener,
  getFastenerKit,
  getHexAndBarrelNut,
} from "./fasteners.js";
import {
  flatChariot,
  flatChariotHolesIterator,
  flatChariotLength,
  flatChariotWidth,
  flatRailHolesIterator,
  flatRailTotalHeight,
  shortFlatRail,
} from "./flatRails.js";
import { motorCenteringHole, motorHolesGetter, nema23 } from "./motor.js";
import {
  baseSurfaceToRollerSurface,
  bf12,
  bk12,
  bkfHoleFinder,
  bkfTopHoleFinder,
  bkfTwoHoleFinder,
  roller,
  rollerContactSurface,
  rollerHoleFinder,
  rollerThickness,
  screwAssy,
  shaftY,
  shortScrewAssy,
} from "./screw.js";

const tm = (x) => new TenonMortise(x);
const cnf = (x) => new CylinderNutFastener(x);

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
