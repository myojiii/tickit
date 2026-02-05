// Authentication middleware for route protection
const requireAuth = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  if (!userId || !userRole) {
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }

  req.user = { id: userId, role: userRole };
  next();
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.headers['x-user-role'];

    if (!userRole || !allowedRoles.includes(userRole.toLowerCase())) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

export { requireAuth, requireRole };
