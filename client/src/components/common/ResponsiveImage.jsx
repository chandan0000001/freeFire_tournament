import React from 'react';
import images from '../../config/imageManifest.json';

export default function ResponsiveImage({ src, alt = '', priority = false, sizes, ...props }) {
  const asset = images[src];
  const srcSet = asset?.variants?.length > 1
    ? asset.variants.map((item) => `${item.src} ${item.width}w`).join(', ')
    : undefined;

  return (
    <img
      src={src || undefined}
      alt={alt}
      srcSet={srcSet}
      sizes={srcSet ? (sizes || '100vw') : undefined}
      width={asset?.width}
      height={asset?.height}
      decoding="async"
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      {...props}
    />
  );
}
