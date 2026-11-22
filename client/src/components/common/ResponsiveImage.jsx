import React from 'react';
import images from '../../config/imageManifest.json';

export default function ResponsiveImage({ src, alt = '', priority = false, sizes = '100vw', ...props }) {
  const asset = images[src];
  return <img src={src || undefined} alt={alt}
    srcSet={asset?.variants.map(item => `${item.src} ${item.width}w`).join(', ')}
    sizes={asset ? sizes : undefined} width={asset?.width} height={asset?.height}
    decoding="async" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} {...props} />;
}
