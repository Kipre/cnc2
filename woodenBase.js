// @ts-check

import { nx3, ny3, nz3, x3, y2, y3, z3, zero2, zero3 } from "./cade/lib/defaults.js";
import {
  cloneAndMirrorChildren,
  cloneChildrenWithTransform,
  findFlatPartIntersection,
  FlatPart,
  halfLapCrossJoin,
  joinParts,
  makeShelfOnPlane,
  projectPlane,
  spindleClearedLineTo,
} from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { DrawerSlot, makeTenon, TenonMortise } from "./cade/lib/slots.js";
import {
  CylinderNutFastener,
  defaultSlotLayout,
  m6Fastener,
} from "./fasteners.js";
import { Path } from "./cade/tools/path.js";
import { a2m, transformPoint3 } from "./cade/tools/transform.js";
import {
  openArea,
  woodThickness,
  xRailSupportWidth,
  zAxisTravel,
  yRailEndSpace,
  joinWidth,
  bridgeTop,
  joinOffset,
  joinSpace,
  tunnelOpeningHeight,
  tunnelHeight,
  roundingRadius,
  screwSinking,
  motorSupportWidth,
  motorSupportHeight,
  defaultSpindleSize,
  screwShaftZ,
  bfkSupportExtension,
} from "./dimensions.js";
import { fastenSubpartToFlatPart, yRail, yRailHoleFinder } from "./rails.js";
import { bf12, bk12, bk12Thickness, bkfHoleFinder, makeBKPlateCutout, roller, screwAssy, screwShaftPlacement } from "./screw.js";
import { minus3, mult3, norm3 } from "./cade/tools/3d.js";
import { innerTunnel, outerTunnel, tunnel } from "./tunnel.js";
import { bridge, innerBridge, outerBridge, secondBridge, secondInnerBridge, secondOuterBridge } from "./bridge.js";
import { motorHolesGetter, motorWithCoupler, nema23 } from "./motor.js";
import { debugGeometry } from "./cade/tools/svg.js";


export const woodenBase = new Assembly("wooden frame");

const bridgePlacement = a2m([-xRailSupportWidth, -woodThickness, 0]);
woodenBase.addChild(bridge, bridgePlacement);

const secondBridgePlacement = a2m([-xRailSupportWidth, joinWidth + openArea.y + woodThickness, 0]);
woodenBase.addChild(secondBridge, secondBridgePlacement);

const tunnelPlacement = a2m(
  [-woodThickness, -joinWidth - woodThickness, 0],
  x3,
  y3,
);
woodenBase.addChild(tunnel, tunnelPlacement);


const locatedInnerBridge = woodenBase.findChild(innerBridge);
const locatedInnerTunnel = woodenBase.findChild(innerTunnel);
const locatedOuterTunnel = woodenBase.findChild(outerTunnel);
const locatedSecondInnerBridge = woodenBase.findChild(secondInnerBridge);

const layout = [
  new CylinderNutFastener(0.8),
  new TenonMortise(0.55),
  new CylinderNutFastener(0.08),
];
const centeredBolt = [new CylinderNutFastener(0.5)];
const layout2 = [
  new CylinderNutFastener(0.07),
  new TenonMortise(0.25),
  new CylinderNutFastener(0.85),
];

const joins = [];

const nutAndSlot = [new CylinderNutFastener(0.65), new TenonMortise(0.3)];

joinParts(woodenBase, innerBridge, innerTunnel, layout);
joinParts(woodenBase, innerTunnel, innerBridge, [new CylinderNutFastener(0.3)]);
joinParts(woodenBase, innerTunnel, outerBridge, layout2);
joinParts(woodenBase, innerBridge, outerTunnel, centeredBolt, centeredBolt);
joinParts(woodenBase, outerBridge, outerTunnel, centeredBolt, nutAndSlot);

joinParts(woodenBase, secondInnerBridge, innerTunnel, layout);
joinParts(woodenBase, innerTunnel, secondInnerBridge, [new CylinderNutFastener(0.3)]);
joinParts(woodenBase, innerTunnel, secondOuterBridge, layout2);
joinParts(woodenBase, secondInnerBridge, outerTunnel, centeredBolt, centeredBolt);
joinParts(woodenBase, secondOuterBridge, outerTunnel, centeredBolt, nutAndSlot);

const center = openArea.x / 2 + xRailSupportWidth;

const postMirror = [];
for (const [br, innBr, outBr] of [
  [bridge, innerBridge, outerBridge],
  [secondBridge, secondInnerBridge, secondOuterBridge],
]) {
  for (const zee of [
    bridgeTop - joinOffset - woodThickness,
    openArea.z + joinOffset,
  ]) {
    const joinMatrix = a2m([0, 0, zee]);
    const joinPath = makeShelfOnPlane(
      joinMatrix,
      woodThickness,
      br.findChild(innBr),
      br.findChild(outBr),
    );
    const join = new FlatPart(`${br.name} join at ${zee}`, woodThickness, joinPath)

    br.addChild(join, joinMatrix);
    joins.push(join);
  }
  const [upper, lower] = joins.slice(-2);

  halfLapCrossJoin(locatedInnerTunnel, woodenBase.findChild(lower), br === bridge);
  joinParts(woodenBase, innerTunnel, upper, centeredBolt);


  postMirror.push(() => {
    upper.mirror([center, 0], [center, 1]);
    lower.mirror([center, 0], [center, 1]);

    joinParts(br, upper, innBr, defaultSlotLayout);
    joinParts(br, upper, outBr, defaultSlotLayout);

    joinParts(br, lower, innBr, centeredBolt, defaultSlotLayout, centeredBolt);
    joinParts(br, lower, outBr, defaultSlotLayout);
  });

}

const tunnelJoins = [];
for (const zee of [tunnelHeight - joinOffset - woodThickness, joinOffset]) {
  const joinMatrix = a2m([0, 0, zee], z3, y3);
  const joinPath = makeShelfOnPlane(
    joinMatrix,
    woodThickness,
    locatedInnerTunnel,
    locatedInnerBridge,
    locatedOuterTunnel,
    locatedSecondInnerBridge,
  );
  const join = new FlatPart(`tunnel join at ${zee}`, woodThickness, joinPath)

  tunnel.addChild(join, tunnelPlacement.inverse().multiply(joinMatrix));
  tunnelJoins.push(join);

  joinParts(woodenBase, join, innerBridge, centeredBolt);
  joinParts(woodenBase, join, secondInnerBridge, centeredBolt);
  joinParts(tunnel, join, innerTunnel, defaultSlotLayout);
  joinParts(tunnel, join, outerTunnel, defaultSlotLayout);
}

innerBridge.mirror();
outerBridge.mirror();
secondInnerBridge.mirror();
secondOuterBridge.mirror();

joinParts(woodenBase, joins[1], outerTunnel, centeredBolt);
joinParts(woodenBase, joins[3], outerTunnel, centeredBolt);

for (const func of postMirror) {
  func();
}


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


fastenSubpartToFlatPart(tunnel, yRail, tunnelJoins[0], yRailHoleFinder);

{
  const locatedMirroredInnerBridge = woodenBase.findChild(secondInnerBridge);
  const mat = locatedMirroredInnerBridge.placement;
  const hinge = findFlatPartIntersection(locatedMirroredInnerBridge, locatedOuterTunnel, true, true);

  const onBridge = a2m(
    hinge,
    transformPoint3(mat, z3, true),
    transformPoint3(mat, nx3, true)
  )

  const onScrew = a2m([0, tunnelOpeningHeight / 2 + joinSpace, screwSinking], x3, nz3);

  const screwPlacement = onBridge.multiply(onScrew.inverse()).rotate(180, 0, 0);
  woodenBase.addChild(screwAssy, screwPlacement);

  const shaftCenter = screwPlacement.multiply(screwShaftPlacement);
  const coAxial = a2m(
    transformPoint3(shaftCenter, zero3),
    transformPoint3(shaftCenter, x3, true),
  );
  woodenBase.addChild(motorWithCoupler, coAxial);
  fastenSubpartToFlatPart(woodenBase, nema23, innerBridge, motorHolesGetter);

  woodenBase.addChild(roller, coAxial.translate(0, 0, -500).rotate(0, 0, -90));

  fastenSubpartToFlatPart(woodenBase, bf12, secondInnerBridge, bkfHoleFinder);

  const location = woodenBase.findChild(bk12).placement
  const bkSupportPlacement = location.multiply(a2m([bk12Thickness / 2, 0, 0], x3));

  const bkSupportPath = makeShelfOnPlane(
    bkSupportPlacement,
    woodThickness,
    locatedInnerTunnel,
    woodenBase.findChild(tunnelJoins[0]),
    locatedOuterTunnel,
    woodenBase.findChild(tunnelJoins[1]),
  );

  const bkSupportTenon = makeTenon(motorSupportWidth, bfkSupportExtension, defaultSpindleSize, 3);
  bkSupportPath.insertFeature(bkSupportTenon, 2, { fromStart: screwShaftZ - joinOffset - woodThickness });
  const plateCutout = makeBKPlateCutout(defaultSpindleSize, 3);
  bkSupportPath.insertFeature(plateCutout, 6, { fromStart: motorSupportWidth / 2 - 3 });

  const bkSupport = new FlatPart(`bkSupport`, woodThickness, bkSupportPath)

  tunnel.addChild(bkSupport, tunnelPlacement.inverse().multiply(bkSupportPlacement));

  joinParts(tunnel, bkSupport, innerTunnel, [
    new CylinderNutFastener(0.8),
    new TenonMortise(0.3),
  ]);
  joinParts(tunnel, bkSupport, tunnelJoins[0], [new DrawerSlot()]);
  joinParts(tunnel, bkSupport, tunnelJoins[1], [new CylinderNutFastener(0.7), new DrawerSlot(false)]);
  joinParts(tunnel, bkSupport, outerTunnel, [], [new CylinderNutFastener(0.2)]);

  fastenSubpartToFlatPart(woodenBase, bk12, bkSupport, bkfHoleFinder);
}

woodenBase.addChild(
  tunnel.mirror(),
  new DOMMatrix()
    .translate(openArea.x + 2 * woodThickness)
    .multiply(tunnelPlacement),
  true,
);
