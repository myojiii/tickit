// API Request Interceptor - Automatically adds auth headers to all fetch requests
(function() {
  const originalFetch = window.fetch;
  
  window.fetch = function(...args) {
    let [url, options = {}] = args;
    
    // Only add headers for API requests
    if (url.startsWith('/api') || url.includes('/api/')) {
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      if (userId && userRole) {
        options.headers = {
          ...options.headers,
          'X-User-Id': userId,
          'X-User-Role': userRole
        };
      }
    }
    
    return originalFetch(url, options).then(response => {
      // If unauthorized, redirect to login
      if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        window.location.href = '/auth/login.html';
      }
      return response;
    });
  };
})();
