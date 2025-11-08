// @ts-check
/** @import * as types from './cade/tools/types' */

import { railToScrewPlacement } from "./assemblyInvariants.js";
import {
  FlatPart,
  getFacePlacement,
  joinParts,
} from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { CenterDrawerSlot, TenonMortise } from "./cade/lib/slots.js";
import {
  nx3,
  nz3,
  x2,
  y2,
  y3,
  z3,
  zero2,
  zero3,
} from "./cade/tools/defaults.js";
import { Path } from "./cade/tools/path.js";
import { debugGeometry } from "./cade/tools/svg.js";
import {
  a2m,
  locateWithConstraints,
  transformPoint3,
} from "./cade/tools/transform.js";
import {
  aluExtrusionHeight,
  aluExtrusionThickness,
  carrierWheelbase,
  interFlatRail,
  joinOffset,
  motorSupportWidth,
  roundingRadius,
  woodThickness,
  zRailLength,
} from "./dimensions.js";
import { CylinderNutFastener } from "./fasteners.js";
import {
  flatChariot,
  flatChariotHolesIterator,
  flatChariotLength,
  flatChariotWidth,
  flatRailTotalHeight,
} from "./flatRails.js";
import { nema23 } from "./motor.js";
import { boltThreadedSubpartToFlatPart } from "./rails.js";
import {
  bf12,
  roller,
  rollerContactSurface,
  rollerHoleFinder,
  rollerThickness,
  shaftY,
  shortScrewAssy,
} from "./screw.js";
import { makeShelfOnPlane, ShelfMaker } from "./cade/lib/shelf.js";

const tm = (x) => new TenonMortise(x);
const cnf = (x) => new CylinderNutFastener(x);

export const frontPlate = new FlatPart(
  "tower plate",
  woodThickness,
  Path.makeRect(carrierWheelbase, zRailLength, roundingRadius).recenter({
    onlyX: true,
  }),
);

export const towerBottomToRail = woodThickness;
export const tower = new Assembly("tower");
const towerPlatePlacement = a2m(zero3, nx3, z3);
const locatedFrontPlate = tower.addChild(frontPlate, towerPlatePlacement);

const interChariot = carrierWheelbase;
const bottomHang = 5 + woodThickness;
for (const x of [-interChariot / 2, interChariot / 2 - flatChariotLength]) {
  for (const y of [0, interFlatRail]) {
    tower.addChild(
      flatChariot,
      a2m(
        [flatRailTotalHeight, bottomHang + flatChariotWidth / 2 + y, x],
        z3,
        y3,
      ),
    );
  }
}

boltThreadedSubpartToFlatPart(
  tower,
  flatChariot,
  frontPlate,
  flatChariotHolesIterator,
);

const backPlateWidth = 100;
const backPlate = new FlatPart(
  "tower back plate",
  woodThickness,
  Path.makeRect(
    backPlateWidth,
    aluExtrusionHeight * 1.5,
    roundingRadius,
  ).recenter({
    onlyX: true,
  }),
);

const plateToPlate =
  shaftY +
  rollerThickness / 2 +
  aluExtrusionThickness +
  1 +
  flatRailTotalHeight +
  woodThickness;

const backplatePlacement = towerPlatePlacement.translate(0, 0, -plateToPlate);
tower.addChild(backPlate, backplatePlacement);

function otherSide(placement, other = false) {
  return placement.multiply(a2m([0, 0, woodThickness], other ? nz3 : z3));
}

const screwAxisPlacement = tower
  .findChild(flatChariot)
  .placement.multiply(railToScrewPlacement);
const screwPoint = transformPoint3(screwAxisPlacement, zero3);

const rollerPlacement = otherSide(backplatePlacement, true)
  .translate(0, -screwPoint[1])
  .multiply(rollerContactSurface.rotate(90).inverse());

tower.addChild(roller, rollerPlacement);
boltThreadedSubpartToFlatPart(tower, roller, backPlate, rollerHoleFinder);

const bottomPlateLocation = a2m([0, 1, 0], y3);
const joinPath = makeShelfOnPlane(
  bottomPlateLocation,
  { woodThickness, joinOffset },
  tower.findChild(frontPlate),
  tower.findChild(backPlate),
);
const bottom = new FlatPart("tower bottom join", woodThickness, joinPath);

const centeredBolt = [cnf(0.5)];
const triple = [cnf(0.8), tm(0.5), cnf(0.2)];

tower.addChild(bottom, bottomPlateLocation);
joinParts(tower, bottom, backPlate, [
  cnf(0.8),
  new CenterDrawerSlot(0.5),
  cnf(0.2),
]);
joinParts(tower, backPlate, bottom, centeredBolt);

joinParts(tower, bottom, frontPlate, [
  cnf(0.1),
  new CenterDrawerSlot(0.3, true),
  cnf(0.5),
  new CenterDrawerSlot(0.7, true),
  cnf(0.9),
]);
joinParts(tower, frontPlate, bottom, centeredBolt, centeredBolt);

const middleJoinLocation = a2m([0, aluExtrusionHeight + bottomHang + 5, 0], y3);
const middlePlatePath = makeShelfOnPlane(
  middleJoinLocation,
  { woodThickness, joinOffset },
  tower.findChild(frontPlate),
  tower.findChild(backPlate),
);
const middle = new FlatPart(
  "tower middle join",
  woodThickness,
  middlePlatePath,
);
tower.addChild(middle, middleJoinLocation);
joinParts(tower, middle, frontPlate, triple);
joinParts(tower, middle, backPlate, triple);

const topPlacement = towerPlatePlacement
  .multiply(getFacePlacement(frontPlate, zero2, x2))
  .translate(0, -woodThickness - motorSupportWidth);

const top = new FlatPart(
  "top tower plate",
  woodThickness,
  Path.makeRect(carrierWheelbase, 50 + woodThickness + motorSupportWidth),
);
tower.addChild(top, topPlacement);

const locatedBackPlate = tower.findChild(backPlate);
const rightsidePlacement = getFacePlacement(backPlate, zero2, y2);
const rightSupportPlacement =
  locatedBackPlate.placement.multiply(rightsidePlacement);

const verticalAngle = new ShelfMaker(rightSupportPlacement, { woodThickness, zoneIndex: 1 })
  .addFlatPart(locatedFrontPlate)
  .addFlatPart(locatedBackPlate)
  .addFlatPart(tower.findChild(middle))
  .addFlatPart(tower.findChild(top))
  .makeLegacy();

const rightSideSupport = new FlatPart(
  "vertical support join",
  woodThickness,
  verticalAngle,
);
const leftSideSupport = rightSideSupport.clone();
tower.addChild(rightSideSupport, rightSupportPlacement);
tower.addChild(
  leftSideSupport,
  rightSupportPlacement.translate(0, 0, -backPlateWidth - woodThickness),
);

for (const part of [rightSideSupport, leftSideSupport]) {
  joinParts(tower, part, frontPlate, triple);
  joinParts(tower, backPlate, part, centeredBolt);
}

const screwPlacement = locateWithConstraints(
  {
    from: shortScrewAssy.findChild(nema23).placement,
    to: otherSide(topPlacement),
  },
  {
    from: shortScrewAssy.findChild(bf12).placement,
    to: otherSide(towerPlatePlacement),
  },
);

tower.addChild(shortScrewAssy, screwPlacement);

const minimalTop = new ShelfMaker(topPlacement, { woodThickness })
  .addFlatPart(locatedFrontPlate)
  .addFlatPart(tower.findChild(rightSideSupport))
  .addFlatPart(tower.findChild(leftSideSupport))
  .addFeature(Path.makeRect(motorSupportWidth).recenter(), tower.findChild(nema23).placement)
  .make();

top.assignOutsidePath(minimalTop);

