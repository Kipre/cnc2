// @ts-check

import { ny3, x3, y2, zero2, zero3 } from "./cade/lib/defaults.js";
import { spindleCleared2LineTo } from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { blackMetalMaterial, metalMaterial } from "./cade/lib/materials.js";
import {
  cut,
  extrusion,
  fuse,
  multiExtrusion,
  retrieveOperations,
} from "./cade/lib/operations.js";
import { Part } from "./cade/lib/part.js";
import { makeFourDrills } from "./cade/lib/utils.js";
import { minus } from "./cade/tools/2d.js";
import { Path } from "./cade/tools/path.js";
import { debugGeometry } from "./cade/tools/svg.js";
import { a2m, transformPoint3 } from "./cade/tools/transform.js";
import { defaultSpindleSize, screwCenterToSupport } from "./dimensions.js";
import { motorWithCoupler } from "./motor.js";

export const bf12Thickness = 20;
export const bk12Thickness = 25;
export const bkf12Height = 43;
export const bfk12Width = 60;
const indentDepth = 10.5;
const indentWidth = 13;
const holeOffset = 7;
const bkTopHoleOffset = 13 / 2;
const sideHoleDiameter = 5.5;
const topHoleDiameter = 6.6;
export const shaftY = 18 + holeOffset;
const shaftHoleDiameter = 20;
const bkfShoulder = bkf12Height - indentDepth;

console.assert(shaftY === screwCenterToSupport);
const shaftDiameter = 16;

const shaftCenter = [0, shaftY];
const shaftHole = Path.makeCircle(shaftHoleDiameter / 2).translate(shaftCenter);

const supportProfile = new Path();
supportProfile.moveTo([0, 0]);
supportProfile.lineTo([bfk12Width / 2, 0]);
supportProfile.lineTo([bfk12Width / 2, bkfShoulder]);
supportProfile.lineTo([bfk12Width / 2 - indentWidth, bkfShoulder]);
supportProfile.lineTo([bfk12Width / 2 - indentWidth, bkf12Height]);
supportProfile.lineTo([0, bkf12Height]);
supportProfile.mirror();

const sideHoles = [];
for (const xSign of [1, -1]) {
  for (const y of [holeOffset, shaftY]) {
    const x = bfk12Width / 2 - holeOffset;
    sideHoles.push(
      Path.makeCircle(sideHoleDiameter / 2).translate([xSign * x, y]),
    );
  }
}

const makeBody = (thickness) =>
  extrusion(
    a2m([-thickness / 2, 0, 0], x3),
    thickness,
    supportProfile,
    shaftHole,
    ...sideHoles,
  );

const topHoleY = bfk12Width / 2 - holeOffset;

const bfTopHoles = multiExtrusion(
  a2m([0, 0, -bkf12Height / 2]),
  bkf12Height * 2,
  Path.makeCircle(topHoleDiameter / 2).translate([0, topHoleY]),
  Path.makeCircle(topHoleDiameter / 2).translate([0, -topHoleY]),
);

const bkTopHoles = multiExtrusion(
  a2m([0, 0, -bkf12Height / 2]),
  bkf12Height * 2,
  Path.makeCircle(topHoleDiameter / 2).translate([-bkTopHoleOffset, topHoleY]),
  Path.makeCircle(topHoleDiameter / 2).translate([-bkTopHoleOffset, -topHoleY]),
  Path.makeCircle(topHoleDiameter / 2).translate([bkTopHoleOffset, topHoleY]),
  Path.makeCircle(topHoleDiameter / 2).translate([bkTopHoleOffset, -topHoleY]),
);

const plateSide = bfk12Width - 2 * indentWidth - 1;
const bkPlate = extrusion(
  a2m([bk12Thickness / 2, 0, 0], x3),
  5,
  Path.makeRect(plateSide)
    .translate(minus(shaftCenter, [plateSide / 2, plateSide / 2]))
    .invert(),
  shaftHole.invert(),
);

export const bf12 = new Part(
  "bf12 support",
  cut(makeBody(bf12Thickness), bfTopHoles),
);
bf12.material = blackMetalMaterial;
bf12.symmetries = [0, 0, NaN];

export const bk12 = new Part(
  "bk12 support",
  fuse(cut(makeBody(bk12Thickness), bkTopHoles), bkPlate),
);
bk12.material = blackMetalMaterial;
bk12.symmetries = [NaN, 0, NaN];

export const bkPlateCutout = new Path();
{
  // TODO
  const cutoutMargin = 0;
  const halfSide = plateSide / 2 + cutoutMargin;
  bkPlateCutout.moveTo([halfSide, 0]);
  bkPlateCutout.lineTo([halfSide, halfSide]);
  spindleCleared2LineTo(bkPlateCutout, [0, halfSide], defaultSpindleSize / 2);
  bkPlateCutout.mirror(zero2, y2);
  bkPlateCutout.mirror();
}

export function* bkfTopHoleFinder(part) {
  const holes = part === bf12 ? bfTopHoles : bkTopHoles;
  const depth = bkfShoulder;
  for (const holeInfo of retrieveOperations(holes).slice(0, -1)) {
    yield { hole: holeInfo.outsides[0], depth, transform: holeInfo.placement };
  }
}

export function* bkfHoleFinder(part) {
  const transform = part.shape[0].placement;
  const depth = part.shape[0].length;
  for (const path of part.shape[0].insides.slice(1)) {
    yield { hole: path, depth, transform };
  }
}
export function* bkfTwoHoleFinder(part) {
  const it = bkfHoleFinder(part);
  it.next();
  yield it.next().value;
  it.next();
  yield it.next().value;
}

function makeScrewAssembly(length) {
  const distance = length - 51;
  const endLength = 12;
  const endDiameter = 10;

  const shaftBody = extrusion(
    a2m(zero3, x3),
    length - endLength,
    Path.makeCircle(shaftDiameter / 2).translate(shaftCenter),
  );
  const endBody = extrusion(
    a2m([length - endLength, 0, 0], x3),
    endLength,
    Path.makeCircle(endDiameter / 2).translate(shaftCenter),
  );
  const screw = new Part(`screw ${length}`, fuse(shaftBody, endBody));
  screw.symmetries = [NaN, 0, shaftY];
  screw.material = metalMaterial;

  const result = new Assembly(`screw assy (${length})`);
  result.addChild(bf12, a2m([bf12Thickness / 2, 0, 0]));
  result.addChild(bk12, a2m([bk12Thickness / 2 + distance, 0, 0]));
  result.addChild(screw, a2m());

  const screwShaftPlacement = a2m([length, 0, shaftY], x3);
  result.addChild(motorWithCoupler, screwShaftPlacement);
  return result;
}

export const screwAssy = makeScrewAssembly(1000);

export const shortScrewAssy = makeScrewAssembly(300);

const rollerLength = 40;
export const rollerThickness = 40;
export const rollerWidth = 52;

// TODO: check this
export const rollerCenterToHole = [40 / 2, 24 / 2];
const rollerThreadSize = 5;
const rollerThreadDepth = 10;

const ballScrewPlateThickness = 10;
const ballScrewPlateDiameter = 48;

export const baseSurfaceToRollerSurface = shaftY + rollerThickness / 2;

export const rollerBbox = Path.makeRect(rollerWidth, rollerThickness).recenter();

const rollerProfile = new Path();
rollerProfile.moveTo([0, -rollerThickness / 2]);
rollerProfile.lineTo([rollerWidth / 2, -rollerThickness / 2]);
rollerProfile.lineTo([rollerWidth / 2, rollerThickness / 2]);
rollerProfile.lineTo([0, rollerThickness / 2]);
rollerProfile.fillet(16);
rollerProfile.mirror();

const rollerSolid = extrusion(a2m(), rollerLength, rollerProfile);

const somewhatOval = Path.makeCircle(
  ballScrewPlateDiameter / 2,
).booleanIntersection(rollerBbox);

const drills = makeFourDrills(
  a2m([0, 0, rollerLength / 2], ny3),
  rollerThreadSize,
  rollerThreadDepth,
  rollerCenterToHole,
);

export function* rollerHoleFinder() {
  for (const op of retrieveOperations(drills).slice(0, -1)) {
    yield {
      hole: op.outsides[0],
      depth: rollerThreadDepth,
      transform: op.placement.translate(0, 0, rollerThreadDepth),
    };
  }
}

const ballScrewPlate = extrusion(
  a2m([0, 0, rollerLength]),
  ballScrewPlateThickness,
  somewhatOval,
);

const rollercenterHole = extrusion(
  a2m([0, 0, -rollerLength / 2]),
  rollerLength * 2,
  Path.makeCircle(shaftHoleDiameter / 2).invert(),
);

export const roller = new Part(
  "roller",
  cut(fuse(cut(rollerSolid, drills), ballScrewPlate), rollercenterHole),
);
roller.material = metalMaterial;
roller.symmetries = [0, NaN, NaN];

export const rollerContactSurface = a2m(
  [0, -rollerThickness / 2, rollerLength / 2],
  ny3,
);
