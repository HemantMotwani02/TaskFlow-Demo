import toastService from './toastService';

// Monkey-patch window.fetch to emit global error toasts on failed requests
export function setupFetchInterceptor() {
  if (typeof window === 'undefined' || !window.fetch) return;

  // Avoid installing multiple times
  if (window.__fetchInterceptorInstalled) return;
  window.__fetchInterceptorInstalled = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    try {
      const response = await originalFetch(input, init);
      if (!response.ok) {
        try {
          // Try to extract server-provided error message
          const cloned = response.clone();
          const contentType = cloned.headers.get('content-type') || '';
          let message = `Request failed (${response.status})`;
          if (contentType.includes('application/json')) {
            const json = await cloned.json();
            message = json?.message || message;
          } else {
            const text = await cloned.text();
            if (text) message = text;
          }
          toastService.showError(message, 'Request Failed');
        } catch (_e) {
          toastService.showError(`Request failed (${response.status})`, 'Request Failed');
        }
      }
      return response;
    } catch (error) {
      toastService.showError(error?.message || 'Network error', 'Network Error');
      throw error;
    }
  };
}


