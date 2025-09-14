import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FRAMER_VARIANTS, getTransition } from '@/lib/animations';
import { useReducedMotion } from '@/hooks/useAnimations';
import { AnimationType, AnimationDuration, AnimationEasing } from '@/types/animations';

interface ScrollAnimationProps {
  children: React.ReactNode;
  animation: AnimationType;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
  duration?: AnimationDuration;
  easing?: AnimationEasing;
  className?: string;
  stagger?: boolean;
  staggerDelay?: number;
}

const ScrollAnimation: React.FC<ScrollAnimationProps> = ({
  children,
  animation,
  threshold = 0.1,
  rootMargin = '0px 0px -50px 0px',
  triggerOnce = true,
  delay = 0,
  duration = 'normal',
  easing = 'easeOut',
  className,
  stagger = false,
  staggerDelay = 100,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    // Create intersection observer with performance optimizations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!triggerOnce || !hasTriggered) {
              setIsVisible(true);
              if (triggerOnce) {
                setHasTriggered(true);
                observer.unobserve(entry.target);
              }
            }
          } else if (!triggerOnce) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  // Get animation variants
  const variants = FRAMER_VARIANTS[animation];
  const transition = getTransition(duration, easing, delay / 1000);

  // Handle staggered animations for multiple children
  const containerVariants = stagger ? {
    animate: {
      transition: {
        staggerChildren: staggerDelay / 1000,
      },
    },
  } : undefined;

  // If reduced motion is preferred, show content without animation
  if (reducedMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={variants.initial}
      animate={isVisible ? variants.animate : variants.initial}
      transition={transition}
      variants={containerVariants}
    >
      {stagger ? (
        React.Children.map(children, (child, index) => (
          <motion.div
            key={index}
            variants={variants}
            transition={getTransition(duration, easing, (delay + index * staggerDelay) / 1000)}
          >
            {child}
          </motion.div>
        ))
      ) : (
        children
      )}
    </motion.div>
  );
};

export { ScrollAnimation };
export default ScrollAnimation;