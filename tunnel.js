// @ts-check

import { tunnelOuterLocation } from "./assemblyInvariants.js";
import { FlatPart } from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { Path } from "./cade/tools/path.js";
import { debugGeometry } from "./cade/tools/svg.js";
import { a2m } from "./cade/tools/transform.js";
import {
  bridgeTop,
  joinOffset,
  joinSpace,
  joinWidth,
  motorBodyLength,
  motorSide,
  openArea,
  roundingRadius,
  screwShaftZ,
  tunnelHeight,
  woodThickness,
  yRange,
} from "./dimensions.js";

const tunnelPath = Path.makeRect(openArea.y, tunnelHeight);
tunnelPath.translate([-woodThickness, 0]);

export const innerTunnel = new FlatPart(
  "inner tunnel",
  woodThickness,
  tunnelPath,
);

const bridgeWidth = joinWidth + 2 * woodThickness + joinOffset;
const fullWidth = openArea.y / 2 + bridgeWidth;
const motorSpace = motorBodyLength - joinWidth - woodThickness + joinSpace;
const braceRadius = roundingRadius + joinSpace;
const outerHeightDiff = 0;
const dip = 45;

const outsideHeight = bridgeTop - outerHeightDiff;
let outerTunnelPath = Path.makeRect(fullWidth * 2, outsideHeight).recenter({
  onlyX: true,
});

outerTunnelPath = outerTunnelPath.booleanDifference(
  Path.makeRect(yRange + motorSide * 1.3, dip * 2)
    .recenter()
    .translate([-67.5, outsideHeight]),
);

outerTunnelPath.roundFilletAll(roundingRadius);

const motorContour = new Path();
motorContour.moveTo([fullWidth, 0]);
motorContour.lineTo([fullWidth + motorSpace, 0]);
motorContour.arcTo([fullWidth + motorSpace, 2 * screwShaftZ], braceRadius);
motorContour.arcTo([fullWidth, bridgeTop - outerHeightDiff], braceRadius);
motorContour.close();

outerTunnelPath = outerTunnelPath
  .scale(-1, 1)
  .translate([fullWidth - woodThickness - joinOffset, 0]);

export const outerTunnel = new FlatPart(
  "outer tunnel",
  woodThickness,
  outerTunnelPath,
);

export const tunnel = new Assembly("tunnel");

tunnel.addChild(innerTunnel, a2m([joinWidth + woodThickness, 0, 0]));
tunnel.addChild(outerTunnel, tunnelOuterLocation);
