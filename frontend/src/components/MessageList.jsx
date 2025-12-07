import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './MessageList.css';

const MessageList = ({ listing, onClose }) => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/messages/listing/${listing._id}/conversations`);
            setConversations(response.data);
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
            setError(err.response?.data?.message || 'Failed to load conversations');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChat = (buyerId) => {
        navigate(`/chat/${listing._id}?buyerId=${buyerId}`);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="message-list-modal" onClick={(e) => e.stopPropagation()}>
                <div className="message-list-header">
                    <h2>Messages for {listing.title}</h2>
                    <button onClick={onClose} className="close-btn">✕</button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {loading ? (
                    <div className="spinner"></div>
                ) : conversations.length === 0 ? (
                    <div className="empty-state">
                        <p>No messages yet for this listing</p>
                        <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.5rem' }}>
                            Buyers who message you will appear here
                        </p>
                    </div>
                ) : (
                    <div className="conversations-list">
                        {conversations.map((conv) => (
                            <div
                                key={conv.buyer_id}
                                className="conversation-item"
                                onClick={() => handleOpenChat(conv.buyer_id)}
                            >
                                <div className="conversation-info">
                                    <span className="buyer-email">📧 {conv.buyer_email}</span>
                                    <span className="message-count">{conv.message_count} messages</span>
                                </div>
                                <span className="last-message-time">
                                    Last message: {new Date(conv.last_message_at).toLocaleString('en-IN', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                    })}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageList;
