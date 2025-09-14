import { Variants } from 'framer-motion';

export interface AnimationConfig {
  reducedMotion: boolean;
  transitionDuration: number;
  easing: string;
  enablePageTransitions: boolean;
  enableMicroInteractions: boolean;
}

export interface AnimationVariants extends Variants {
  initial: any;
  animate: any;
  exit?: any;
}

export interface TransitionConfig {
  duration: number;
  ease: string;
  delay?: number;
  type?: string;
  stiffness?: number;
  damping?: number;
}

export interface ScrollAnimationConfig {
  threshold: number;
  rootMargin: string;
  triggerOnce: boolean;
}

export interface StaggerConfig {
  delayChildren?: number;
  staggerChildren?: number;
  staggerDirection?: number;
}

export type AnimationType = 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scaleIn' | 'scaleOut';
export type AnimationTrigger = 'onMount' | 'onScroll' | 'onHover' | 'onFocus';
export type AnimationEasing = 'easeOut' | 'easeIn' | 'easeInOut' | 'bounce' | 'spring';
export type AnimationDuration = 'fast' | 'normal' | 'slow' | 'slower';

export interface AnimationProps {
  animation: AnimationType;
  trigger?: AnimationTrigger;
  duration?: AnimationDuration | number;
  delay?: number;
  easing?: AnimationEasing;
  once?: boolean;
  threshold?: number;
  stagger?: StaggerConfig;
}

export interface PageTransitionProps {
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: AnimationDuration;
  easing?: AnimationEasing;
}

export interface MicroInteractionProps {
  hover?: boolean;
  focus?: boolean;
  active?: boolean;
  scale?: number;
  rotate?: number;
  brightness?: number;
}