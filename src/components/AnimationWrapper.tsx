import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { FRAMER_VARIANTS, getTransition } from '@/lib/animations';
import { useReducedMotion } from '@/hooks/useAnimations';

export type AnimationType = 'fadeIn' | 'slideUp' | 'slideLeft' | 'scaleIn';
export type AnimationTrigger = 'onMount' | 'onScroll' | 'onHover';

interface AnimationWrapperProps extends Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit'> {
  children: React.ReactNode;
  animation: AnimationType;
  delay?: number;
  duration?: number;
  trigger?: AnimationTrigger;
  className?: string;
  once?: boolean;
  threshold?: number;
}

const AnimationWrapper: React.FC<AnimationWrapperProps> = ({
  children,
  animation,
  delay = 0,
  duration = 300,
  trigger = 'onMount',
  className,
  once = true,
  threshold = 0.1,
  ...motionProps
}) => {
  const reducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = React.useState(trigger === 'onMount');
  const [hasAnimated, setHasAnimated] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Handle scroll-triggered animations
  React.useEffect(() => {
    if (trigger !== 'onScroll' || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && (!once || !hasAnimated)) {
          setIsVisible(true);
          if (once) {
            setHasAnimated(true);
            observer.unobserve(ref.current!);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(ref.current);

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [trigger, once, hasAnimated, threshold]);

  // Get animation variants
  const variants = FRAMER_VARIANTS[animation];

  // Create transition config
  const transition = getTransition(
    duration <= 200 ? 'fast' : duration <= 400 ? 'normal' : 'slow',
    'easeOut',
    delay / 1000
  );

  // Handle hover animations
  const hoverProps = trigger === 'onHover' ? {
    whileHover: variants.animate,
    initial: variants.initial,
  } : {};

  // If reduced motion is preferred, show content without animation
  if (reducedMotion) {
    return (
      <div ref={ref} className={className} {...(motionProps as any)}>
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
      exit={variants.exit}
      transition={transition}
      {...hoverProps}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

export { AnimationWrapper };
export default AnimationWrapper;