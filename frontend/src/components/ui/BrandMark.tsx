import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface BrandMarkProps {
  size?: number;
  color?: string;
  /** Çizgi kalınlığının boyuta oranı */
  strokeRatio?: number;
}

/**
 * Paydaş işareti: çatı + ortak alanı temsil eden bölünmüş daire.
 * Uygulama ikonuyla aynı geometriye sahiptir; ekranlarda vektör olarak çizilir.
 */
export const BrandMark = ({
  size = 96,
  color = '#FFFFFF',
  strokeRatio = 0.075,
}: BrandMarkProps) => {
  const c = size / 2;
  const s = size * 0.36;
  const stroke = size * strokeRatio;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* çatı */}
      <Path
        d={`M ${c - s} ${c - s * 0.12} L ${c} ${c - s * 0.92} L ${c + s} ${c - s * 0.12}`}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* gövde */}
      <Path
        d={`M ${c - s * 0.74} ${c - s * 0.02} L ${c - s * 0.74} ${c + s * 0.86} L ${c + s * 0.74} ${c + s * 0.86} L ${c + s * 0.74} ${c - s * 0.02}`}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* paylaşımı temsil eden bölünmüş daire */}
      <Circle
        cx={c}
        cy={c + s * 0.4}
        r={s * 0.3}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
      />
      <Path
        d={`M ${c} ${c + s * 0.1} L ${c} ${c + s * 0.7}`}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
};
