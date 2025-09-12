// @ts-check

import {
  FlatPart,
  halfLapCrossJoin,
  joinParts,
  makeShelfOnPlane,
  projectPlane,
} from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { CylinderNutFastener, TenonMortise } from "./cade/lib/slots.js";
import { nx3, ny3, x3, y3, z3, zero3 } from "./cade/lib/defaults.js";
import { Path } from "./cade/tools/path.js";
import { debugGeometry } from "./cade/tools/svg.js";
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

const halfBridgeMaker = (p, enlargement = 0) => {
  p.moveTo([xRailSupportWidth + openArea.y / 2, openArea.z]);
  p.lineTo([xRailSupportWidth - enlargement, openArea.z]);
  p.lineTo([xRailSupportWidth - enlargement, 0]);
  p.lineTo([0, 0]);
  p.lineTo([0, bridgeTop]);
  p.lineTo([xRailSupportWidth + openArea.y / 2, bridgeTop]);
  p.fillet(100);
  p.close();
  return p;
};

const innerBridgePath = halfBridgeMaker(new Path(), woodThickness);
const innerBridge = new FlatPart(
  "inner bridge",
  woodThickness,
  innerBridgePath,
);

const outerBridge = new FlatPart(
  "outer bridge",
  woodThickness,
  halfBridgeMaker(new Path(), -joinOffset),
);

const halfTunnel = new Path();
halfTunnel.moveTo([bridgeJoinWidth + openArea.x / 2 + woodThickness, 0]);
halfTunnel.lineTo([0, 0]);
halfTunnel.lineTo([0, bridgeTop]);
halfTunnel.lineTo([bridgeJoinWidth, bridgeTop]);
halfTunnel.lineTo([bridgeJoinWidth, openArea.z]);
halfTunnel.lineTo([
  bridgeJoinWidth + openArea.x / 2 + woodThickness,
  openArea.z,
]);
halfTunnel.close();
halfTunnel.translate([-woodThickness, 0]);

const innerTunnel = new FlatPart("inner tunnel", woodThickness, halfTunnel);

const fullWidth =
  bridgeJoinWidth + openArea.x / 2 + 2 * woodThickness + joinOffset;

let halfOuterTunnel = new Path();
halfOuterTunnel.moveTo([0, 0]);
halfOuterTunnel.lineTo([fullWidth, 0]);
halfOuterTunnel.lineTo([fullWidth, bridgeTop - 100]);
halfOuterTunnel.lineTo([openArea.x / 2 - joinOffset, bridgeTop - 100]);
halfOuterTunnel.lineTo([openArea.x / 2 - joinOffset, openArea.z]);
halfOuterTunnel.lineTo([0, openArea.z]);
halfOuterTunnel.close();
halfOuterTunnel = halfOuterTunnel
  .scale(-1, 1)
  .translate([fullWidth - woodThickness - joinOffset, 0]);

const outerTunnel = new FlatPart(
  "outer tunnel",
  woodThickness,
  halfOuterTunnel,
);

export const woodenBase = new Assembly("wooden frame");
export const bridge = new Assembly("bridge");
export const tunnel = new Assembly("tunnel");
tunnel.addChild(innerTunnel);
tunnel.addChild(outerTunnel, a2m([0, 0, -xRailSupportWidth]));

const bridgePlacement = a2m([-xRailSupportWidth, -woodThickness, 0]);
woodenBase.addChild(bridge, bridgePlacement);

const mirror = new DOMMatrix()
  .translate(openArea.x / 2, openArea.y / 2)
  .rotate(0, 0, 180)
  .translate(-openArea.x / 2, -openArea.y / 2);

woodenBase.addChild(bridge, mirror.multiply(bridgePlacement));

const tunnelPlacement = a2m(
  [-woodThickness, -bridgeJoinWidth - woodThickness, 0],
  x3,
  y3,
);
woodenBase.addChild(tunnel, tunnelPlacement);

bridge.addChild(innerBridge, a2m([0, woodThickness, 0], ny3));
bridge.addChild(outerBridge, a2m([0, -bridgeJoinWidth, 0], ny3));

woodenBase.addChild(tunnel, mirror.multiply(tunnelPlacement));

const locatedInnerBridge = woodenBase.findChild(innerBridge);
const locatedInnerTunnel = woodenBase.findChild(innerTunnel);
const locatedOuterBridge = woodenBase.findChild(outerBridge);
const locatedOuterTunnel = woodenBase.findChild(outerTunnel);

const layout = [
  new CylinderNutFastener(0.2),
  new TenonMortise(0.5),
  new CylinderNutFastener(0.8),
];
const centeredBolt = [new CylinderNutFastener(0.5)];

joinParts(locatedInnerBridge, locatedInnerTunnel, layout);
joinParts(locatedInnerTunnel, locatedInnerBridge, [
  new CylinderNutFastener(0.3),
]);

joinParts(locatedInnerTunnel, locatedOuterBridge, [
  new CylinderNutFastener(0.07),
  new TenonMortise(0.25),
  new CylinderNutFastener(0.85),
]);

joinParts(locatedInnerBridge, locatedOuterTunnel, layout);
joinParts(locatedOuterBridge, locatedOuterTunnel, layout);

const joins = [];
for (const zee of [
  bridgeTop - joinOffset - woodThickness,
  openArea.z + joinOffset,
]) {
  const joinMatrix = a2m([0, 0, zee]);
  const join = makeShelfOnPlane(
    joinMatrix,
    woodThickness,
    bridge.findChild(innerBridge),
    bridge.findChild(outerBridge),
  );

  bridge.addChild(join, joinMatrix);
  halfLapCrossJoin(locatedInnerTunnel, woodenBase.findChild(join), true);
  joins.push(join);
}

const tunnelJoins = [];
for (const zee of [openArea.z - joinOffset - woodThickness, joinOffset]) {
  const joinMatrix = a2m([0, 0, zee], z3, y3);
  const join = makeShelfOnPlane(
    joinMatrix,
    woodThickness,
    locatedInnerTunnel,
    locatedInnerBridge,
    locatedOuterTunnel,
  );

  tunnel.addChild(join, tunnelPlacement.inverse().multiply(joinMatrix));
  tunnelJoins.push(join);
  joinParts(woodenBase.findChild(join), locatedInnerBridge, centeredBolt);
}

innerBridge.mirror();
outerBridge.mirror();

const locatedJoin = woodenBase.findChild(joins[1]);
joinParts(locatedJoin, locatedOuterTunnel, centeredBolt);

const symmetryPlane = a2m([openArea.x / 2, openArea.y / 2, 0], y3);

innerTunnel.mirror(
  ...projectPlane(symmetryPlane, locatedInnerTunnel.placement.inverse()),
);
outerTunnel.mirror();

for (const join of joins) {
  const center = openArea.x / 2 + xRailSupportWidth;
  join.mirror([center, 0], [center, 1]);
  const locatedJoin = woodenBase.findChild(join);
  joinParts(locatedJoin, locatedInnerBridge, centeredBolt, null, centeredBolt);
  joinParts(locatedJoin, locatedOuterBridge);
}

for (const join of tunnelJoins) {
  const locatedJoin = woodenBase.findChild(join);
  join.mirror(...projectPlane(symmetryPlane, locatedJoin.placement.inverse()));
  joinParts(locatedJoin, locatedInnerTunnel);
  joinParts(locatedJoin, locatedOuterTunnel);
}
