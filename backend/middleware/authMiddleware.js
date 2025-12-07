import { query } from '../db.js';

// Protect routes - check if user is authenticated via session
export const protect = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Not authorized, please login' });
        }

        // Get user from database
        const result = await query(
            'SELECT id, email, role FROM users WHERE id = $1',
            [req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = result.rows[0];
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Not authorized' });
    }
};

// Restrict to specific roles
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Only ${roles.join(', ')} can perform this action.`
            });
        }
        next();
    };
};
