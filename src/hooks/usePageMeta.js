import { useEffect } from 'react';

/**
 * Hook personalizado para actualizar meta tags sin librerías externas
 * @param {Object} params - Parámetros de SEO
 * @param {string} params.title - Título de la página
 * @param {string} params.description - Descripción de la página
 */
export const usePageMeta = ({ title, description }) => {
  useEffect(() => {
    // Actualizar título
    if (title) {
      document.title = title;
    }
    
    // Actualizar meta description
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      }
    }
  }, [title, description]);
};

