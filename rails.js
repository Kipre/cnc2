// @ts-check

import { nx3, nz3, x3, y3, z3, zero2, zero3 } from "./cade/lib/defaults.js";
import { FlatPart } from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { metalMaterial } from "./cade/lib/materials.js";
import {
  cut,
  extrusion,
  multiExtrusion,
  retrieveOperations,
} from "./cade/lib/operations.js";
import { Part } from "./cade/lib/part.js";
import { makeFourDrills } from "./cade/lib/utils.js";
import { eps, norm, placeAlong, rotatePoint } from "./cade/tools/2d.js";
import { proj2d } from "./cade/tools/3d.js";
import { intersectLineAndArc } from "./cade/tools/circle.js";
import { Path } from "./cade/tools/path.js";
import { a2m, transformPoint3 } from "./cade/tools/transform.js";
import { defaultSpindleSize, yRailLength } from "./dimensions.js";
import { getFastenerKit, m5CylinderNut } from "./fasteners.js";

const yRailWidth = 30;
const yRailHeight = 29;
const yRailDiameter = 12;

const p = intersectLineAndArc(
  [3, 0],
  [3, yRailHeight - yRailDiameter / 2],
  [0, yRailHeight],
  [0, yRailHeight - yRailDiameter],
  yRailDiameter / 2,
  0,
);
const yRailProfile = new Path();
yRailProfile.moveTo([0, 0]);
yRailProfile.lineTo([yRailWidth / 2, 0]);
yRailProfile.lineTo([yRailWidth / 2, 4]);
yRailProfile.lineTo([yRailWidth / 2 - 9, 4]);
yRailProfile.lineTo([yRailWidth / 2 - 9, 10]);
yRailProfile.lineTo(p);
yRailProfile.arc([0, yRailHeight], yRailDiameter / 2, 1);
yRailProfile.mirror();

const body = extrusion(a2m(), yRailLength, yRailProfile);

const holeDiameter = 5.2;
const holePaths = [];
for (let x = 50; x < yRailLength; x += 100) {
  const circle = Path.makeCircle(holeDiameter / 2);
  holePaths.push(circle.translate([x, yRailWidth / 2 - 4]));
  holePaths.push(circle.translate([x, -yRailWidth / 2 + 4]));
}

const holesTransform = a2m([0, -5, 0], y3, z3);
const holes = multiExtrusion(holesTransform, 20, ...holePaths);

export function* yRailHoleFinder() {
  const length = holePaths.length;
  for (let i = 0; i < length; i += 3 * 2) {
    yield { hole: holePaths[i], depth: 4, transform: holesTransform };
    yield { hole: holePaths[i + 1], depth: 4, transform: holesTransform };
  }
}

/**
 * @param {Assembly} parent
 * @param {Part} subpart
 * @param {FlatPart} part
 * @param {(part: Part) => Generator<{hole: Path, depth: number, transform: DOMMatrix}>} holeIterator
 */
export function fastenSubpartToFlatPart(parent, subpart, part, holeIterator) {
  const partPlacement = parent.findChild(part).placement;

  for (const located of parent.findChildren(subpart)) {
    const subPlacement = located.placement;

    const subToPart = partPlacement.inverse().multiply(subPlacement);
    const fastenToTheFront =
      transformPoint3(subToPart, zero3)[2] > part.thickness / 2;

    for (const { hole, depth, transform: holeTransform } of holeIterator(
      subpart,
    )) {
      const [, p1, , p2] = hole.getSegmentAt(1);
      const diameter = norm(p1, p2);

      const requiredClampingLength = depth + part.thickness;
      const { bolt, nut, washer } = getFastenerKit(
        diameter,
        requiredClampingLength,
      );

      const location = [...placeAlong(p1, p2, { fraction: 0.5 }), 0];
      const holeToSubToPart = subToPart.multiply(holeTransform);
      const loc = proj2d(transformPoint3(holeToSubToPart, location));

      const locatedPath = Path.makeCircle(diameter / 2).translate(loc);
      part.addInsides(locatedPath);

      const fastenerLocation = partPlacement.multiply(
        a2m(
          [...loc, fastenToTheFront ? 0 : part.thickness],
          fastenToTheFront ? nz3 : z3,
        ),
      );
      const topLocation = fastenerLocation.multiply(
        a2m([0, 0, -depth - part.thickness]),
      );

      const bottomLocation = fastenerLocation.multiply(a2m(zero3, nz3));

      subpart.pairings.push({ ...parent.addChild(bolt, topLocation), parent });
      subpart.pairings.push({
        ...parent.addChild(washer, topLocation),
        parent,
      });
      subpart.pairings.push({
        ...parent.addChild(washer, bottomLocation),
        parent,
      });
      subpart.pairings.push({
        ...parent.addChild(nut, bottomLocation),
        parent,
      });
    }
  }
}

/**
 * @param {Assembly} parent
 * @param {Part} subpart
 * @param {FlatPart} part
 * @param {(part: Part) => Generator<{hole: Path, depth: number, transform: DOMMatrix}>} holeIterator
 */
export function boltThreadedSubpartToFlatPart(
  parent,
  subpart,
  part,
  holeIterator,
) {
  const partPlacement = parent.findChild(part).placement;

  for (const located of parent.findChildren(subpart)) {
    const subPlacement = located.placement;

    const subToPart = partPlacement.inverse().multiply(subPlacement);
    for (const { hole, depth, transform: holeTransform } of holeIterator(
      subpart,
    )) {
      const [, p1, , p2] = hole.getSegmentAt(1);
      const diameter = norm(p1, p2);
      const center = [...placeAlong(p1, p2, { fraction: 0.5 }), 0];
      const holeToSubToPart = subToPart.multiply(holeTransform);

      const holeInPart = transformPoint3(holeToSubToPart, center);
      const holeOnPart = proj2d(holeInPart);
      const requiredClampingLength = depth + part.thickness;

      const zee = holeInPart[2];

      if (Math.abs(zee) > requiredClampingLength) {
        console.error(
          `cannot fasten ${subpart.name} to ${part.name} because they are to far apart for hole ${holeInPart}`,
        );
        continue;
      }

      const { bolt, washer } = getFastenerKit(
        diameter,
        requiredClampingLength,
        false,
      );

      // TODO clearance holes
      const locatedPath = Path.makeCircle(diameter / 2).translate(holeOnPart);
      part.addInsides(locatedPath);

      const onTheOtherSide = Math.abs(zee - part.thickness) < eps;
      const fastenerLocation = partPlacement.multiply(
        a2m(
          [...holeOnPart, onTheOtherSide ? zee : 0],
          onTheOtherSide ? z3 : nz3,
        ),
      );
      const topLocation = fastenerLocation.multiply(
        a2m([0, 0, -part.thickness]),
      );

      subpart.pairings.push({ ...parent.addChild(bolt, topLocation), parent });
      subpart.pairings.push({
        ...parent.addChild(washer, topLocation),
        parent,
      });
    }
  }
}

/**
 * @param {Assembly} parent
 * @param {Part} subpart
 * @param {FlatPart} part
 * @param {(part: Part) => Generator<{hole: Path, depth: number, transform: DOMMatrix}>} holeIterator
 */
export function fastenSubpartToFlatPartEdge(
  parent,
  subpart,
  part,
  holeIterator,
) {
  const partPlacement = parent.findChild(part).placement;

  for (const located of parent.findChildren(subpart)) {
    const subPlacement = located.placement;

    const subToPart = partPlacement.inverse().multiply(subPlacement);

    for (const { hole, depth, transform: holeTransform } of holeIterator(
      subpart,
    )) {
      const cylinderNutOffset = 15;
      const [, p1, , p2] = hole.getSegmentAt(1);
      const diameter = norm(p1, p2);
      console.assert(Math.abs(diameter - 5) < 0.6, diameter);

      const cylinderDiameter = 10;
      const requiredClampingLength =
        depth + cylinderNutOffset + cylinderDiameter / 2;

      const { bolt, washer } = getFastenerKit(5, requiredClampingLength, false);

      const center = placeAlong(p1, p2, { fraction: 0.5 });

      const holeToSubToPart = subToPart.multiply(holeTransform);

      const holeStart = transformPoint3(holeToSubToPart, [...center, depth]);
      const holeEnd = transformPoint3(holeToSubToPart, [...center, 0]);
      const barrelCenter = placeAlong(holeStart, holeEnd, {
        fromEnd: cylinderNutOffset,
      });

      console.assert(
        Math.abs(holeStart[2] - part.thickness / 2) < eps,
        "hole is not centered",
      );

      const locatedPath = Path.makeCircle(cylinderDiameter / 2).translate(
        barrelCenter,
      );
      part.addInsides(locatedPath);

      const top = partPlacement.multiply(a2m(holeStart, nx3));
      const bottom = top.multiply(
        a2m([0, 0, depth + cylinderNutOffset], z3, y3),
      );

      subpart.pairings.push({ ...parent.addChild(bolt, top), parent });
      subpart.pairings.push({ ...parent.addChild(washer, top), parent });
      subpart.pairings.push({
        ...parent.addChild(m5CylinderNut, bottom),
        parent,
      });
    }
  }
}

export const yRail = new Part("y rail", cut(body, holes));
yRail.material = metalMaterial;
yRail.symmetries = [0, NaN, NaN];

export const railCenter = yRailHeight - yRailDiameter / 2;
const chariotDiameter = 20;
const chariotHeight = 27.6;
export const chariotTop = 17;
const chariotBottom = chariotHeight - chariotTop;
const chariotSide = 20;
export const chariotLength = 39;
export const railTopToBottom = yRailHeight - yRailDiameter / 2 + chariotTop;

const chariotProfile = new Path();
chariotProfile.moveTo([0, chariotDiameter / 2]);
chariotProfile.arc([0, -chariotDiameter / 2], chariotDiameter / 2, 0);
chariotProfile.intersectLineTo(
  zero2,
  rotatePoint(zero2, [0, -chariotDiameter], (40 * Math.PI) / 180),
);
chariotProfile.intersectLineTo(
  [0, -chariotBottom],
  [chariotSide, -chariotBottom],
);
chariotProfile.lineTo([chariotSide, chariotTop]);
chariotProfile.lineTo([0, chariotTop]);
chariotProfile.mirror();

const holeSize = 5;
const chariotHoleDepth = 10;
const drillsTransform = a2m([0, chariotTop, chariotLength / 2], y3);
const drills = makeFourDrills(
  drillsTransform,
  holeSize,
  chariotHoleDepth,
  // TODO: check this
  [28 / 2, 26 / 2],
);

export function* chariotHoleFinder() {
  const transform = drillsTransform;
  for (const op of retrieveOperations(drills).slice(0, -1)) {
    yield { hole: op.outsides[0], depth: chariotHoleDepth, transform };
  }
}

export const chariotBoltClearingRect = Path.makeRoundedRect(
  chariotLength * 2.2,
  20,
  defaultSpindleSize,
).recenter();

export const chariot = new Part(
  "y chariot",
  cut(
    extrusion(a2m([0, railCenter, 0]), chariotLength, chariotProfile),
    drills,
  ),
);
chariot.material = metalMaterial;
chariot.symmetries = [0, NaN, NaN];
