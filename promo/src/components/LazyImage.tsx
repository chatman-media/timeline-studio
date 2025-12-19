import type React from "react";
import { useEffect, useRef, useState } from "react";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  loading?: "lazy" | "eager";
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23374151'/%3E%3C/svg%3E",
  className = "",
  loading = "lazy",
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!imageRef || loading === "eager") {
      setImageSrc(src);
      return;
    }

    if ("IntersectionObserver" in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observerRef.current?.disconnect();
            }
          });
        },
        {
          rootMargin: "50px",
        },
      );

      observerRef.current.observe(imageRef);
    } else {
      // Fallback for browsers that don't support IntersectionObserver
      setImageSrc(src);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [imageRef, src, loading]);

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${!isLoaded ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
      onLoad={() => setIsLoaded(true)}
      loading={loading}
      {...props}
      data-oid="bqeowd-"
    />
  );
};
