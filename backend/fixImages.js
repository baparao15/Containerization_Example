import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads', 'seed');

// Ensure directory exists
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Specific distinct images for our products
const downloads = [
    {
        filename: 'antique_furniture_1.jpg',
        url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80', // Writing Desk
        desc: 'Writing Desk'
    },
    {
        filename: 'antique_jewelry_1.jpg',
        url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80', // Jewelry/Gold
        desc: 'Diamond Bracelet'
    },
    {
        filename: 'antique_art_1.jpg',
        url: 'https://images.unsplash.com/photo-1578321272176-b7bbc0079891?w=800&q=80', // Classical Painting
        desc: 'Landscape Painting'
    },
    {
        filename: 'antique_collectible_1.jpg',
        url: 'https://images.unsplash.com/photo-1563297121-657dc328a2a4?w=800&q=80', // Tea Set
        desc: 'Porcelain Tea Set'
    },
    {
        filename: 'antique_collectible_2.jpg',
        url: 'https://images.unsplash.com/photo-1590845947385-263aefcd37a6?w=800&q=80', // Telescope/Brass
        desc: 'Brass Telescope'
    }
];

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
}

async function fixImages() {
    console.log('🔄 Replacing images with distinct ones...\n');

    for (const item of downloads) {
        const filepath = path.join(uploadsDir, item.filename);

        // Remove existing file to force new download
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }

        try {
            console.log(`Downloading ${item.desc}...`);
            await downloadImage(item.url, filepath);
            console.log(`✅ Saved ${item.filename}`);
        } catch (err) {
            console.error(`❌ Failed to download ${item.filename}:`, err.message);
        }
    }

    console.log('\n✨ Images updated! Refresh the browser to see changes.');
}

fixImages();
