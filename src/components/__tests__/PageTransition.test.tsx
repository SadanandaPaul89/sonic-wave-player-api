import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PageTransition from '../PageTransition';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, Record<string, unknown>>(({ children, ...props }, ref) => (
      <div ref={ref} {...props} data-testid="motion-div">
        {children}
      </div>
    )),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock hooks
vi.mock('@/hooks/useAnimations', () => ({
  useReducedMotion: vi.fn(() => false),
}));

// Mock animation utilities
vi.mock('@/lib/animations', () => ({
  PAGE_TRANSITIONS: {
    slideLeft: {
      initial: { x: '-100%', opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: '100%', opacity: 0 },
    },
    slideRight: {
      initial: { x: '100%', opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: '-100%', opacity: 0 },
    },
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
  },

}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('PageTransition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children correctly', () => {
    renderWithRouter(
      <PageTransition>
        <div>Page Content</div>
      </PageTransition>
    );

    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('applies correct direction animation', () => {
    renderWithRouter(
      <PageTransition direction="left">
        <div>Page Content</div>
      </PageTransition>
    );

    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('handles reduced motion preference', async () => {
    const { useReducedMotion } = await import('@/hooks/useAnimations');
    (useReducedMotion as any).mockReturnValue(true);

    renderWithRouter(
      <PageTransition>
        <div>Page Content</div>
      </PageTransition>
    );

    // Should render a regular div when reduced motion is preferred
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    renderWithRouter(
      <PageTransition className="custom-page-class">
        <div>Page Content</div>
      </PageTransition>
    );

    expect(screen.getByTestId('motion-div')).toHaveClass('custom-page-class');
  });

  it('handles different transition directions', () => {
    const directions = ['left', 'right', 'up', 'down'] as const;
    
    directions.forEach(direction => {
      const { unmount } = renderWithRouter(
        <PageTransition direction={direction}>
          <div>Page Content {direction}</div>
        </PageTransition>
      );

      expect(screen.getByText(`Page Content ${direction}`)).toBeInTheDocument();
      unmount();
    });
  });
});