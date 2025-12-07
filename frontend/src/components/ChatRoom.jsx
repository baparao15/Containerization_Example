import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './ChatRoom.css';

const ChatRoom = () => {
    const { listingId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [listing, setListing] = useState(null);
    const [otherUser, setOtherUser] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        fetchListing();

        // Connect to Socket.IO backend explicitly
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (socket && user && listingId) {
            // Join chat room
            socket.emit('join-chat', { listingId, userId: user.id });

            // Listen for chat history
            socket.on('chat-history', (history) => {
                setMessages(history);
            });

            // Listen for new messages
            socket.on('new-message', (message) => {
                setMessages((prev) => [...prev, message]);
            });

            // Listen for typing indicators
            socket.on('user-typing', () => {
                setIsTyping(true);
            });

            socket.on('user-stop-typing', () => {
                setIsTyping(false);
            });

            return () => {
                socket.off('chat-history');
                socket.off('new-message');
                socket.off('user-typing');
                socket.off('user-stop-typing');
            };
        }
    }, [socket, user, listingId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchListing = async () => {
        try {
            const response = await api.get(`/listings/${listingId}`);
            setListing(response.data);

            console.log('=== Fetch Listing Debug ===');
            console.log('Listing:', response.data);
            console.log('Current user:', user);
            console.log('Seller:', response.data.seller);

            // Check if buyerId is provided in URL (seller selecting specific buyer)
            const urlParams = new URLSearchParams(window.location.search);
            const buyerIdFromUrl = urlParams.get('buyerId');

            // Determine the other user (buyer or seller)
            if (response.data.seller.id !== user.id) {
                // Current user is a buyer, chat with seller
                console.log('User is buyer, setting seller as other user');
                setOtherUser(response.data.seller);
            } else if (buyerIdFromUrl) {
                // Seller selected a specific buyer from message list
                console.log('Seller selected buyer from list, fetching buyer info');
                try {
                    // Fetch buyer info from offers
                    const offersResponse = await api.get(`/offers/listing/${listingId}`);
                    const buyerOffer = offersResponse.data.find(o => o.buyer_id === parseInt(buyerIdFromUrl));
                    if (buyerOffer) {
                        setOtherUser(buyerOffer.buyer);
                    }
                } catch (err) {
                    console.error('Failed to fetch buyer info:', err);
                }
            } else {
                console.log('User is seller, looking for buyer from offers');
                const offersResponse = await api.get(`/offers/listing/${listingId}`);
                console.log('Offers:', offersResponse.data);

                // First look for accepted offer
                const acceptedOffer = offersResponse.data.find(o => o.status === 'accepted');

                if (acceptedOffer) {
                    console.log('Found accepted offer, setting buyer as other user');
                    setOtherUser(acceptedOffer.buyer);
                } else {
                    // If no accepted offer, find the most recent pending offer
                    const pendingOffers = offersResponse.data.filter(o => o.status === 'pending');
                    if (pendingOffers.length > 0) {
                        console.log('Found pending offer, setting buyer as other user');
                        setOtherUser(pendingOffers[0].buyer);
                    } else {
                        console.log('No offers found - seller cannot chat yet');
                        // Seller can't chat until someone makes an offer
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch listing:', err);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleTyping = () => {
        if (socket && otherUser) {
            socket.emit('typing', { listingId, userId: user.id });

            // Clear previous timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Stop typing after 2 seconds
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stop-typing', { listingId, userId: user.id });
            }, 2000);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();

        console.log('=== Send Message Debug ===');
        console.log('Message:', newMessage);
        console.log('Socket:', socket);
        console.log('Socket connected:', socket?.connected);
        console.log('Other user:', otherUser);
        console.log('User:', user);
        console.log('Listing ID:', listingId);

        if (!newMessage.trim() || !socket || !otherUser) {
            console.log('Send blocked - Reason:');
            if (!newMessage.trim()) console.log('  - No message');
            if (!socket) console.log('  - No socket');
            if (!otherUser) console.log('  - No other user');
            return;
        }

        console.log('Sending message via socket...');
        socket.emit('send-message', {
            listingId,
            senderId: user.id,
            receiverId: otherUser.id,
            message: newMessage.trim()
        });

        setNewMessage('');

        // Stop typing indicator
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        socket.emit('stop-typing', { listingId, userId: user.id });
    };

    return (
        <div className="chat-container">
            <div className="container">
                <div className="chat-card fade-in">
                    <div className="chat-header">
                        <button onClick={() => navigate(-1)} className="back-btn">
                            ← Back
                        </button>
                        <div className="chat-info">
                            <h2>{listing?.title}</h2>
                            <p>Chatting with: {otherUser?.email}</p>
                        </div>
                    </div>

                    <div className="messages-container">
                        {messages.length === 0 ? (
                            <div className="empty-chat">
                                <p>No messages yet. Start the conversation!</p>
                                <p className="chat-hint">💬 Exchange payment details, shipping address, and other information</p>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg) => (
                                    <div
                                        key={msg._id}
                                        className={`message ${msg.sender.id === user.id ? 'sent' : 'received'}`}
                                    >
                                        <div className="message-content">
                                            <p>{msg.message}</p>
                                            <span className="message-time">
                                                {new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </>
                        )}

                        {isTyping && (
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSendMessage} className="message-input-form">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                handleTyping();
                            }}
                            placeholder="Type your message..."
                            className="message-input"
                        />
                        <button type="submit" className="btn btn-primary send-btn">
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatRoom;
