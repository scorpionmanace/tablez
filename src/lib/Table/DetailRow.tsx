import type { FC, ReactNode, CSSProperties } from 'react';
import type { TableTheme } from '../types';

interface DetailRowProps {
  colSpan: number;
  record: any;
  theme: TableTheme;
  detailRenderer: (record: any) => ReactNode;
  height?: number;
  style?: CSSProperties;
}

export const DetailRow: FC<DetailRowProps> = ({
  colSpan,
  record,
  theme,
  detailRenderer,
  style,
}) => {
  const borderColor = theme.tokens?.borderColor ?? '#e2e8f0';
  const bgColor = theme.tokens?.backgroundColor ?? '#fff';

  return (
    <tr style={style}>
      <td
        colSpan={colSpan}
        style={{
          padding: '12px 20px',
          borderBottom: `1px solid ${borderColor}`,
          backgroundColor: bgColor,
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.05)',
        }}
      >
        {detailRenderer(record)}
      </td>
    </tr>
  );
};
