
// @ts-check

import {
  FlatPart,
  spindleClearedLineTo,
} from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
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
} from "./dimensions.js";

export const tunnelHeight = openArea.z;

const halfTunnel = new Path();
halfTunnel.moveTo([joinWidth + openArea.y / 2 + woodThickness, 0]);
halfTunnel.lineTo([0, 0]);
halfTunnel.lineTo([0, bridgeTop]);
halfTunnel.lineTo([joinWidth, bridgeTop]);
halfTunnel.lineTo([joinWidth, tunnelHeight]);
spindleClearedLineTo(
  halfTunnel,
  [joinWidth + openArea.y / 2 + woodThickness, tunnelHeight],
  defaultSpindleSize / 2,
);
halfTunnel.close();
halfTunnel.translate([-woodThickness, 0]);

export const innerTunnel = new FlatPart("inner tunnel", woodThickness, halfTunnel);

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

export const outerTunnel = new FlatPart(
  "outer tunnel",
  woodThickness,
  halfOuterTunnel,
);

export const tunnel = new Assembly("tunnel");

tunnel.addChild(innerTunnel);
tunnel.addChild(outerTunnel, a2m([0, 0, -xRailSupportWidth]));
