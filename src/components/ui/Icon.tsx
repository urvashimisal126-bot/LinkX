import React from 'react';
import * as LucideIcons from 'lucide-react';

export type IconName = keyof typeof LucideIcons;

export interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  badgeContainer?: 'circle-lime' | 'circle-cyan' | 'circle-dark' | 'none';
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 16,
  strokeWidth = 1.5,
  color = 'currentColor',
  className = '',
  style = {},
  badgeContainer = 'none',
}) => {
  // Find component from LucideIcons
  const IconComponent = (LucideIcons as Record<string, any>)[name] || LucideIcons.HelpCircle;

  if (badgeContainer === 'circle-lime') {
    return (
      <div
        style={{
          width: size + 16,
          height: size + 16,
          borderRadius: '50%',
          background: 'var(--accent)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#021D24',
          boxShadow: '0 0 12px rgba(204, 243, 0, 0.3)',
          ...style,
        }}
        className={className}
      >
        <IconComponent size={size} strokeWidth={strokeWidth} color="#021D24" />
      </div>
    );
  }

  if (badgeContainer === 'circle-cyan') {
    return (
      <div
        style={{
          width: size + 16,
          height: size + 16,
          borderRadius: '50%',
          background: 'var(--cyan-tint)',
          border: '1px solid rgba(106, 230, 239, 0.3)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--cyan)',
          boxShadow: '0 0 12px rgba(106, 230, 239, 0.2)',
          ...style,
        }}
        className={className}
      >
        <IconComponent size={size} strokeWidth={strokeWidth} color="var(--cyan)" />
      </div>
    );
  }

  if (badgeContainer === 'circle-dark') {
    return (
      <div
        style={{
          width: size + 14,
          height: size + 14,
          borderRadius: '50%',
          background: 'var(--panel-elevated)',
          border: '1px solid var(--border)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color || 'var(--cyan)',
          ...style,
        }}
        className={className}
      >
        <IconComponent size={size} strokeWidth={strokeWidth} color={color || 'var(--cyan)'} />
      </div>
    );
  }

  return (
    <IconComponent
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      style={style}
    />
  );
};

export default Icon;
