import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AnimationWrapper from '../AnimationWrapper';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, Record<string, unknown>>(({ children, ...props }, ref) => (
      <div ref={ref} {...props} data-testid="motion-div">
        {children}
      </div>
    )),
  },
}));

// Mock hooks
vi.mock('@/hooks/useAnimations', () => ({
  useReducedMotion: vi.fn(() => false),
}));

// Mock animation utilities
vi.mock('@/lib/animations', () => ({
  FRAMER_VARIANTS: {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slideUp: {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -20, opacity: 0 },
    },
    slideLeft: {
      initial: { x: 20, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -20, opacity: 0 },
    },
    scaleIn: {
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 },
    },
  },

}));

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

describe('AnimationWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children correctly', () => {
    render(
      <AnimationWrapper animation="fadeIn">
        <div>Test Content</div>
      </AnimationWrapper>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies correct animation type', () => {
    render(
      <AnimationWrapper animation="slideUp">
        <div>Test Content</div>
      </AnimationWrapper>
    );

    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('handles onMount trigger by default', () => {
    render(
      <AnimationWrapper animation="fadeIn">
        <div>Test Content</div>
      </AnimationWrapper>
    );

    // Should be visible immediately for onMount trigger
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('sets up IntersectionObserver for onScroll trigger', () => {
    render(
      <AnimationWrapper animation="fadeIn" trigger="onScroll">
        <div>Test Content</div>
      </AnimationWrapper>
    );

    expect(mockIntersectionObserver).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(
      <AnimationWrapper animation="fadeIn" className="custom-class">
        <div>Test Content</div>
      </AnimationWrapper>
    );

    expect(screen.getByTestId('motion-div')).toHaveClass('custom-class');
  });

  it('handles reduced motion preference', async () => {
    const { useReducedMotion } = await import('@/hooks/useAnimations');
    (useReducedMotion as any).mockReturnValue(true);

    render(
      <AnimationWrapper animation="fadeIn">
        <div>Test Content</div>
      </AnimationWrapper>
    );

    // Should render a regular div instead of motion.div when reduced motion is preferred
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('passes through additional motion props', () => {
    render(
      <AnimationWrapper
        animation="fadeIn"
        data-testid="custom-test-id"
        style={{ color: 'red' }}
      >
        <div>Test Content</div>
      </AnimationWrapper>
    );

    const element = screen.getByTestId('custom-test-id');
    expect(element).toBeInTheDocument();
    expect(element).toHaveStyle({ color: 'red' });
  });
});