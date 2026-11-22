import React from 'react';

// Only our generated variants are inferred; custom organizer URLs stay untouched.
export default function ResponsiveImage({ src, alt = '', priority = false, sizes = '100vw', ...props }) {
  const hasVariants = /\/(odisha-squad|chilika-solo|arena-account)-1672\.webp$/.test(src || '');
  const srcSet = hasVariants ? [480, 768, 1280, 1672].map(width => `${src.replace('-1672.webp', `-${width}.webp`)} ${width}w`).join(', ') : undefined;
  return <img src={src || undefined} srcSet={srcSet} sizes={hasVariants ? sizes : undefined} alt={alt}
    width={1672} height={941} decoding="async" loading={priority ? 'eager' : 'lazy'}
    fetchPriority={priority ? 'high' : 'auto'} {...props} />;
}
