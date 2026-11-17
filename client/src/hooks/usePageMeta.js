import { useEffect } from 'react';

/**
 * Custom hook to dynamically update page title and meta description
 * @param {string} title 
 * @param {string} description 
 */
export default function usePageMeta(title, description) {
  useEffect(() => {
    // Update title
    if (title) {
      document.title = title.includes('RIT') ? title : `${title} | RIT Esports Arena`;
    }

    // Update meta description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);

      // Update OpenGraph description
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute('content', description);
      }
    }
  }, [title, description]);
}
