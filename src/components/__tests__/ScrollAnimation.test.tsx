import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ScrollAnimation from '../ScrollAnimation';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
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
  },
  getTransition: vi.fn(() => ({
    duration: 0.3,
    ease: 'easeOut',
    delay: 0,
  })),
}));

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

describe('ScrollAnimation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children correctly', () => {
    render(
      <ScrollAnimation animation="fadeIn">
        <div>Scroll Content</div>
      </ScrollAnimation>
    );

    expect(screen.getByText('Scroll Content')).toBeInTheDocument();
  });

  it('sets up IntersectionObserver with correct options', () => {
    render(
      <ScrollAnimation 
        animation="fadeIn" 
        threshold={0.5}
        rootMargin="10px"
      >
        <div>Scroll Content</div>
      </ScrollAnimation>
    );

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        threshold: 0.5,
        rootMargin: '10px',
      })
    );
  });

  it('applies custom className', () => {
    render(
      <ScrollAnimation animation="fadeIn" className="scroll-container">
        <div>Scroll Content</div>
      </ScrollAnimation>
    );

    expect(screen.getByTestId('motion-div')).toHaveClass('scroll-container');
  });

  it('handles reduced motion preference', () => {
    const { useReducedMotion } = require('@/hooks/useAnimations');
    useReducedMotion.mockReturnValue(true);

    render(
      <ScrollAnimation animation="fadeIn">
        <div>Scroll Content</div>
      </ScrollAnimation>
    );

    // Should render a regular div when reduced motion is preferred
    expect(screen.getByText('Scroll Content')).toBeInTheDocument();
  });

  it('handles staggered animations', () => {
    render(
      <ScrollAnimation animation="fadeIn" stagger staggerDelay={200}>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </ScrollAnimation>
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('uses default options when not provided', () => {
    render(
      <ScrollAnimation animation="slideUp">
        <div>Default Options</div>
      </ScrollAnimation>
    );

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      })
    );
  });
});