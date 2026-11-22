import React from 'react';

export default function ResponsiveImage({ src, alt = '', priority = false, ...props }) {
  return (
    <img
      src={src || undefined}
      alt={alt}
      decoding="async"
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      {...props}
    />
  );
}
