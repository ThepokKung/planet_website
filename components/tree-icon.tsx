import React from 'react';

interface TreeIconProps {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  background?: string;
  opacity?: number;
  rotation?: number;
  shadow?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
}

const TreeIcon = ({
  size = undefined,
  color = '#000000',
  strokeWidth = 2,
  background = 'transparent',
  opacity = 1,
  rotation = 0,
  shadow = 0,
  flipHorizontal = false,
  flipVertical = false
}: TreeIconProps) => {
  const transforms = [];
  if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
  if (flipHorizontal) transforms.push('scaleX(-1)');
  if (flipVertical) transforms.push('scaleY(-1)');

  // The path data uses a large coordinate system (approx 1536x1536).
  // We set the base viewBox to match this grid so the icon is visible and scales correctly.
  const baseSize = 1536;
  const viewBox = `0 0 ${baseSize} ${baseSize}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        opacity,
        transform: transforms.join(' ') || undefined,
        filter: shadow > 0 ? `drop-shadow(0 ${shadow}px ${shadow * 2}px rgba(0,0,0,0.3))` : undefined,
        backgroundColor: background !== 'transparent' ? background : undefined
      }}
    >
      <path fill="currentColor" d="M1472 1472q0 26-19 45t-45 19H946q1 17 6 87.5t5 108.5q0 25-18 42.5t-43 17.5H576q-25 0-43-17.5t-18-42.5q0-38 5-108.5t6-87.5H64q-26 0-45-19t-19-45t19-45l402-403H192q-26 0-45-19t-19-45t19-45l402-403H352q-26 0-45-19t-19-45t19-45L691 19q19-19 45-19t45 19l384 384q19 19 19 45t-19 45t-45 19H923l402 403q19 19 19 45t-19 45t-45 19h-229l402 403q19 19 19 45"/>
    </svg>
  );
};

export default TreeIcon;
