import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '@/lib/animations';

// Hook to detect user's motion preference
export const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reducedMotion;
};

// Hook for intersection observer-based animations
export const useIntersectionAnimation = (
  threshold = 0.1,
  rootMargin = '0px'
) => {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<Element | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Optionally unobserve after first intersection
          observer.unobserve(ref);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref);

    return () => {
      if (ref) observer.unobserve(ref);
    };
  }, [ref, threshold, rootMargin]);

  return { isVisible, ref: setRef };
};

// Hook for staggered animations
export const useStaggeredAnimation = (itemCount: number, delay = 100) => {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const reducedMotion = useReducedMotion();

  const triggerAnimation = () => {
    if (reducedMotion) {
      // Show all items immediately if reduced motion is preferred
      setVisibleItems(new Set(Array.from({ length: itemCount }, (_, i) => i)));
      return;
    }

    // Stagger the animation
    Array.from({ length: itemCount }, (_, i) => i).forEach((index) => {
      setTimeout(() => {
        setVisibleItems(prev => new Set([...prev, index]));
      }, index * delay);
    });
  };

  const resetAnimation = () => {
    setVisibleItems(new Set());
  };

  return {
    visibleItems,
    triggerAnimation,
    resetAnimation,
    isItemVisible: (index: number) => visibleItems.has(index),
  };
};

// Hook for hover animations
export const useHoverAnimation = () => {
  const [isHovered, setIsHovered] = useState(false);

  const hoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  return { isHovered, hoverProps };
};