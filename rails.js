// @ts-check

import { nz3, x3, y3, z3, zero2, zero3 } from "./cade/lib/defaults.js";
import { FlatPart } from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { metalMaterial } from "./cade/lib/materials.js";
import { cut, extrusion, fuse, multiExtrusion } from "./cade/lib/operations.js";
import { Part } from "./cade/lib/part.js";
import { norm, placeAlong } from "./cade/tools/2d.js";
import { proj2d } from "./cade/tools/3d.js";
import { getCircleCenter, intersectLineAndArc } from "./cade/tools/circle.js";
import { Path } from "./cade/tools/path.js";
import { debugGeometry } from "./cade/tools/svg.js";
import { a2m, transformPoint3 } from "./cade/tools/transform.js";
import { yRailLength } from "./dimensions.js";
import { getFastenerKit, m5Bolt, m5Nut, m5Washer } from "./fasteners.js";

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

const holes = multiExtrusion(a2m([0, -5, 0], y3, z3), 20, ...holePaths);

/**
 * @param {Assembly} parent
 * @param {Part} subpart
 * @param {FlatPart} part
 */
export function fastenSubpartToFlatPart1(parent, subpart, part) {
  const partPlacement = parent.findChild(part).placement;
  const subPlacement = parent.findChild(subpart).placement;

  const holePaths = subpart.shape[0].insides.slice(1);
  const holesTransform = subpart.shape[0].placement;
  const holeDepth = subpart.shape[0].length;

  const requiredClampingLength = holeDepth + part.thickness;

  const subToPart = partPlacement.inverse().multiply(subPlacement);

  const length = holePaths.length;

  for (let i = 0; i < length; i++) {
    const hole = holePaths[i];
    const [, p1, , p2] = hole.getSegmentAt(1);
    const diameter = norm(p1, p2);
    const { bolt, nut, washer } = getFastenerKit(diameter, requiredClampingLength);

    const location = [...placeAlong(p1, p2, { fraction: 0.5 }), 0];
    const holeToSubToPart = subToPart.multiply(holesTransform);
    const loc = proj2d(transformPoint3(holeToSubToPart, location));

    const locatedPath = Path.makeCircle(diameter / 2).translate(loc);
    part.addInsides(locatedPath);

    const fastenerLocation = partPlacement.multiply(a2m([...loc, 0], nz3));
    const topLocation = fastenerLocation.multiply(
      a2m([0, 0, -holeDepth - part.thickness]),
    );

    parent.addChild(bolt, topLocation);
    parent.addChild(washer, topLocation);

    const bottomLocation = fastenerLocation
      .multiply(a2m(zero3, nz3));

    parent.addChild(washer, bottomLocation);
    parent.addChild(nut, bottomLocation);
  }
}

/**
 * @param {Assembly} parent
 * @param {Part} subpart
 * @param {FlatPart} part
 */
export function fastenSubpartToFlatPart(parent, subpart, part) {
  const holeDepth = 4;
  const partPlacement = parent.findChild(part).placement;
  const subPlacement = parent.findChild(subpart).placement;

  const subToPart = partPlacement.inverse().multiply(subPlacement);
  const holesTransform = holes.retreive().shapes[0].retreive().placement;

  const length = holePaths.length;
  for (let i = 0; i < length / 2; i++) {
    if (i % 3 !== 0) continue;
    for (let j = 0; j < 2; j++) {
      const hole = holePaths[2 * i + j];
      const [, p1, , p2] = hole.getSegmentAt(1);
      const diameter = norm(p1, p2);
      const location = [...placeAlong(p1, p2, { fraction: 0.5 }), 0];
      const holeToSubToPart = subToPart.multiply(holesTransform);
      const loc = proj2d(transformPoint3(holeToSubToPart, location));

      const locatedPath = Path.makeCircle(diameter / 2).translate(loc);
      part.addInsides(locatedPath);

      const fastenerLocation = partPlacement.multiply(a2m([...loc, 0], nz3));
      const topLocation = fastenerLocation.multiply(
        a2m([0, 0, -holeDepth - part.thickness]),
      );

      parent.addChild(m5Bolt, topLocation);
      parent.addChild(m5Washer, topLocation);

      const bottomLocation = fastenerLocation
        .multiply(a2m(zero3, nz3));

      parent.addChild(m5Washer, bottomLocation);
      parent.addChild(m5Nut, bottomLocation);
    }
  }
}

export const yRail = new Part("y rail", cut(body, holes));
yRail.material = metalMaterial;
yRail.symmetries = [0, NaN, 0];
