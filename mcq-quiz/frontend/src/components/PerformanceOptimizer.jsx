import React, { useEffect, useRef, useState, memo } from 'react';

/**
 * PERFORMANCE OPTIMIZER COMPONENT
 * Ye component website ko extremely fast banata hai
 * Features:
 * 1. Lazy Image Loading with Intersection Observer
 * 2. Preloading Critical Resources
 * 3. Code Splitting Support
 * 4. Performance Monitoring
 * 5. Automatic Image Optimization
 * 6. Memory Cleanup
 */

// ============================================
// 1. LAZY IMAGE COMPONENT - Images ko lazy load karta hai
// ============================================
export const LazyImage = memo(({ src, alt, className = '', placeholder = '/placeholder.png' }) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.src = src;
            img.onload = () => {
              setImageSrc(src);
              setIsLoaded(true);
            };
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Load 50px before image enters viewport
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-50'} transition-opacity duration-300`}
      loading="lazy"
    />
  );
});

LazyImage.displayName = 'LazyImage';

// ============================================
// 2. PRELOAD COMPONENT - Critical resources ko preload karta hai
// ============================================
export const PreloadResources = ({ resources = [] }) => {
  useEffect(() => {
    resources.forEach(({ href, as, type }) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      if (type) link.type = type;
      document.head.appendChild(link);
    });
  }, [resources]);

  return null;
};

// ============================================
// 3. LAZY COMPONENT WRAPPER - Components ko lazy load karta hai
// ============================================
export const LazyComponentWrapper = ({ children, fallback = <div>Loading...</div> }) => {
  const [isVisible, setIsVisible] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (wrapperRef.current) {
      observer.observe(wrapperRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef}>
      {isVisible ? children : fallback}
    </div>
  );
};

// ============================================
// 4. PERFORMANCE MONITOR - Performance metrics track karta hai
// ============================================
export const usePerformanceMonitor = (componentName) => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        if (renderTime > 100) {
          console.warn(`⚠️ ${componentName} took ${renderTime.toFixed(2)}ms to render`);
        }
      }
    };
  }, [componentName]);
};

// ============================================
// 5. DEBOUNCE HOOK - API calls ko debounce karta hai
// ============================================
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// ============================================
// 6. VIRTUAL LIST - Long lists ko efficiently render karta hai
// ============================================
export const VirtualList = memo(({ items, renderItem, itemHeight = 80, containerHeight = 600 }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;
  const totalHeight = items.length * itemHeight;

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height: containerHeight, overflow: 'auto', position: 'relative' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

VirtualList.displayName = 'VirtualList';

// ============================================
// 7. CACHE MANAGER - API responses ko cache karta hai
// ============================================
class CacheManager {
  constructor(maxAge = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.maxAge = maxAge;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    const age = Date.now() - item.timestamp;
    if (age > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  has(key) {
    return this.get(key) !== null;
  }
}

export const apiCache = new CacheManager();

// ============================================
// 8. OPTIMIZED FETCH HOOK - Cached API calls
// ============================================
export const useOptimizedFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check cache first
        if (apiCache.has(url)) {
          setData(apiCache.get(url));
          setLoading(false);
          return;
        }

        setLoading(true);
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Cache the result
        apiCache.set(url, result);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};

// ============================================
// 9. MEMORY CLEANUP HOOK - Memory leaks prevent karta hai
// ============================================
export const useMemoryCleanup = () => {
  useEffect(() => {
    return () => {
      // Clear any pending timers, intervals, subscriptions
      const highestTimeoutId = setTimeout(() => {});
      for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
      }
    };
  }, []);
};

// ============================================
// 10. PREFETCH LINK - Links ko prefetch karta hai
// ============================================
export const PrefetchLink = memo(({ href, children, className, ...props }) => {
  const linkRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Prefetch the route
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = href;
            document.head.appendChild(link);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );

    if (linkRef.current) {
      observer.observe(linkRef.current);
    }

    return () => observer.disconnect();
  }, [href]);

  return (
    <a ref={linkRef} href={href} className={className} {...props}>
      {children}
    </a>
  );
});

PrefetchLink.displayName = 'PrefetchLink';

// ============================================
// 11. PERFORMANCE UTILITIES
// ============================================
export const performanceUtils = {
  // Throttle function
  throttle: (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Debounce function
  debounce: (func, delay) => {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  },

  // Measure component render time
  measureRender: (componentName, callback) => {
    const start = performance.now();
    callback();
    const end = performance.now();
    console.log(`${componentName} rendered in ${(end - start).toFixed(2)}ms`);
  },

  // Get page load metrics
  getPageMetrics: () => {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      return {
        pageLoadTime: timing.loadEventEnd - timing.navigationStart,
        domReadyTime: timing.domContentLoadedEventEnd - timing.navigationStart,
        firstPaintTime: timing.responseEnd - timing.fetchStart
      };
    }
    return null;
  }
};

// ============================================
// 12. IMAGE OPTIMIZER - Images ko optimize karta hai
// ============================================
export const optimizeImageUrl = (url, width = 800, quality = 80) => {
  if (!url) return '';
  
  // Cloudinary optimization
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${width},q_${quality},f_auto/`);
  }
  
  return url;
};

// ============================================
// 13. SERVICE WORKER REGISTRATION
// ============================================
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          console.log('✅ Service Worker registered:', registration);
        })
        .catch(error => {
          console.log('❌ Service Worker registration failed:', error);
        });
    });
  }
};

// ============================================
// DEFAULT EXPORT - Main Performance Optimizer Component
// ============================================
const PerformanceOptimizer = ({ children }) => {
  useMemoryCleanup();

  useEffect(() => {
    // Enable performance monitoring
    if (process.env.NODE_ENV === 'development') {
      const metrics = performanceUtils.getPageMetrics();
      if (metrics) {
        console.log('📊 Page Performance Metrics:', {
          pageLoadTime: `${metrics.pageLoadTime}ms`,
          domReadyTime: `${metrics.domReadyTime}ms`,
          firstPaintTime: `${metrics.firstPaintTime}ms`
        });
      }
    }

    // Register service worker
    registerServiceWorker();
  }, []);

  return <>{children}</>;
};

export default memo(PerformanceOptimizer);
