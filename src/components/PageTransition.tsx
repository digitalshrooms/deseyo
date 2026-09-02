import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  direction?: 'up' | 'down';
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  return <>{children}</>;
};
