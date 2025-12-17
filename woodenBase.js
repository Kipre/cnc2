// @ts-check

import { otherSide, tunnelTop, yRailPlacement } from "./assemblyInvariants.js";
import {
  bridge,
  bridgeCenter,
  innerBridge,
  outerBridge,
  secondBridge,
  secondInnerBridge,
  secondOuterBridge,
} from "./bridge.js";
import { x3, y3 } from "./cade/lib/defaults.js";
import {
  clearBoltOnFlatPart3,
  fastenSubpartToFlatPart,
} from "./cade/lib/fastening.js";
import { FlatPart, joinParts, makeRoomForATenon } from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { makeShelfOnPlane, ShelfMaker } from "./cade/lib/shelf.js";
import {
  CenterDrawerSlot,
  DrawerSlot,
  TenonMortise,
} from "./cade/lib/slots.js";
import { locateOriginOnFlatPart } from "./cade/lib/utils.js";
import { mult3 } from "./cade/tools/3d.js";
import {
  a2m,
  locateWithConstraints,
  transformOnlyOrigin,
} from "./cade/tools/transform.js";
import {
  bridgeHeight,
  bridgeTop,
  defaultSpindleSize,
  joinOffset,
  joinWidth,
  openArea,
  tunnelHeight,
  tunnelWidth,
  woodThickness,
  xOverwidth,
} from "./dimensions.js";
import {
  btbLayout,
  CylinderNutFastener,
  defaultSlotLayout,
  getFastenerKit,
} from "./fasteners.js";
import {
  lengthwiseClearance,
  motorCenteringHole,
  motorHolesGetter,
  motorSideClearance,
  nema23,
} from "./motor.js";
import { yRail, yRailHoleFinder } from "./rails.js";
import {
  bf12,
  bfk12Width,
  bk12,
  bkfTopHoleFinder,
  screwAssy,
} from "./screw.js";
import { innerTunnel, outerTunnel, tunnel } from "./tunnel.js";

const tm = (x) => new TenonMortise(x);
const cnf = (x) => new CylinderNutFastener(x);

const machineCenter = [openArea.x / 2, openArea.y / 2, 0];
const mirrorX = new DOMMatrix()
  .translate(...machineCenter)
  .scale(-1, 1, 1)
  .translate(...mult3(machineCenter, -1));

export const woodenBase = new Assembly("wooden frame");

const bridgePlacement = a2m([-tunnelWidth, -woodThickness, 0]);
woodenBase.addChild(bridge, bridgePlacement);

const secondBridgePlacement = a2m([
  -tunnelWidth,
  joinWidth + openArea.y + woodThickness,
  0,
]);
woodenBase.addChild(secondBridge, secondBridgePlacement);

const tunnelPlacement = a2m(
  [-xOverwidth - woodThickness, -joinWidth - woodThickness, 0],
  x3,
  y3,
);
woodenBase.addChild(tunnel, tunnelPlacement);

const locatedInnerBridge = woodenBase.findChild(innerBridge);
const locatedInnerTunnel = woodenBase.findChild(innerTunnel);
const locatedOuterTunnel = woodenBase.findChild(outerTunnel);
const locatedSecondInnerBridge = woodenBase.findChild(secondInnerBridge);

const screwPlacement = locateWithConstraints({
  from: a2m(),
  to: otherSide(locatedOuterTunnel.placement),
})
  .rotate(0, 0, 180)
  // TODO
  .translate(
    -woodThickness - 1003,
    -tunnelHeight - woodThickness - bfk12Width / 2,
  );

woodenBase.addChild(screwAssy, screwPlacement);

{
  const centerOnBridge = locateOriginOnFlatPart(
    woodenBase,
    outerBridge,
    nema23,
  );
  innerBridge.addInsides(motorCenteringHole.translate(centerOnBridge));
  innerBridge.assignOutsidePath(
    innerBridge.outside
      .realBooleanUnion(motorSideClearance.translate(centerOnBridge))
      .invert(),
  );
  outerBridge.addInsides(motorSideClearance.translate(centerOnBridge));
  outerBridge.assignOutsidePath(
    outerBridge.outside
      .realBooleanUnion(motorSideClearance.offset(15).translate(centerOnBridge))
      .invert(),
  );

  const centerOnTunnel = locateOriginOnFlatPart(
    woodenBase,
    outerTunnel,
    nema23,
  );
  outerTunnel.assignOutsidePath(
    outerTunnel.outside.booleanDifference(
      lengthwiseClearance.rotate(Math.PI).translate(centerOnTunnel),
    ),
  );

  makeRoomForATenon(woodenBase, outerBridge, outerTunnel, defaultSpindleSize);
}

const centeredBolt = [new CylinderNutFastener(0.5)];

const joins = [];

joinParts(woodenBase, innerTunnel, secondInnerBridge, [cnf(0.7)]);
joinParts(woodenBase, secondInnerBridge, outerTunnel, btbLayout(3));
joinParts(woodenBase, secondOuterBridge, outerTunnel, btbLayout(3));

joinParts(woodenBase, innerTunnel, innerBridge, [cnf(0.3)]);
joinParts(
  woodenBase,
  innerBridge,
  outerTunnel,
  [new DrawerSlot(), cnf(0.6)],
  centeredBolt,
);
joinParts(
  woodenBase,
  outerBridge,
  outerTunnel,
  [new DrawerSlot(), cnf(0.6)],
  centeredBolt,
);

const center = openArea.x / 2 + tunnelWidth;

const postMirror = [];
for (const [br, innBr, outBr] of [
  [bridge, innerBridge, outerBridge],
  [secondBridge, secondInnerBridge, secondOuterBridge],
]) {
  for (const zee of [
    bridgeTop - joinOffset - woodThickness,
    bridgeHeight + joinOffset,
  ]) {
    const joinMatrix = a2m([0, 0, zee]);
    const joinPath = makeShelfOnPlane(
      joinMatrix,
      { woodThickness, joinOffset, zonePoint: [300, -35] },
      br.findChild(innBr),
      br.findChild(outBr),
    );
    const join = new FlatPart(
      `${br.name} join at ${zee}`,
      woodThickness,
      joinPath,
    );

    br.addChild(join, joinMatrix);
    joins.push(join);
  }
  const [upper, lower] = joins.slice(-2);

  postMirror.push(() => {
    upper.mirror([center, 0], [center, 1]);
    lower.mirror([center, 0], [center, 1]);

    joinParts(br, upper, innBr, defaultSlotLayout);
    joinParts(br, upper, outBr, defaultSlotLayout);

    joinParts(br, lower, outBr, defaultSlotLayout);
    joinParts(br, lower, innBr, defaultSlotLayout);
  });
}

const joinPath = new ShelfMaker(tunnelTop, {
  woodThickness,
  joinOffset,
  zonePoint: [300, 57],
})
  .addFlatPart(locatedInnerTunnel)
  .addFlatPart(locatedOuterTunnel)
  .addFlatPart(locatedInnerBridge, true)
  .addFlatPart(locatedSecondInnerBridge, true)
  .make();

const tunnelJoin = new FlatPart("tunnel shelf", woodThickness, joinPath);

tunnel.addChild(tunnelJoin, tunnelPlacement.inverse().multiply(tunnelTop));

joinParts(woodenBase, tunnelJoin, innerBridge, centeredBolt);
joinParts(woodenBase, tunnelJoin, secondInnerBridge, centeredBolt);

const sideSupportDrawers = (length) =>
  Array.from(
    { length },
    (x, i) => new CenterDrawerSlot((i + 0.5) / length, false),
  );

const nbDrawers = 5;
joinParts(tunnel, innerTunnel, tunnelJoin, sideSupportDrawers(nbDrawers));
joinParts(
  tunnel,
  tunnelJoin,
  innerTunnel,
  ...Array.from({ length: nbDrawers }, () => centeredBolt),
);

joinParts(tunnel, tunnelJoin, outerTunnel, defaultSlotLayout);
joinParts(woodenBase, tunnelJoin, innerBridge, centeredBolt);

fastenSubpartToFlatPart(
  woodenBase,
  nema23,
  innerBridge,
  motorHolesGetter,
  getFastenerKit,
);
fastenSubpartToFlatPart(
  woodenBase,
  bf12,
  outerTunnel,
  bkfTopHoleFinder,
  getFastenerKit,
);
fastenSubpartToFlatPart(
  woodenBase,
  bk12,
  outerTunnel,
  bkfTopHoleFinder,
  getFastenerKit,
);

const centerline = [
  [bridgeCenter, 0],
  [bridgeCenter, 1],
];
innerBridge.mirror(...centerline);
outerBridge.mirror(...centerline);
secondInnerBridge.mirror(...centerline);
secondOuterBridge.mirror(...centerline);

for (const join of joins) {
  joinParts(woodenBase, join, outerTunnel, centeredBolt);
}

for (const func of postMirror) {
  func();
}

tunnel.addChild(yRail, yRailPlacement);

const boltLocations = fastenSubpartToFlatPart(
  tunnel,
  yRail,
  tunnelJoin,
  yRailHoleFinder,
  getFastenerKit,
).filter((x, i) => i % 4 === 1);

for (const loc of boltLocations) {
  clearBoltOnFlatPart3(tunnel, innerTunnel, [loc], {
    depth: 15,
    width: 16,
    radius: 7,
  });
}

woodenBase.addChild(
  tunnel.mirror(),
  transformOnlyOrigin(tunnelPlacement, mirrorX),
  true,
);

woodenBase.addChild(
  screwAssy.mirror(),
  transformOnlyOrigin(screwPlacement, mirrorX),
  true,
);
