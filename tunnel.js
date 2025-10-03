// @ts-check

import { z3, zero3 } from "./cade/lib/defaults.js";
import {
  FlatPart,
  spindleClearedLineTo,
} from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { norm3 } from "./cade/tools/3d.js";
import { Path } from "./cade/tools/path.js";
import { a2m, transformPoint3 } from "./cade/tools/transform.js";
import {
  openArea,
  woodThickness,
  xRailSupportWidth,
  joinWidth,
  bridgeTop,
  defaultSpindleSize,
  joinOffset,
  joinSpace,
  tunnelOpeningHeight,
  screwShaftZ,
  tunnelHeight,
  motorBodyLength,
  roundingRadius,
} from "./dimensions.js";

const innerTunnelTop = bridgeTop - joinOffset - woodThickness;

const tunnelPath = new Path();
tunnelPath.moveTo([joinWidth + openArea.y / 2 + woodThickness, 0]);
tunnelPath.lineTo([0, 0]);
tunnelPath.lineTo([0, innerTunnelTop]);
tunnelPath.lineTo([joinWidth, innerTunnelTop]);
tunnelPath.lineTo([joinWidth, tunnelHeight]);
spindleClearedLineTo(
  tunnelPath,
  [joinWidth + openArea.y / 2 + woodThickness, tunnelHeight],
  defaultSpindleSize / 2,
);
tunnelPath.mirror();
tunnelPath.translate([-woodThickness, 0]);

export const innerTunnel = new FlatPart("inner tunnel", woodThickness, tunnelPath);

const fullWidth = joinWidth + openArea.y / 2 + 2 * woodThickness + joinOffset;
const motorSpace = motorBodyLength - joinWidth - woodThickness + joinSpace;
const braceRadius = roundingRadius + joinSpace;
const outerHeightDiff = 100;

let outerTunnelPath = new Path();
outerTunnelPath.moveTo([0, 0]);
outerTunnelPath.lineTo([fullWidth, 0]);
outerTunnelPath.lineTo([fullWidth, bridgeTop - outerHeightDiff]);
outerTunnelPath.lineTo([openArea.y / 2 - joinOffset, bridgeTop - outerHeightDiff]);
outerTunnelPath.lineTo([openArea.y / 2 - joinOffset, tunnelHeight + 10]);
outerTunnelPath.lineTo([0, tunnelHeight + 10]);
outerTunnelPath.mirror();

const motorContour = new Path();
motorContour.moveTo([fullWidth, 0]);
motorContour.lineTo([fullWidth + motorSpace, 0]);
motorContour.arcTo([fullWidth + motorSpace, 2 * screwShaftZ], braceRadius);
// halfOuterTunnel.arcTo([fullWidth, 2 * screwShaftZ], braceRadius);
motorContour.arcTo([fullWidth, bridgeTop - outerHeightDiff], braceRadius);
motorContour.close();

outerTunnelPath = outerTunnelPath.booleanUnion(motorContour);

outerTunnelPath = outerTunnelPath
  .scale(-1, 1)
  .translate([fullWidth - woodThickness - joinOffset, 0]);

export const outerTunnel = new FlatPart(
  "outer tunnel",
  woodThickness,
  outerTunnelPath,
);

const slotExtension = 150;
outerTunnel.addInsides(
  Path.makeRoundedRect(
    openArea.y + slotExtension + 50,
    tunnelOpeningHeight,
    roundingRadius,
  ).translate([-slotExtension + joinWidth + joinSpace - joinOffset, joinSpace]),
);

export const tunnel = new Assembly("tunnel");

tunnel.addChild(innerTunnel);
tunnel.addChild(outerTunnel, a2m([0, 0, -xRailSupportWidth]));
