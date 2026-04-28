import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius = '4px',
  className = '',
  style = {}
}) => {
  return (
    <motion.div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--glass) 25%, rgba(255,255,255,0.1) 50%, var(--glass) 75%)',
        backgroundSize: '200% 100%',
        ...style
      }}
      animate={{
        backgroundPosition: ['200% 0', '-200% 0']
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear'
      }}
    />
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`glass ${className}`} style={{ padding: '1.5rem', borderRadius: '14px' }}>
    <Skeleton height="1.5rem" width="60%" style={{ marginBottom: '1rem' }} />
    <Skeleton height="1rem" width="80%" style={{ marginBottom: '0.5rem' }} />
    <Skeleton height="1rem" width="40%" style={{ marginBottom: '1.5rem' }} />
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Skeleton height="2.5rem" width="50%" borderRadius="8px" />
      <Skeleton height="2.5rem" width="50%" borderRadius="8px" />
    </div>
  </div>
);

export const SkeletonList: React.FC<{ count?: number; className?: string }> = ({
  count = 3,
  className = ''
}) => (
  <div className={`glass ${className}`} style={{ padding: '1.5rem' }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{ padding: '1rem 0', borderBottom: i < count - 1 ? '1px solid var(--glass-border)' : 'none' }}>
        <Skeleton height="1rem" width="70%" style={{ marginBottom: '0.5rem' }} />
        <Skeleton height="0.8rem" width="50%" />
      </div>
    ))}
  </div>
);

export const SkeletonGrid: React.FC<{
  columns?: number;
  rows?: number;
  className?: string;
}> = ({ columns = 3, rows = 2, className = '' }) => (
  <div
    className={className}
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '1rem'
    }}
  >
    {Array.from({ length: columns * rows }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);