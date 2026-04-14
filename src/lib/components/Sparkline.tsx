import type { FC } from 'react';
import type { SparklineConfig } from '../types';

interface SparklineProps {
  data: number[];
  config: SparklineConfig;
  primaryColor?: string;
}

export const Sparkline: FC<SparklineProps> = ({ data, config, primaryColor = '#3b82f6' }) => {
  const { type = 'line', color = primaryColor, width = 80, height = 30 } = config;

  if (!Array.isArray(data) || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const padX = 2;
  const padY = 2;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const xStep = data.length > 1 ? innerW / (data.length - 1) : innerW;

  // Normalise a value to Y coordinate (inverted: 0 at bottom)
  const toY = (v: number) => padY + innerH - ((v - min) / range) * innerH;
  const toX = (i: number) => padX + (data.length > 1 ? i * xStep : innerW / 2);

  if (type === 'bar') {
    const barWidth = Math.max(1, innerW / data.length - 1);
    return (
      <svg width={width} height={height} style={{ display: 'block' }}>
        {data.map((v, i) => {
          const barHeight = Math.max(1, ((v - min) / range) * innerH);
          return (
            <rect
              key={i}
              x={padX + i * (innerW / data.length)}
              y={toY(v)}
              width={barWidth}
              height={barHeight}
              fill={color}
              rx={1}
              opacity={0.8}
            />
          );
        })}
      </svg>
    );
  }

  // Build path points
  const points = data.map((v, i) => `${toX(i)},${toY(v)}`);

  if (type === 'area') {
    const bottom = padY + innerH;
    const areaPath = [
      `M ${toX(0)},${bottom}`,
      ...data.map((v, i) => `L ${toX(i)},${toY(v)}`),
      `L ${toX(data.length - 1)},${bottom}`,
      'Z',
    ].join(' ');

    return (
      <svg width={width} height={height} style={{ display: 'block' }}>
        <path d={areaPath} fill={color} opacity={0.2} />
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Default: line
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Last value dot */}
      <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1])} r={2.5} fill={color} />
    </svg>
  );
};
