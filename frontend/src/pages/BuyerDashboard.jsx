import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CategorySidebar from '../components/CategorySidebar';
import ListingCard from '../components/ListingCard';
import OfferModal from '../components/OfferModal';
import './Dashboard.css';

const BuyerDashboard = () => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedListing, setSelectedListing] = useState(null);
    const [showOfferModal, setShowOfferModal] = useState(false);

    useEffect(() => {
        fetchListings();
    }, [selectedCategory]);

    const fetchListings = async () => {
        try {
            setLoading(true);
            const url = selectedCategory === 'all'
                ? 'http://localhost:5000/api/listings'
                : `http://localhost:5000/api/listings?category=${selectedCategory}`;

            const response = await fetch(url, {
                credentials: 'include'
            });

            const data = await response.json();
            setListings(data);
        } catch (err) {
            setError('Failed to fetch listings');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
    };

    const handleOpenChat = (listingId) => {
        navigate(`/chat/${listingId}`);
    };

    const handleMakeOffer = (listing) => {
        setSelectedListing(listing);
        setShowOfferModal(true);
    };

    const handleOfferSubmitted = (offer) => {
        setSuccess(`Offer of ₹${parseFloat(offer.quoted_price).toLocaleString('en-IN')} submitted successfully!`);
        setTimeout(() => setSuccess(''), 5000);
    };

    return (
        <div className="dashboard-container">
            <div className="container">
                <div className="dashboard-header fade-in">
                    <h1>Buyer Dashboard</h1>
                    <p>Browse antiques and discover treasures</p>
                </div>

                <div className="dashboard-with-sidebar">
                    <CategorySidebar
                        selectedCategory={selectedCategory}
                        onCategorySelect={handleCategorySelect}
                    />

                    <div className="dashboard-main-content">
                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}

                        <div className="listings-section fade-in">
                            {loading ? (
                                <div className="flex-center" style={{ minHeight: '400px' }}>
                                    <div className="spinner"></div>
                                </div>
                            ) : listings.length === 0 ? (
                                <div className="empty-state">
                                    <h3>No listings found</h3>
                                    <p>Check back later for new antiques in this category!</p>
                                </div>
                            ) : (
                                <div className="grid grid-2">
                                    {listings.map((listing) => (
                                        <ListingCard
                                            key={listing.id}
                                            listing={listing}
                                            onOpenChat={handleOpenChat}
                                            showChatButton={true}
                                            onMakeOffer={handleMakeOffer}
                                            showOfferButton={true}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showOfferModal && selectedListing && (
                <OfferModal
                    listing={selectedListing}
                    onClose={() => setShowOfferModal(false)}
                    onOfferSubmitted={handleOfferSubmitted}
                />
            )}
        </div>
    );
};

export default BuyerDashboard;
