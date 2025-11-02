// @ts-check

export const yRailLength = 1000;
export const zRailLength = 350;

export const woodThickness = 15;
export const carrierWheelbase = 200;

export const typicalWidth = 100;
export const xRailSupportWidth = typicalWidth;

export const zAxisTravel = zRailLength - carrierWheelbase;

export const yRailEndSpace = 18;
export const aluExtrusionLength = 1000;
const xRailLength = aluExtrusionLength;

export const openArea = {
  x: xRailLength,
  y: yRailLength + yRailEndSpace,
  z: zAxisTravel,
};

export const defaultSpindleSize = 6;

export const mediumClearance = 2;

export const joinOffset = 10;
export const joinWidth = typicalWidth - 2 * woodThickness;
export const joinSpace = 2 * joinOffset + woodThickness;

export const bridgeTopThickness = zAxisTravel;
export const bridgeTop = openArea.z + bridgeTopThickness;

export const tunnelHeight = openArea.z;
export const tunnelOpeningHeight = tunnelHeight - 15 - 2 * joinSpace;

export const screwShaftZ = tunnelOpeningHeight / 2 + joinSpace;

export const motorBodyLength = 113.5;
export const motorSide = 56;
export const roundingRadius = 10;
export const motorSupportPadding = (tunnelOpeningHeight - motorSide) / 2;

export const motorCouplerDiameter = 25;
export const motorCenteringCylinderDiameter = 38.1;

export const screwSinking = -20;
export const screwCenterToSupport = 18 + 7;
export const motorSupportWidth = motorSide + 2 * motorSupportPadding;
export const screwCenter = screwSinking + screwCenterToSupport;
export const motorSupportHeight = screwCenter + motorSupportWidth / 2;
export const motorSpaceDepth = screwCenter - motorSupportWidth / 2;

export const bfkSupportExtension = woodThickness - 1;

export const aluExtrusionHeight = 149;
export const aluExtrusionThickness = 30;

export const interFlatRail = 4 * aluExtrusionThickness;

export const gantryPosition = 450;
export const xPosition = 450;
export const yRailPlacementOnTunnel = joinWidth / 2 + woodThickness / 2;

