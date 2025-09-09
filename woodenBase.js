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
halfTunnel.moveTo([bridgeJoinWidth + openArea.x / 2, 0]);
halfTunnel.lineTo([0, 0]);
halfTunnel.lineTo([0, bridgeTop]);
halfTunnel.lineTo([bridgeJoinWidth, bridgeTop]);
halfTunnel.lineTo([bridgeJoinWidth, openArea.z]);
halfTunnel.lineTo([bridgeJoinWidth + openArea.x / 2, openArea.z]);
halfTunnel.close();

const innerTunnel = new FlatPart("inner tunnel", woodThickness, halfTunnel);
const place = [
  xRailSupportWidth - woodThickness,
  -bridgeJoinWidth - woodThickness,
  0,
];
const tunnelPlacement = a2m(place, x3, y3);

export const woodenBase = new Assembly("wooden frame");
export const bridge = new Assembly("bridge");
export const tunnel = new Assembly("tunnel");

const bridgePlacement = a2m([0, -woodThickness, 0]);
woodenBase.addChild(bridge, bridgePlacement);
woodenBase.addChild(
  bridge,
  a2m([0, openArea.y - woodThickness, 0]).scale(1, -1, 1),
);

woodenBase.addChild(tunnel);

bridge.addChild(innerBridge, a2m([0, woodThickness, 0], ny3));
bridge.addChild(outerBridge, a2m([0, -bridgeJoinWidth, 0], ny3));

tunnel.addChild(innerTunnel, tunnelPlacement);

const mirrorZ = new DOMMatrix().scale(
  ...[1, 1, -1, 0, 0],
  openArea.x / 2 + woodThickness,
);
tunnel.addChild(innerTunnel, tunnelPlacement.multiply(mirrorZ));

const locatedInnerBridge = woodenBase.findChild(innerBridge);
const locatedInnerTunnel = woodenBase.findChild(innerTunnel);
const locatedOuterBridge = woodenBase.findChild(outerBridge);

const layout = [
  new CylinderNutFastener(0.2),
  new TenonMortise(0.5),
  new CylinderNutFastener(0.8),
];

joinParts(locatedInnerBridge, locatedInnerTunnel, layout);
joinParts(locatedInnerTunnel, locatedInnerBridge, [
  new CylinderNutFastener(0.3),
]);

joinParts(locatedInnerTunnel, locatedOuterBridge, [
  new CylinderNutFastener(0.07),
  new TenonMortise(0.25),
  new CylinderNutFastener(0.85),
]);

innerBridge.mirror();
outerBridge.mirror();

for (const zee of [
  bridgeTop - joinOffset - woodThickness,
  openArea.z + joinOffset,
]) {
  const joinMatrix = a2m([0, 0, zee]);
  const join = computeJoinShape(
    bridge.findChild(innerBridge),
    bridge.findChild(outerBridge),
    joinMatrix,
    woodThickness,
  );

  const located = bridge.addChild(join, joinMatrix);
  joinParts(located, bridge.findChild(innerBridge));
  joinParts(located, bridge.findChild(outerBridge));

  halfLapCrossJoin(locatedInnerTunnel, woodenBase.findChild(join));
}

innerTunnel.mirror();


// export const woodenBase = new Assembly("wooden frame");
// const innerTunnel2 = new FlatPart("inner tunnel", woodThickness, tunnelPath);
// innerTunnel2.addInsides(Path.makeCircle(20).translate([40, 40]))
// innerTunnel2.mirror();
// woodenBase.addChild(innerTunnel2);
