// @ts-check

import { Assembly, FlatPart } from "./cade/lib/lib.js";
import { axesArrows, nx3, ny3, x3, y3 } from "./cade/lib/utils.js";
import { norm, placeAlong } from "./cade/tools/2d.js";
import { Path } from "./cade/tools/path.js";
import { a2m } from "./cade/tools/transform.js";
import {
  openArea,
  woodThickness,
  xRailSupportWidth,
  zAxisTravel,
} from "./dimensions.js";

const bridgeTopThickness = zAxisTravel;
const bridgeTop = openArea.z + bridgeTopThickness;
const joinOffset = 10;
const bridgeJoinWidth = 100 - 2 * woodThickness;

const bridgePath = new Path();
bridgePath.moveTo([xRailSupportWidth + openArea.y / 2, openArea.z]);
bridgePath.lineTo([xRailSupportWidth, openArea.z]);
bridgePath.lineTo([xRailSupportWidth, 0]);
bridgePath.lineTo([0, 0]);
bridgePath.lineTo([0, bridgeTop]);
bridgePath.lineTo([xRailSupportWidth + openArea.y / 2, bridgeTop]);
bridgePath.fillet(150);
bridgePath.mirror();

const innerBridge = new FlatPart(bridgePath);
const outerBridge = new FlatPart(bridgePath);

const tunnelPath = new Path();
tunnelPath.moveTo([bridgeJoinWidth + openArea.x / 2, 0]);
tunnelPath.lineTo([0, 0]);
tunnelPath.lineTo([0, bridgeTop]);
tunnelPath.lineTo([bridgeJoinWidth, bridgeTop]);
tunnelPath.lineTo([bridgeJoinWidth, openArea.z]);
tunnelPath.lineTo([bridgeJoinWidth + openArea.x / 2, openArea.z]);
tunnelPath.mirror();

const tunnel = new FlatPart(tunnelPath);

const holeRadius = 7 / 2;
const fastenerHole = new Path();
fastenerHole.moveTo([holeRadius, 0]);
fastenerHole.arc([-holeRadius, 0], holeRadius, 0);
fastenerHole.arc([holeRadius, 0], holeRadius, 0);
fastenerHole.close();

const nutRadius = 10.2 / 2;
const nutHoleOffset = -10 - nutRadius;
const nutHole = new Path();
nutHole.moveTo([nutRadius, nutHoleOffset]);
nutHole.arc([-nutRadius, nutHoleOffset], nutRadius, 0);
nutHole.arc([nutRadius, nutHoleOffset], nutRadius, 0);
nutHole.close();

const mortiseWidth = 30;
const spindleDiameter = 6;
const mortise = new Path();
mortise.moveTo([0, -woodThickness / 2]);
mortise.lineTo([spindleDiameter - mortiseWidth / 2, -woodThickness / 2]);
mortise.arc([-mortiseWidth / 2, -woodThickness / 2], spindleDiameter / 2, 0);
mortise.lineTo([-mortiseWidth / 2, 0]);
mortise.mirror([0, 0]);
mortise.mirror();

const maleMortise = new Path();
maleMortise.moveTo([-spindleDiameter - mortiseWidth / 2, 0]);
maleMortise.arc([-mortiseWidth / 2, 0], spindleDiameter / 2, 1);
maleMortise.lineTo([-mortiseWidth / 2, woodThickness]);
maleMortise.mirror([0, 0], [0, 1]);

function addSimpleReinforcingJoin(part1, part2, l1, l2, width, thickness) {
  const cutouts = [];
  const joinCutouts = [];

  const length = norm(l2, l1);
  const nbFasteners = Math.ceil(length / 250);
  const offset = 50;
  const fastenerPitch = (length - 2 * offset) / (nbFasteners - 1);

  const joinPartPath = new Path();
  joinPartPath.moveTo([0, width / 2]);

  const firstBolt = placeAlong(l1, l2, { fromStart: offset });
  cutouts.push(fastenerHole.translate(firstBolt));
  joinCutouts.push(nutHole.translate([offset, width / 2]));
  joinCutouts.push(nutHole.translate([offset, width / 2]).scale(1, -1));

  let lastLocation = offset;

  for (let i = 1; i < nbFasteners; i++) {
    const location = offset + i * fastenerPitch;

    const nextBolt = placeAlong(l1, l2, { fromStart: location });
    cutouts.push(fastenerHole.translate(nextBolt));
    joinCutouts.push(nutHole.translate([location, width / 2]));
    joinCutouts.push(nutHole.translate([location, width / 2]).scale(1, -1));

    const loc = (lastLocation + location) / 2;
    const nextMortise = placeAlong(l1, l2, { fromStart: loc });
    cutouts.push(mortise.translate(nextMortise));
    joinPartPath.merge(maleMortise.translate([loc, width / 2]));

    lastLocation = location;
  }

  joinPartPath.lineTo([length, width / 2]);
  joinPartPath.mirror([0, 0], [1, 0]);
  joinPartPath.close();

  part1.addInsides(...cutouts);
  part2.addInsides(...cutouts);

  const joinPart = new FlatPart(joinPartPath, joinCutouts);

  const transform = a2m([l1[0], -width / 2 - thickness, l1[1] - thickness / 2]);

  const part2Transform = a2m([0, -width - thickness, 0], ny3);
  return [joinPart, transform, part2Transform];
}

const zJoin = bridgeTop - joinOffset - woodThickness / 2;
const [from, to] = bridgePath
  .intersectLine([-10, zJoin], [2 * xRailSupportWidth + openArea.y + 10, zJoin])
  .map((int) => int.point);

const zJoin2 = openArea.z + joinOffset + woodThickness / 2;
const [from2, to2] = bridgePath
  .intersectLine(
    [-10, zJoin2],
    [2 * xRailSupportWidth + openArea.y + 10, zJoin2],
  )
  .map((int) => int.point);

const [join, joinTransform] = addSimpleReinforcingJoin(
  innerBridge,
  outerBridge,
  from,
  to,
  bridgeJoinWidth,
  woodThickness,
);

const [join2, join2Transform, part2Transform] = addSimpleReinforcingJoin(
  innerBridge,
  outerBridge,
  from2,
  to2,
  bridgeJoinWidth,
  woodThickness,
);

function joinParts(part1, part2) { }

const tunnelPlacement = a2m(
  [xRailSupportWidth - woodThickness, -bridgeJoinWidth - woodThickness, 0],
  x3,
  y3,
);
joinParts(innerBridge, tunnel);

export const woodenBase = new Assembly("wooden frame");
// woodenBase.addChild(axesArrows);

woodenBase.addChild(innerBridge, a2m(null, ny3));
woodenBase.addChild(tunnel, tunnelPlacement);
woodenBase.addChild(outerBridge, part2Transform);
woodenBase.addChild(join, joinTransform);
woodenBase.addChild(join2, join2Transform);
