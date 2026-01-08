import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';

// Define the shape of the decoded JWT payload
interface DecodedToken {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin'; // Add role field
}

// Extend Express Request type to include a specifically typed user property
// This declaration needs to be consistent across all files that extend Express.Request
declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken; // CRUCIAL: Use the specific DecodedToken interface
    }
  }
}

const auth = (req: Request, res: Response, next: NextFunction) => {
  // Get token from header - either from x-auth-token or Authorization: Bearer
  let token = req.header('x-auth-token');
  
  // Check for Authorization header (Bearer token)
  if (!token && req.header('Authorization')) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify token with explicit algorithm specification for security
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as DecodedToken;
    
    // Attach the decoded user payload to the request object
    req.user = decoded;
    next();
  } catch (err) {
    // Only log detailed errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error("[AUTH MIDDLEWARE] JWT verification failed:", err);
    }
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Role-based authorization middleware
const authorizeRoles = (...allowedRoles: ('user' | 'admin')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user is authenticated (this should be called after auth middleware)
    if (!req.user) {
      return res.status(401).json({ msg: 'Authentication required' });
    }

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        msg: 'Access denied. Insufficient permissions.',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

export default auth;
export { authorizeRoles };
