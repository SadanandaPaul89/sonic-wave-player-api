import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { PAGE_TRANSITIONS, getTransition } from '@/lib/animations';
import { useReducedMotion } from '@/hooks/useAnimations';
import { PageTransitionProps } from '@/types/animations';

interface PageTransitionWrapperProps extends PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

const PageTransition: React.FC<PageTransitionWrapperProps> = ({
  children,
  direction = 'right',
  duration = 'normal',
  easing = 'easeOut',
  className,
}) => {
  const location = useLocation();
  const reducedMotion = useReducedMotion();

  // Get transition variants based on direction
  const getVariants = () => {
    switch (direction) {
      case 'left':
        return PAGE_TRANSITIONS.slideLeft;
      case 'right':
        return PAGE_TRANSITIONS.slideRight;
      case 'up':
        return {
          initial: { y: '100%', opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: '-100%', opacity: 0 },
        };
      case 'down':
        return {
          initial: { y: '-100%', opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: '100%', opacity: 0 },
        };
      default:
        return PAGE_TRANSITIONS.fade;
    }
  };

  const variants = getVariants();
  const transition = getTransition(duration, easing);

  // If reduced motion is preferred, just show content without animation
  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className={className}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;