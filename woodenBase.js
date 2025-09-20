// @ts-check

import { nx3, ny3, nz3, x3, y3, z3, zero3 } from "./cade/lib/defaults.js";
import {
  cloneChildrenWithTransform,
  FlatPart,
  halfLapCrossJoin,
  joinParts,
  makeShelfOnPlane,
  projectPlane,
  spindleClearedLineTo,
} from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { TenonMortise } from "./cade/lib/slots.js";
import {
  CylinderNutFastener,
  defaultSlotLayout,
  m6Fastener,
} from "./fasteners.js";
import { Path } from "./cade/tools/path.js";
import { a2m } from "./cade/tools/transform.js";
import {
  openArea,
  woodThickness,
  xRailSupportWidth,
  zAxisTravel,
  yRailEndSpace,
} from "./dimensions.js";
import { fastenSubpartToFlatPart, yRail } from "./rails.js";

const bridgeTopThickness = zAxisTravel;
const bridgeTop = openArea.z + bridgeTopThickness;
const joinOffset = 10;
const joinWidth = 100 - 2 * woodThickness;
const tunnelHeight = openArea.z;
const joinSpace = 2 * joinOffset + woodThickness;
const spindleDiameter = 6;

const halfBridgeMaker = (p, enlargement = 0) => {
  p.moveTo([xRailSupportWidth + openArea.x / 2, openArea.z]);
  p.lineTo([xRailSupportWidth - enlargement, openArea.z]);
  spindleClearedLineTo(
    p,
    [xRailSupportWidth - enlargement, 0],
    spindleDiameter / 2,
    true,
  );
  p.lineTo([0, 0]);
  p.lineTo([0, bridgeTop]);
  p.lineTo([xRailSupportWidth + openArea.x / 2, bridgeTop]);
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
halfTunnel.moveTo([joinWidth + openArea.y / 2 + woodThickness, 0]);
halfTunnel.lineTo([0, 0]);
halfTunnel.lineTo([0, bridgeTop]);
halfTunnel.lineTo([joinWidth, bridgeTop]);
halfTunnel.lineTo([joinWidth, tunnelHeight]);
spindleClearedLineTo(
  halfTunnel,
  [joinWidth + openArea.y / 2 + woodThickness, tunnelHeight],
  spindleDiameter / 2,
);
halfTunnel.close();
halfTunnel.translate([-woodThickness, 0]);

const innerTunnel = new FlatPart("inner tunnel", woodThickness, halfTunnel);

const fullWidth = joinWidth + openArea.y / 2 + 2 * woodThickness + joinOffset;

let halfOuterTunnel = new Path();
halfOuterTunnel.moveTo([0, 0]);
halfOuterTunnel.lineTo([fullWidth, 0]);
halfOuterTunnel.lineTo([fullWidth, bridgeTop - 100]);
halfOuterTunnel.lineTo([openArea.y / 2 - joinOffset, bridgeTop - 100]);
halfOuterTunnel.lineTo([openArea.y / 2 - joinOffset, tunnelHeight]);
halfOuterTunnel.lineTo([0, tunnelHeight]);
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
  [-woodThickness, -joinWidth - woodThickness, 0],
  x3,
  y3,
);
woodenBase.addChild(tunnel, tunnelPlacement);

bridge.addChild(innerBridge, a2m([0, woodThickness, 0], ny3));
bridge.addChild(outerBridge, a2m([0, -joinWidth, 0], ny3));

const locatedInnerBridge = woodenBase.findChild(innerBridge);
const locatedInnerTunnel = woodenBase.findChild(innerTunnel);
const locatedOuterTunnel = woodenBase.findChild(outerTunnel);

const layout = [
  new CylinderNutFastener(0.2),
  new TenonMortise(0.5),
  new CylinderNutFastener(0.8),
];
const centeredBolt = [new CylinderNutFastener(0.5)];

joinParts(woodenBase, innerBridge, innerTunnel, layout);
joinParts(woodenBase, innerTunnel, innerBridge, [new CylinderNutFastener(0.3)]);

joinParts(woodenBase, innerTunnel, outerBridge, [
  new CylinderNutFastener(0.07),
  new TenonMortise(0.25),
  new CylinderNutFastener(0.85),
]);

joinParts(woodenBase, innerBridge, outerTunnel, layout);
joinParts(woodenBase, outerBridge, outerTunnel, layout);

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
for (const zee of [tunnelHeight - joinOffset - woodThickness, joinOffset]) {
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
  joinParts(woodenBase, join, innerBridge, centeredBolt);
}

innerBridge.mirror();
outerBridge.mirror();

joinParts(woodenBase, joins[1], outerTunnel, centeredBolt);

outerTunnel.addInsides(
  Path.makeRoundedRect(
    joinWidth - 2 * joinOffset,
    tunnelHeight - joinSpace,
    10,
  ).translate([joinOffset, joinSpace]),
);

const symmetryPlane = a2m([openArea.x / 2, openArea.y / 2, 0], y3);

innerTunnel.mirror(
  ...projectPlane(symmetryPlane, locatedInnerTunnel.placement.inverse()),
);
outerTunnel.mirror();

outerTunnel.addInsides(
  Path.makeRoundedRect(
    openArea.x - 2 * joinOffset,
    tunnelHeight - 2 * joinSpace - 30,
    10,
  ).translate([joinWidth + joinSpace - joinOffset, joinSpace + 15]),
);

for (const join of joins) {
  const center = openArea.x / 2 + xRailSupportWidth;
  join.mirror([center, 0], [center, 1]);
  joinParts(
    bridge,
    join,
    innerBridge,
    centeredBolt,
    defaultSlotLayout,
    centeredBolt,
  );
  joinParts(bridge, join, outerBridge, defaultSlotLayout);
}

for (const join of tunnelJoins) {
  const locatedJoin = woodenBase.findChild(join);
  join.mirror(...projectPlane(symmetryPlane, locatedJoin.placement.inverse()));
  joinParts(tunnel, join, innerTunnel, defaultSlotLayout);
  joinParts(tunnel, join, outerTunnel, defaultSlotLayout);
}

cloneChildrenWithTransform(woodenBase, m6Fastener, mirror);

tunnel.addChild(
  yRail,
  a2m(
    [
      joinWidth + woodThickness + yRailEndSpace,
      openArea.z - joinOffset,
      -joinWidth / 2 - woodThickness / 2,
    ],
    x3,
    nz3,
  ),
);

fastenSubpartToFlatPart(tunnel, yRail, tunnelJoins[0]);

woodenBase.addChild(
  tunnel.mirror(),
  new DOMMatrix()
    .translate(openArea.x + 2 * woodThickness)
    .multiply(tunnelPlacement),
);
