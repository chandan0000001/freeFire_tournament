import React from 'react';

/**
 * Ultra-fast, minimal top progress indicator.
 * Eliminates intrusive full-screen blocking spinners so the page shell remains visible.
 */
export default function PageLoadingFallback() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="h-1 w-full bg-gradient-to-r from-brand-orange via-brand-amber to-brand-gold animate-pulse"></div>
    </div>
  );
}
