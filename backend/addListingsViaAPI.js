import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_URL = 'http://localhost:5000/api';

// Login and get session cookie
async function login() {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: 'seller@antiques.com',
            password: 'seller123'
        })
    });

    if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
    }

    // Get session cookie
    const cookies = response.headers.get('set-cookie');
    return cookies;
}

// Create a listing via API
async function createListing(cookie, listingData, imagePath) {
    const form = new FormData();
    form.append('title', listingData.title);
    form.append('description', listingData.description);
    form.append('price', listingData.price);
    form.append('condition', listingData.condition);
    form.append('year', listingData.year);
    form.append('category', listingData.category);

    // Add image file
    if (fs.existsSync(imagePath)) {
        form.append('images', fs.createReadStream(imagePath));
    } else {
        console.warn(`⚠️  Image not found: ${imagePath}`);
    }

    const response = await fetch(`${API_URL}/listings`, {
        method: 'POST',
        headers: {
            'Cookie': cookie
        },
        body: form
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create listing: ${error}`);
    }

    return await response.json();
}

async function main() {
    try {
        console.log('🔐 Logging in as seller...\n');
        const cookie = await login();
        console.log('✅ Logged in successfully!\n');

        const listings = [
            {
                title: 'Victorian Mahogany Writing Desk',
                description: 'Exquisite Victorian-era mahogany writing desk from 1880s featuring ornate hand-carved details, brass handles, and a beautiful leather inlay top. This piece showcases the finest craftsmanship of the 19th century with its elegant proportions and functional design. Features multiple drawers with original brass hardware. Perfect for a home office or study. Dimensions: 48"W x 24"D x 30"H.',
                price: 290000,
                condition: '5 Stars - Excellent',
                year: 1880,
                category: 'Furniture',
                image: 'antique_furniture_1.jpg'
            },
            {
                title: 'Art Deco Diamond Bracelet',
                description: 'Spectacular 1930s Art Deco platinum and diamond bracelet featuring geometric patterns characteristic of the era. Set with high-quality diamonds totaling approximately 5 carats in a stunning linear design. The platinum setting shows exceptional craftsmanship with intricate milgrain detailing. Comes with certificate of authenticity from a certified gemologist. A true investment piece.',
                price: 1000000,
                condition: '5 Stars - Excellent',
                year: 1935,
                category: 'Jewelry',
                image: 'antique_jewelry_1.jpg'
            },
            {
                title: '19th Century Landscape Oil Painting',
                description: 'Original 19th century oil painting depicting a pastoral landscape with rolling hills and dramatic sunset. Housed in an ornate gilded frame with beautiful patina. Signed by the artist in the lower right corner. Canvas measures 24" x 36". This beautiful example of classical European landscape art would make a stunning focal point in any room. Professionally cleaned and restored.',
                price: 456000,
                condition: '4 Stars - Very Good',
                year: 1870,
                category: 'Art & Paintings',
                image: 'antique_art_1.jpg'
            }
        ];

        console.log('📦 Creating 3 listings via API...\n');

        for (let i = 0; i < listings.length; i++) {
            const listing = listings[i];
            const imagePath = path.join(__dirname, 'uploads', 'seed', listing.image);

            if (!fs.existsSync(imagePath)) {
                console.error(`❌ Image not found: ${imagePath} - Skipping ${listing.title}`);
                continue;
            }

            try {
                const result = await createListing(cookie, listing, imagePath);
                console.log(`✅ Created: ${listing.title}`);
                console.log(`   ID: ${result.id} | Price: ₹${listing.price.toLocaleString('en-IN')}\n`);

                // Wait longer between requests to allow DB save
                console.log('⏳ Waiting for database save...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (error) {
                console.error(`❌ Failed to create ${listing.title}:`, error.message);
                if (error.cause) console.error(error.cause);
            }
        }

        console.log('\n🎉 All 3 listings created successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
