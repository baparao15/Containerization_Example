import express from 'express';
import { query } from '../db.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/offers
// @desc    Create a new offer on a listing
// @access  Private (Buyer only)
router.post('/', protect, restrictTo('Buyer'), async (req, res) => {
    try {
        const { listingId, quotedPrice } = req.body;

        if (!listingId || !quotedPrice) {
            return res.status(400).json({ message: 'Please provide listing ID and quoted price' });
        }

        // Check if listing exists and is available
        const listingResult = await query(
            'SELECT * FROM listings WHERE id = $1 AND status = $2',
            [listingId, 'available']
        );

        if (listingResult.rows.length === 0) {
            return res.status(404).json({ message: 'Listing not found or not available' });
        }

        // Check if buyer already has a pending offer
        const existingOffer = await query(
            'SELECT * FROM offers WHERE listing_id = $1 AND buyer_id = $2 AND status = $3',
            [listingId, req.user.id, 'pending']
        );

        if (existingOffer.rows.length > 0) {
            return res.status(400).json({ message: 'You already have a pending offer on this listing' });
        }

        // Create offer
        const result = await query(
            `INSERT INTO offers (listing_id, buyer_id, quoted_price)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [listingId, req.user.id, quotedPrice]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create offer error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/offers/listing/:listingId
// @desc    Get all offers for a listing
// @access  Private (Seller only - owner of listing)
router.get('/listing/:listingId', protect, restrictTo('Seller'), async (req, res) => {
    try {
        // Check if user is the seller of this listing
        const listingResult = await query(
            'SELECT * FROM listings WHERE id = $1 AND seller_id = $2',
            [req.params.listingId, req.user.id]
        );

        if (listingResult.rows.length === 0) {
            return res.status(403).json({ message: 'Not authorized to view offers for this listing' });
        }

        // Get all offers for this listing with buyer info, sorted by price descending
        const result = await query(
            `SELECT o.id as _id,
                    o.listing_id,
                    o.buyer_id,
                    o.quoted_price as quotedPrice,
                    o.status,
                    o.created_at as createdAt,
                    u.id as buyer_id_user,
                    u.email as buyer_email,
                    u.role as buyer_role
             FROM offers o
             JOIN users u ON o.buyer_id = u.id
             WHERE o.listing_id = $1
             ORDER BY o.quoted_price DESC, o.created_at ASC`,
            [req.params.listingId]
        );

        // Manually construct buyer object for each offer (SQLite compatible)
        const offers = result.rows.map(row => ({
            _id: row._id,
            listing_id: row.listing_id,
            buyer_id: row.buyer_id,
            quotedPrice: row.quotedPrice,
            status: row.status,
            createdAt: row.createdAt,
            buyer: {
                _id: row.buyer_id_user,
                id: row.buyer_id_user,
                email: row.buyer_email,
                role: row.buyer_role
            }
        }));

        res.json(offers);
    } catch (error) {
        console.error('Get listing offers error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/offers/:id/accept
// @desc    Accept an offer
// @access  Private (Seller only)
router.put('/:id/accept', protect, restrictTo('Seller'), async (req, res) => {
    try {
        // Get offer details
        const offerResult = await query(
            `SELECT o.*, l.seller_id 
             FROM offers o
             JOIN listings l ON o.listing_id = l.id
             WHERE o.id = $1`,
            [req.params.id]
        );

        if (offerResult.rows.length === 0) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        const offer = offerResult.rows[0];

        // Check if user is the seller
        if (offer.seller_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to accept this offer' });
        }

        // Check if offer is still pending
        if (offer.status !== 'pending') {
            return res.status(400).json({ message: 'Offer has already been processed' });
        }

        // Update offer status to accepted
        await query(
            `UPDATE offers 
             SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            ['accepted', req.params.id]
        );

        // Reject all other offers for this listing
        await query(
            `UPDATE offers 
             SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE listing_id = $2 AND id != $3 AND status = $4`,
            ['rejected', offer.listing_id, req.params.id, 'pending']
        );

        // Update listing status to sold
        await query(
            `UPDATE listings 
             SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            ['sold', offer.listing_id]
        );

        res.json({
            message: 'Offer accepted successfully',
            chatRoom: {
                listingId: offer.listing_id,
                buyerId: offer.buyer_id,
                sellerId: req.user.id
            }
        });
    } catch (error) {
        console.error('Accept offer error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/offers/:id/reject
// @desc    Reject an offer
// @access  Private (Seller only)
router.put('/:id/reject', protect, restrictTo('Seller'), async (req, res) => {
    try {
        // Get offer details
        const offerResult = await query(
            `SELECT o.*, l.seller_id 
             FROM offers o
             JOIN listings l ON o.listing_id = l.id
             WHERE o.id = $1`,
            [req.params.id]
        );

        if (offerResult.rows.length === 0) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        const offer = offerResult.rows[0];

        // Check if user is the seller
        if (offer.seller_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to reject this offer' });
        }

        // Check if offer is still pending
        if (offer.status !== 'pending') {
            return res.status(400).json({ message: 'Offer has already been processed' });
        }

        // Update offer status to rejected
        await query(
            `UPDATE offers 
             SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            ['rejected', req.params.id]
        );

        res.json({ message: 'Offer rejected successfully' });
    } catch (error) {
        console.error('Reject offer error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/offers/buyer/my-offers
// @desc    Get buyer's own offers
// @access  Private (Buyer only)
router.get('/buyer/my-offers', protect, restrictTo('Buyer'), async (req, res) => {
    try {
        const result = await query(
            `SELECT o.*,
                    l.title as listing_title,
                    l.price as listing_price,
                    l.images as listing_images
             FROM offers o
             JOIN listings l ON o.listing_id = l.id
             WHERE o.buyer_id = $1
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get buyer offers error:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
