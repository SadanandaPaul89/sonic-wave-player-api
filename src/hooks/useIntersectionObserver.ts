import { useEffect, useRef, useState, useCallback } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
  skip?: boolean;
}

interface UseIntersectionObserverReturn {
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
  ref: React.RefObject<Element>;
}

// Global observer instances to reuse across components
const observerMap = new Map<string, IntersectionObserver>();
const elementCallbackMap = new Map<Element, Set<(entry: IntersectionObserverEntry) => void>>();

const createObserverKey = (options: IntersectionObserverInit): string => {
  return JSON.stringify({
    threshold: options.threshold,
    rootMargin: options.rootMargin,
    root: options.root,
  });
};

export const useIntersectionObserver = ({
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = false,
  skip = false,
}: UseIntersectionObserverOptions = {}): UseIntersectionObserverReturn => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);
  const ref = useRef<Element>(null);

  const handleIntersection = useCallback(
    (observerEntry: IntersectionObserverEntry) => {
      setEntry(observerEntry);
      
      if (observerEntry.isIntersecting) {
        if (!triggerOnce || !hasTriggered) {
          setIsIntersecting(true);
          if (triggerOnce) {
            setHasTriggered(true);
          }
        }
      } else if (!triggerOnce) {
        setIsIntersecting(false);
      }
    },
    [triggerOnce, hasTriggered]
  );

  useEffect(() => {
    const element = ref.current;
    if (!element || skip) return;

    const observerOptions: IntersectionObserverInit = {
      threshold,
      rootMargin,
    };

    const observerKey = createObserverKey(observerOptions);
    
    // Get or create observer instance
    let observer = observerMap.get(observerKey);
    if (!observer) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const callbacks = elementCallbackMap.get(entry.target);
          if (callbacks) {
            callbacks.forEach((callback) => callback(entry));
          }
        });
      }, observerOptions);
      observerMap.set(observerKey, observer);
    }

    // Add callback for this element
    if (!elementCallbackMap.has(element)) {
      elementCallbackMap.set(element, new Set());
    }
    elementCallbackMap.get(element)!.add(handleIntersection);

    // Start observing
    observer.observe(element);

    return () => {
      if (element && observer) {
        const callbacks = elementCallbackMap.get(element);
        if (callbacks) {
          callbacks.delete(handleIntersection);
          if (callbacks.size === 0) {
            elementCallbackMap.delete(element);
            observer.unobserve(element);
          }
        }
      }
    };
  }, [threshold, rootMargin, skip, handleIntersection]);

  // Cleanup observers when no longer needed
  useEffect(() => {
    return () => {
      // Clean up empty observers
      observerMap.forEach((observer, key) => {
        let hasElements = false;
        elementCallbackMap.forEach((callbacks, element) => {
          if (callbacks.size > 0) {
            hasElements = true;
          }
        });
        
        if (!hasElements) {
          observer.disconnect();
          observerMap.delete(key);
        }
      });
    };
  }, []);

  return { isIntersecting, entry, ref };
};