import React from 'react';
import { FreeworkLoader } from './FreeworkLoader';

interface LoadingSkeletonProps {
  count?: number;
  label?: string;
  showQuote?: boolean;
  minHeight?: string;
  card?: boolean;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  label = 'Loading data...',
  showQuote = true,
  minHeight = 'min-h-[280px]',
  card = true,
}) => {
  return (
    <FreeworkLoader
      label={label}
      showQuote={showQuote}
      minHeight={minHeight}
      card={card}
    />
  );
};
