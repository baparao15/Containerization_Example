import { useState, useEffect } from 'react';
import api from '../utils/api';
import './QuoteBoard.css';

const QuoteBoard = ({ listing, onClose, onOfferAccepted }) => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/offers/listing/${listing._id}`);
            setOffers(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch offers');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptOffer = async (offerId) => {
        if (!window.confirm('Are you sure you want to accept this offer? This action cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);
            const response = await api.put(`/offers/${offerId}/accept`);
            onOfferAccepted(response.data.chatRoom);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to accept offer');
            setLoading(false);
        }
    };

    const handleRejectOffer = async (offerId) => {
        if (!window.confirm('Are you sure you want to reject this offer?')) {
            return;
        }

        try {
            setLoading(true);
            await api.put(`/offers/${offerId}/reject`);
            setError('');
            fetchOffers(); // Refresh offers list
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reject offer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="quote-board-modal" onClick={(e) => e.stopPropagation()}>
                <div className="quote-board-header">
                    <h2>Quote Board</h2>
                    <button onClick={onClose} className="close-btn">✕</button>
                </div>

                <div className="listing-summary">
                    <h3>{listing.title}</h3>
                    <p>Asking Price: ₹{listing.price?.toLocaleString('en-IN')}</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {loading && offers.length === 0 ? (
                    <div className="spinner"></div>
                ) : offers.length === 0 ? (
                    <div className="empty-state">
                        <p>No offers yet for this listing</p>
                    </div>
                ) : (
                    <div className="offers-table">
                        <div className="table-header">
                            <span>Rank</span>
                            <span>Buyer</span>
                            <span>Offer Amount</span>
                            <span>% of Asking</span>
                            <span>Status</span>
                            <span>Action</span>
                        </div>
                        {offers.map((offer, index) => (
                            <div key={offer._id} className={`table-row ${index === 0 ? 'highest' : ''}`}>
                                <span className="rank">
                                    {index === 0 && <span className="crown">👑</span>}
                                    #{index + 1}
                                </span>
                                <span>{offer.buyer?.email}</span>
                                <span className="offer-amount">₹{offer.quotedPrice?.toLocaleString('en-IN')}</span>
                                <span className="percentage">
                                    {((offer.quotedPrice / listing.price) * 100).toFixed(1)}%
                                </span>
                                <span>
                                    <span className={`badge badge-${offer.status === 'pending' ? 'warning' : offer.status === 'accepted' ? 'success' : 'danger'}`}>
                                        {offer.status}
                                    </span>
                                </span>
                                <span>
                                    {offer.status === 'pending' && (
                                        <div className="action-buttons">
                                            <button
                                                onClick={() => handleAcceptOffer(offer._id)}
                                                className="btn btn-primary btn-sm"
                                                disabled={loading}
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleRejectOffer(offer._id)}
                                                className="btn btn-danger btn-sm"
                                                disabled={loading}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuoteBoard;
