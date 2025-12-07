import './ListingCard.css';

const ListingCard = ({ listing, onOpenChat, showChatButton = false, onMakeOffer, showOfferButton = false, onViewOffers, showViewOffersButton = false, onDelete, showDeleteButton = false }) => {
    // Get first image from images array - handle both string and array formats
    let imageUrl = '/placeholder.jpg';

    try {
        // Parse images if it's a string
        const images = typeof listing.images === 'string'
            ? JSON.parse(listing.images)
            : listing.images;

        if (images && Array.isArray(images) && images.length > 0) {
            imageUrl = `http://localhost:5000${images[0]}`;
        }

        console.log('Listing:', listing.title, 'Image URL:', imageUrl);
    } catch (error) {
        console.error('Error parsing images for listing:', listing.title, error);
    }


    return (
        <div className="listing-card fade-in">
            <div className="listing-image">
                <img
                    src={imageUrl}
                    alt={listing.title}
                    onError={(e) => {
                        console.error('Image failed to load:', imageUrl);
                        e.target.src = '/placeholder.jpg';
                    }}
                />
                <span className={`listing-status ${listing.status}`}>
                    {listing.status === 'available' ? '✓ Available' : '✓ Sold'}
                </span>
                {listing.category_name && (
                    <span className="listing-category-badge">
                        {listing.category_icon} {listing.category_name}
                    </span>
                )}
            </div>

            <div className="listing-content">
                <div className="listing-header">
                    <h3 className="listing-title">{listing.title}</h3>
                </div>

                <p className="listing-description">
                    {listing.description.length > 150
                        ? `${listing.description.substring(0, 150)}...`
                        : listing.description}
                </p>

                <div className="listing-details">
                    <div className="detail-item">
                        <span className="detail-label">Condition:</span>
                        <span className="detail-value">{listing.condition}</span>
                    </div>
                    {listing.year && (
                        <div className="detail-item">
                            <span className="detail-label">Year:</span>
                            <span className="detail-value">{listing.year}</span>
                        </div>
                    )}
                </div>

                <div className="listing-footer">
                    <div className="listing-price">
                        <span className="price-label">Price</span>
                        <span className="price-value">₹{listing.price?.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="listing-actions">
                        {showOfferButton && listing.status === 'available' && (
                            <button
                                onClick={() => onMakeOffer(listing)}
                                className="btn btn-secondary"
                            >
                                💰 Make Offer
                            </button>
                        )}
                        {showChatButton && (
                            <button
                                onClick={() => onOpenChat(listing.id)}
                                className="btn btn-primary"
                            >
                                💬 View Messages
                            </button>
                        )}
                        {showViewOffersButton && (
                            <button
                                onClick={() => onViewOffers(listing)}
                                className="btn btn-secondary"
                            >
                                View Offers
                            </button>
                        )}
                        {showDeleteButton && (
                            <button
                                onClick={() => onDelete(listing.id)}
                                className="btn btn-danger"
                                title="Delete listing"
                            >
                                🗑️ Delete
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListingCard;
