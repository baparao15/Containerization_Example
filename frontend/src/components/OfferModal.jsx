import { useState } from 'react';
import './OfferModal.css';

const OfferModal = ({ listing, onClose, onOfferSubmitted }) => {
    const [quotedPrice, setQuotedPrice] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!quotedPrice || parseFloat(quotedPrice) <= 0) {
            setError('Please enter a valid price');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/offers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    listingId: listing.id,
                    quotedPrice: parseFloat(quotedPrice)
                })
            });

            const data = await response.json();

            if (response.ok) {
                onOfferSubmitted(data);
                onClose();
            } else {
                setError(data.message || 'Failed to submit offer');
            }
        } catch (err) {
            setError('Failed to submit offer. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Make an Offer</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <div className="listing-info">
                        <h3>{listing.title}</h3>
                        <p className="asking-price">Asking Price: ₹{parseFloat(listing.price).toLocaleString('en-IN')}</p>
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label htmlFor="quotedPrice">Your Offer (₹) *</label>
                            <input
                                type="number"
                                id="quotedPrice"
                                value={quotedPrice}
                                onChange={(e) => setQuotedPrice(e.target.value)}
                                placeholder="Enter your offer price"
                                min="0"
                                step="0.01"
                                required
                                autoFocus
                            />
                            <small className="hint">
                                Make a competitive offer based on the item's condition and market value
                            </small>
                        </div>

                        <div className="modal-actions">
                            <button type="button" onClick={onClose} className="btn btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Offer'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OfferModal;
