import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ListingCard from '../components/ListingCard';
import QuoteBoard from '../components/QuoteBoard';
import MessageList from '../components/MessageList';
import './Dashboard.css';

const CATEGORIES = [
    'Furniture',
    'Jewelry',
    'Pottery & Ceramics',
    'Paintings & Art',
    'Books & Manuscripts',
    'Coins & Currency',
    'Timepieces'
];

const SellerDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('create'); // 'create' or 'myListings'
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedListing, setSelectedListing] = useState(null);
    const [showQuoteBoard, setShowQuoteBoard] = useState(false);
    const [showMessageList, setShowMessageList] = useState(false);
    const [selectedListingForMessages, setSelectedListingForMessages] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        otherAntique: '',
        condition: 5,
        provenance: '',
        askingPrice: '',
        image: null
    });

    useEffect(() => {
        if (activeTab === 'myListings') {
            fetchMyListings();
        }
    }, [activeTab]);

    const fetchMyListings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/listings/seller/my-listings');
            setListings(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch listings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        setError('');
        setSuccess('');
    };

    const handleImageChange = (e) => {
        setFormData({
            ...formData,
            image: e.target.files[0]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.image) {
            setError('Please upload an image');
            return;
        }

        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('category', formData.category);
        data.append('otherAntique', formData.otherAntique);
        data.append('condition', formData.condition);
        data.append('provenance', formData.provenance);
        data.append('askingPrice', formData.askingPrice);
        data.append('image', formData.image);

        try {
            setLoading(true);
            await api.post('/listings', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setSuccess('Listing created successfully!');
            setFormData({
                title: '',
                description: '',
                category: '',
                otherAntique: '',
                condition: 5,
                provenance: '',
                askingPrice: '',
                image: null
            });
            // Reset file input
            document.getElementById('image').value = '';
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create listing');
        } finally {
            setLoading(false);
        }
    };

    const handleViewOffers = (listing) => {
        setSelectedListing(listing);
        setShowQuoteBoard(true);
    };

    const handleOfferAccepted = (chatInfo) => {
        setShowQuoteBoard(false);
        fetchMyListings();
        navigate(`/chat/${chatInfo.listingId}`);
    };

    const handleViewMessages = (listing) => {
        setSelectedListingForMessages(listing);
        setShowMessageList(true);
    };

    const handleDeleteListing = async (listingId) => {
        if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);
            await api.delete(`/listings/${listingId}`);
            setSuccess('Listing deleted successfully!');
            fetchMyListings();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete listing');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <div className="container">
                <div className="dashboard-header fade-in">
                    <h1>Seller Dashboard</h1>
                    <p>Manage your antique listings and offers</p>
                </div>

                <div className="dashboard-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
                        onClick={() => setActiveTab('create')}
                    >
                        Create Listing
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'myListings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('myListings')}
                    >
                        My Listings
                    </button>
                </div>

                {activeTab === 'create' && (
                    <div className="create-listing-section fade-in">
                        <div className="form-card">
                            <h2>Create New Listing</h2>

                            {error && <div className="alert alert-error">{error}</div>}
                            {success && <div className="alert alert-success">{success}</div>}

                            <form onSubmit={handleSubmit}>
                                <div className="input-group">
                                    <label htmlFor="title">Title *</label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        maxLength={100}
                                        placeholder="e.g., Victorian Mahogany Chair"
                                    />
                                </div>

                                <div className="input-group">
                                    <label htmlFor="description">Description *</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        required
                                        maxLength={500}
                                        placeholder="Brief description of the antique..."
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="input-group">
                                        <label htmlFor="category">Category *</label>
                                        <select
                                            id="category"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Select a category</option>
                                            {CATEGORIES.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {cat}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="input-group">
                                        <label htmlFor="otherAntique">Other Antique (Optional)</label>
                                        <input
                                            type="text"
                                            id="otherAntique"
                                            name="otherAntique"
                                            value={formData.otherAntique}
                                            onChange={handleChange}
                                            maxLength={100}
                                            placeholder="If doesn't fit above categories"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="input-group">
                                        <label htmlFor="condition">Condition (1-5 stars) *</label>
                                        <select
                                            id="condition"
                                            name="condition"
                                            value={formData.condition}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="1">1 Star - Poor</option>
                                            <option value="2">2 Stars - Fair</option>
                                            <option value="3">3 Stars - Good</option>
                                            <option value="4">4 Stars - Very Good</option>
                                            <option value="5">5 Stars - Excellent</option>
                                        </select>
                                    </div>

                                    <div className="input-group">
                                        <label htmlFor="askingPrice">Asking Price (₹) *</label>
                                        <input
                                            type="number"
                                            id="askingPrice"
                                            name="askingPrice"
                                            value={formData.askingPrice}
                                            onChange={handleChange}
                                            required
                                            min="0"
                                            step="0.01"
                                            placeholder="10000"
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label htmlFor="provenance">Provenance *</label>
                                    <textarea
                                        id="provenance"
                                        name="provenance"
                                        value={formData.provenance}
                                        onChange={handleChange}
                                        required
                                        maxLength={1000}
                                        placeholder="History and origin of the antique..."
                                    />
                                </div>

                                <div className="input-group">
                                    <label htmlFor="image">Image *</label>
                                    <input
                                        type="file"
                                        id="image"
                                        name="image"
                                        onChange={handleImageChange}
                                        accept="image/*"
                                        required
                                    />
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Creating...' : 'Create Listing'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'myListings' && (
                    <div className="listings-section fade-in">
                        {loading ? (
                            <div className="spinner"></div>
                        ) : listings.length === 0 ? (
                            <div className="empty-state">
                                <h3>No listings yet</h3>
                                <p>Create your first listing to start selling!</p>
                                <button onClick={() => setActiveTab('create')} className="btn btn-primary">
                                    Create Listing
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-2">
                                {listings.map((listing) => (
                                    <ListingCard
                                        key={listing._id}
                                        listing={listing}
                                        onViewOffers={handleViewOffers}
                                        showViewOffersButton={true}
                                        onOpenChat={handleViewMessages}
                                        showChatButton={true}
                                        onDelete={handleDeleteListing}
                                        showDeleteButton={true}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {showQuoteBoard && selectedListing && (
                    <QuoteBoard
                        listing={selectedListing}
                        onClose={() => setShowQuoteBoard(false)}
                        onOfferAccepted={handleOfferAccepted}
                    />
                )}

                {showMessageList && selectedListingForMessages && (
                    <MessageList
                        listing={selectedListingForMessages}
                        onClose={() => setShowMessageList(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default SellerDashboard;
