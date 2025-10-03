// @ts-check

import { nx3, nz3, x3, y2, y3, z3, zero2, zero3 } from "./cade/lib/defaults.js";
import { findFlatPartIntersection, FlatPart, projectPlane, spindleCleared2LineTo } from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { blackMetalMaterial, metalMaterial } from "./cade/lib/materials.js";
import { cut, extrusion, fuse, multiExtrusion } from "./cade/lib/operations.js";
import { Part } from "./cade/lib/part.js";
import { intersectLines, minus, norm, placeAlong } from "./cade/tools/2d.js";
import { cross, dot3, mult3, plus3, proj2d } from "./cade/tools/3d.js";
import { getCircleCenter, intersectLineAndArc } from "./cade/tools/circle.js";
import { Path } from "./cade/tools/path.js";
import { debugGeometry } from "./cade/tools/svg.js";
import { a2m, transformPoint3 } from "./cade/tools/transform.js";
import { bfkSupportExtension, openArea, screwCenter, screwCenterToSupport, yRailLength } from "./dimensions.js";
import { m5Bolt, m5Nut, m5Washer } from "./fasteners.js";

const bf12Thickness = 20;
export const bk12Thickness = 25;
const supportHeight = 43;
const supportWidth = 60;
const indentDepth = 10.5;
const indentWidth = 13;
const holeOffset = 7;
const bkTopHoleOffset = 13 / 2;
const sideHoleDiameter = 5.5;
const topHoleDiameter = 6.6;
const shaftY = 18 + holeOffset;
const shaftHoleDiameter = 20;


console.assert(shaftY === screwCenterToSupport);
const shaftDiameter = 16;

const shaftCenter = [0, shaftY];
const shaftHole = Path.makeCircle(shaftHoleDiameter / 2).translate(shaftCenter);

const supportProfile = new Path();
supportProfile.moveTo([0, 0]);
supportProfile.lineTo([supportWidth / 2, 0]);
supportProfile.lineTo([supportWidth / 2, supportHeight - indentDepth]);
supportProfile.lineTo([
  supportWidth / 2 - indentWidth,
  supportHeight - indentDepth,
]);
supportProfile.lineTo([supportWidth / 2 - indentWidth, supportHeight]);
supportProfile.lineTo([0, supportHeight]);
supportProfile.mirror();

const sideHoles = [];
for (const xSign of [1, -1]) {
  for (const y of [holeOffset, supportHeight - indentDepth - holeOffset]) {
    const x = supportWidth / 2 - holeOffset;
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

const topHoleY = supportWidth / 2 - holeOffset;

const bfTopHoles = multiExtrusion(
  a2m([0, 0, -supportHeight / 2]),
  supportHeight * 2,
  Path.makeCircle(topHoleDiameter / 2).translate([0, topHoleY]),
  Path.makeCircle(topHoleDiameter / 2).translate([0, -topHoleY]),
);

const bkTopHoles = multiExtrusion(
  a2m([0, 0, -supportHeight / 2]),
  supportHeight * 2,
  Path.makeCircle(topHoleDiameter / 2).translate([-bkTopHoleOffset, topHoleY]),
  Path.makeCircle(topHoleDiameter / 2).translate([-bkTopHoleOffset, -topHoleY]),
  Path.makeCircle(topHoleDiameter / 2).translate([bkTopHoleOffset, topHoleY]),
  Path.makeCircle(topHoleDiameter / 2).translate([bkTopHoleOffset, -topHoleY]),
);

const plateSide = supportWidth - 2 * indentWidth - 1;
const bkPlate = extrusion(
  a2m([bk12Thickness / 2, 0, 0], x3),
  5,
  Path.makeRect(plateSide).translate(
    minus(shaftCenter, [plateSide / 2, plateSide / 2]),
  ).invert(),
  shaftHole.invert(),
);

export const bf12 = new Part(
  "bf12 support",
  cut(makeBody(bf12Thickness), bfTopHoles),
);
bf12.material = blackMetalMaterial;

export const bk12 = new Part(
  "bk12 support",
  fuse(cut(makeBody(bk12Thickness), bkTopHoles), bkPlate),
);
bk12.material = blackMetalMaterial;

const cutoutMargin = 1;
export function makeBKPlateCutout(spindleDiameter, radius) {
  const depth = bfkSupportExtension - screwCenter + plateSide / 2;
  const p = new Path();
  p.moveTo([-2 * radius - plateSide / 2 - cutoutMargin, 0]);
  p.lineTo([-plateSide / 2 - cutoutMargin, 0]);
  p.arcTo([-plateSide / 2 - cutoutMargin, -depth - cutoutMargin], radius);
  spindleCleared2LineTo(p, [0, -depth - cutoutMargin], spindleDiameter / 2);
  p.mirror(zero2, y2);
  return p;
}

export function* bkfHoleFinder(part) {
  const transform = part.shape[0].placement;
  const depth = part.shape[0].length;
  for (const path of part.shape[0].insides.slice(1)) {
    yield {hole: path, depth, transform};
  }
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
  const screw = new Part("screw", fuse(shaftBody, endBody));
  screw.material = metalMaterial;

  const result = new Assembly(`screw assy (${length})`);
  result.addChild(bf12, a2m([bf12Thickness / 2, 0, 0]));
  result.addChild(bk12, a2m([bk12Thickness / 2 + distance, 0, 0]));
  result.addChild(screw, a2m());
  return result;
}

export const screwAssy = makeScrewAssembly(1000);
export const screwShaftPlacement = a2m([1000, 0, shaftY]);

const rollerLength = 40;
const rollerThickness = 40;
const rollerWidth = 52;
const ballScrewPlateThickness = 10;
const ballScrewPlateDiameter = 48;

const rollerBbox = Path.makeRect(rollerWidth, rollerThickness).translate([-rollerWidth / 2, -rollerThickness / 2]);

const rollerProfile = new Path();
rollerProfile.moveTo([0, -rollerThickness / 2]);
rollerProfile.lineTo([rollerWidth / 2, -rollerThickness / 2]);
rollerProfile.lineTo([rollerWidth / 2, rollerThickness / 2]);
rollerProfile.lineTo([0, rollerThickness / 2]);
rollerProfile.fillet(16);
rollerProfile.mirror();


const rollerSolid = extrusion(
  a2m(),
  rollerLength,
  rollerProfile,
);

const somewhatOval = Path.makeCircle(ballScrewPlateDiameter / 2)
  .booleanIntersection(rollerBbox);

const ballScrewPlate = extrusion(
  a2m([0, 0, rollerLength]),
  ballScrewPlateThickness,
  somewhatOval,
);

const rollercenterHole = extrusion(
  a2m([0, 0, -rollerLength / 2]),
  rollerLength * 2,
  Path.makeCircle(shaftHoleDiameter / 2).invert()
);

export const roller = new Part("roller", cut(fuse(rollerSolid, ballScrewPlate), rollercenterHole));
roller.material = metalMaterial;
