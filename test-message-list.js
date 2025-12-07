// Test script to check if message list endpoint works
// Run this in browser console when logged in as seller

async function testMessageList(listingId) {
    try {
        const response = await fetch(`http://localhost:5000/api/messages/listing/${listingId}/conversations`, {
            credentials: 'include'
        });
        const data = await response.json();
        console.log('Message list response:', data);
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
}

// Usage: testMessageList(1) - replace 1 with actual listing ID
