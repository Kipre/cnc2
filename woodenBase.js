// @ts-check

import {
  computeJoinShape,
  FlatPart,
  halfLapCrossJoin,
  joinParts,
} from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { CylinderNutFastener, TenonMortise } from "./cade/lib/slots.js";
import { axesArrows, nx3, ny3, x3, y3, z3, zero3 } from "./cade/lib/utils.js";
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

const bridgeFormation = (p, enlargement = 0) => {
  p.moveTo([xRailSupportWidth + openArea.y / 2, openArea.z]);
  p.lineTo([xRailSupportWidth - enlargement, openArea.z]);
  p.lineTo([xRailSupportWidth - enlargement, 0]);
  p.lineTo([0, 0]);
  p.lineTo([0, bridgeTop]);
  p.lineTo([xRailSupportWidth + openArea.y / 2, bridgeTop]);
  p.fillet(100);
  p.mirror();
  return p;
};

const innerBridgePath = bridgeFormation(new Path(), woodThickness);
const innerBridge = new FlatPart(woodThickness, innerBridgePath);

const outerBridge = new FlatPart(
  woodThickness,
  bridgeFormation(new Path(), -joinOffset),
);

const tunnelPath = new Path();
tunnelPath.moveTo([bridgeJoinWidth + openArea.x / 2, 0]);
tunnelPath.lineTo([0, 0]);
tunnelPath.lineTo([0, bridgeTop]);
tunnelPath.lineTo([bridgeJoinWidth, bridgeTop]);
tunnelPath.lineTo([bridgeJoinWidth, openArea.z]);
tunnelPath.lineTo([bridgeJoinWidth + openArea.x / 2, openArea.z]);
tunnelPath.mirror();

const tunnel = new FlatPart(woodThickness, tunnelPath);

const tunnelPlacement = a2m(
  [xRailSupportWidth - woodThickness, -bridgeJoinWidth - woodThickness, 0],
  x3,
  y3,
);

export const woodenBase = new Assembly("wooden frame");

woodenBase.addChild(innerBridge, a2m(null, ny3));
woodenBase.addChild(tunnel, tunnelPlacement);
woodenBase.addChild(
  outerBridge,
  a2m([0, -bridgeJoinWidth - woodThickness, 0], ny3),
);

const layout = [
  new CylinderNutFastener(0.2),
  new TenonMortise(0.5),
  new CylinderNutFastener(0.8),
];

joinParts(woodenBase.children[0], woodenBase.children[1], layout);
joinParts(woodenBase.children[1], woodenBase.children[0], [
  new CylinderNutFastener(0.3),
]);

joinParts(woodenBase.children[1], woodenBase.children[2], [
  new CylinderNutFastener(0.07),
  new TenonMortise(0.25),
  new CylinderNutFastener(0.85),
]);

const joinMatrix = a2m([0, 0, bridgeTop - joinOffset - woodThickness]);
const join = computeJoinShape(
  woodenBase.children[0],
  woodenBase.children[2],
  joinMatrix,
  woodThickness,
);

woodenBase.addChild(join, joinMatrix);
// joinParts(woodenBase.children[3], woodenBase.children[0]);
// joinParts(woodenBase.children[3], woodenBase.children[2]);

halfLapCrossJoin(woodenBase.children[1], woodenBase.children[3]);
