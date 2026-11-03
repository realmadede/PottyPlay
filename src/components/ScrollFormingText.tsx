"use client";

import React, { useEffect, useRef } from "react";

interface ScrollFormingTextProps {
  as: "h2" | "p";
  className?: string;
  children: string;
}

export function ScrollFormingText({ as: Tag, className = "", children }: ScrollFormingTextProps) {
  const elementRef = useRef<HTMLHeadingElement & HTMLParagraphElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (!("IntersectionObserver" in window)) {
      element.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -7% 0px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const words = children.trim().split(/\s+/);

  return (
    <Tag ref={elementRef} className={`scroll-forming ${className}`} aria-label={children}>
      {words.map((word, index) => (
        <React.Fragment key={`${word}-${index}`}>
          <span
            aria-hidden="true"
            className="scroll-forming-word"
            style={{ "--word-index": index } as React.CSSProperties}
          >
            {word}
          </span>
          {index < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </Tag>
  );
}