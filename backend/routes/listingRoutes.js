import express from 'express';
import { query } from '../db.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// @route   GET /api/listings
// @desc    Get all active listings (with optional category filter)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;

        let queryText = `
            SELECT l.id as _id,
                   l.*, 
                   u.email as seller_email, 
                   u.role as seller_role,
                   c.name as category_name,
                   c.icon as category_icon
            FROM listings l
            JOIN users u ON l.seller_id = u.id
            LEFT JOIN categories c ON l.category_id = c.id
            WHERE l.status = 'available'
        `;

        const params = [];

        if (category && category !== 'all') {
            queryText += ' AND c.name = $1';
            params.push(category);
        }

        queryText += ' ORDER BY l.created_at DESC';

        const result = await query(queryText, params);

        // Parse images JSON string to array
        const listings = result.rows.map(listing => ({
            ...listing,
            images: typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images
        }));

        res.json(listings);
    } catch (error) {
        console.error('Get listings error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/listings/categories
// @desc    Get all categories
// @access  Public
router.get('/categories', async (req, res) => {
    try {
        const result = await query('SELECT * FROM categories ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/listings/:id
// @desc    Get single listing
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const result = await query(
            `SELECT l.id as _id,
                    l.*, 
                    u.id as seller_id_user,
                    u.email as seller_email, 
                    u.role as seller_role,
                    c.name as category_name,
                    c.icon as category_icon
             FROM listings l
             JOIN users u ON l.seller_id = u.id
             LEFT JOIN categories c ON l.category_id = c.id
             WHERE l.id = $1`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        const listing = result.rows[0];

        // Restructure to include seller as an object
        const response = {
            ...listing,
            seller: {
                id: listing.seller_id,
                email: listing.seller_email,
                role: listing.seller_role
            }
        };

        // Remove flat seller fields
        delete response.seller_email;
        delete response.seller_role;
        delete response.seller_id_user;

        res.json(response);
    } catch (error) {
        console.error('Get listing error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/listings
// @desc    Create new listing
// @access  Private (Seller only)
router.post('/', protect, restrictTo('Seller'), upload.array('images', 5), async (req, res) => {
    try {
        const { title, description, price, condition, year, category } = req.body;

        // Validation
        if (!title || !description || !price || !condition) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Please upload at least one image' });
        }

        // Get category ID
        let categoryId = null;
        if (category) {
            const categoryResult = await query(
                'SELECT id FROM categories WHERE name = $1',
                [category]
            );
            if (categoryResult.rows.length > 0) {
                categoryId = categoryResult.rows[0].id;
            }
        }

        // Create array of image paths
        const imagePaths = req.files.map(file => `/uploads/${file.filename}`);
        const imagesJson = JSON.stringify(imagePaths);

        // Create listing
        const result = await query(
            `INSERT INTO listings (seller_id, category_id, title, description, price, condition, year, images)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [req.user.id, categoryId, title, description, price, condition, year || null, imagesJson]
        );

        // Get listing with seller and category info
        const listingResult = await query(
            `SELECT l.id as _id,
                    l.*, 
                    u.email as seller_email, 
                    u.role as seller_role,
                    c.name as category_name,
                    c.icon as category_icon
             FROM listings l
             JOIN users u ON l.seller_id = u.id
             LEFT JOIN categories c ON l.category_id = c.id
             WHERE l.id = $1`,
            [result.rows[0].id]
        );

        res.status(201).json(listingResult.rows[0]);
    } catch (error) {
        console.error('Create listing error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/listings/seller/my-listings
// @desc    Get seller's own listings
// @access  Private (Seller only)
router.get('/seller/my-listings', protect, restrictTo('Seller'), async (req, res) => {
    try {
        console.log(`📋 Fetching listings for seller: ${req.user.id}`);
        const result = await query(
            `SELECT l.id as _id,
                    l.*,
                    c.name as category_name,
                    c.icon as category_icon
             FROM listings l
             LEFT JOIN categories c ON l.category_id = c.id
             WHERE l.seller_id = $1
             ORDER BY l.created_at DESC`,
            [req.user.id]
        );

        // Parse images JSON string to array
        const listings = result.rows.map(listing => ({
            ...listing,
            images: typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images
        }));

        console.log(`✅ Found ${listings.length} listings for seller`);
        res.json(listings);
    } catch (error) {
        console.error('Get my listings error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/listings/:id
// @desc    Update listing
// @access  Private (Seller only - own listings)
router.put('/:id', protect, restrictTo('Seller'), async (req, res) => {
    try {
        const { title, description, price, condition, year, status } = req.body;

        // Check if listing belongs to seller
        const checkResult = await query(
            'SELECT * FROM listings WHERE id = $1 AND seller_id = $2',
            [req.params.id, req.user.id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Listing not found or unauthorized' });
        }

        // Update listing
        const result = await query(
            `UPDATE listings 
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 price = COALESCE($3, price),
                 condition = COALESCE($4, condition),
                 year = COALESCE($5, year),
                 status = COALESCE($6, status),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING *`,
            [title, description, price, condition, year, status, req.params.id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update listing error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/listings/:id
// @desc    Delete listing
// @access  Private (Seller only - own listings)
router.delete('/:id', protect, restrictTo('Seller'), async (req, res) => {
    try {
        const result = await query(
            'DELETE FROM listings WHERE id = $1 AND seller_id = $2 RETURNING *',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Listing not found or unauthorized' });
        }

        res.json({ message: 'Listing deleted successfully' });
    } catch (error) {
        console.error('Delete listing error:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
