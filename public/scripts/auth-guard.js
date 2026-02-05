// Client-side authentication guard
(function() {
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath.includes('/auth/login');
  
  // Check if user is authenticated
  const userId = localStorage.getItem('userId');
  const userRole = (localStorage.getItem('userRole') || '').toLowerCase();
  
  // If not authenticated and not on login page, redirect to login
  if (!userId && !isLoginPage) {
    window.location.href = '/auth/login.html';
    return;
  }
  
  // If authenticated but on login page, redirect to appropriate dashboard
  if (userId && isLoginPage) {
    let redirect = '/client';
    if (userRole === 'admin') redirect = '/admin';
    else if (userRole === 'staff') redirect = '/staff';
    window.location.href = redirect;
    return;
  }
  
  // Role-based access control
  if (userId && !isLoginPage) {
    if (currentPath.startsWith('/admin') && userRole !== 'admin') {
      alert('Access denied. Admin privileges required.');
      window.location.href = '/auth/login.html';
      return;
    }
    
    if (currentPath.startsWith('/staff') && userRole !== 'staff' && userRole !== 'admin') {
      alert('Access denied. Staff privileges required.');
      window.location.href = '/auth/login.html';
      return;
    }
    
    if (currentPath.startsWith('/client') && userRole !== 'client' && userRole !== 'admin') {
      alert('Access denied.');
      window.location.href = '/auth/login.html';
      return;
    }
  }
})();
