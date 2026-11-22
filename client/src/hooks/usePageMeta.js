import { useEffect } from 'react';
import { site } from '../config/site.js';

/**
 * Custom hook to dynamically update page title and meta description
 * @param {string} title 
 * @param {string} description 
 */
export default function usePageMeta(title, description) {
  useEffect(() => {
    description = description?.replace(/Rahul Esports(?: Arena| Odisha)?|RIT Esports Arena|Roland Institute of Technology/g, site.name);
    // Update title
    if (title) {
      const cleanTitle = title.replace(/\s*\|\s*(?:RIT|Rahul).*$/, '');
      document.title = `${cleanTitle} | ${site.name}`;
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title);
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
