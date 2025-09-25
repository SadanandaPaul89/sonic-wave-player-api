import React from 'react';
import { motion, HTMLMotionProps, Transition } from 'framer-motion';
import { FRAMER_VARIANTS } from '@/lib/animations';
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
    const currentRef = ref.current;
    if (trigger !== 'onScroll' || !currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && (!once || !hasAnimated)) {
          setIsVisible(true);
          if (once) {
            setHasAnimated(true);
            observer.unobserve(entry.target);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [trigger, once, hasAnimated, threshold]);

  // Get animation variants
  const variants = FRAMER_VARIANTS[animation];

  // Create transition config with proper typing
  const transition: Transition = {
    duration: duration <= 200 ? 0.2 : duration <= 400 ? 0.3 : 0.5,
    ease: 'easeOut',
    delay: delay / 1000,
  };

  // Handle hover animations
  const hoverProps = trigger === 'onHover' ? {
    whileHover: variants.animate,
    initial: variants.initial,
  } : {};

  // If reduced motion is preferred, show content without animation
  if (reducedMotion) {
    return (
      <div ref={ref} className={className} {...(motionProps as Record<string, unknown>)}>
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