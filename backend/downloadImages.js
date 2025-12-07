// Script to download placeholder antique images
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

// Using Unsplash Source for free high-quality images
// Categories: furniture, jewelry, art, collectibles, clothing
const images = [
    // Furniture (5 images)
    { name: 'antique_furniture_1.jpg', query: 'antique-desk', width: 800, height: 600 },
    { name: 'antique_furniture_2.jpg', query: 'antique-chair', width: 800, height: 600 },
    { name: 'antique_furniture_3.jpg', query: 'grandfather-clock', width: 800, height: 600 },
    { name: 'antique_furniture_4.jpg', query: 'antique-mirror', width: 800, height: 600 },
    { name: 'antique_furniture_5.jpg', query: 'vintage-trunk', width: 800, height: 600 },

    // Jewelry (4 images)
    { name: 'antique_jewelry_1.jpg', query: 'diamond-bracelet', width: 800, height: 600 },
    { name: 'antique_jewelry_2.jpg', query: 'gold-locket', width: 800, height: 600 },
    { name: 'antique_jewelry_3.jpg', query: 'pocket-watch', width: 800, height: 600 },
    { name: 'antique_jewelry_4.jpg', query: 'pearl-necklace', width: 800, height: 600 },

    // Art (2 images)
    { name: 'antique_art_1.jpg', query: 'landscape-painting', width: 800, height: 600 },
    { name: 'antique_art_2.jpg', query: 'bronze-sculpture', width: 800, height: 600 },

    // Collectibles (3 images)
    { name: 'antique_collectible_1.jpg', query: 'porcelain-tea-set', width: 800, height: 600 },
    { name: 'antique_collectible_2.jpg', query: 'brass-telescope', width: 800, height: 600 },
    { name: 'antique_collectible_3.jpg', query: 'antique-globe', width: 800, height: 600 },

    // Clothing (1 image)
    { name: 'antique_clothing_1.jpg', query: 'vintage-dress', width: 800, height: 600 }
];

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`✅ Downloaded: ${path.basename(filepath)}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            console.error(`❌ Failed to download ${path.basename(filepath)}:`, err.message);
            reject(err);
        });
    });
}

async function downloadAllImages() {
    console.log('📥 Starting image downloads...\n');

    for (const img of images) {
        const filepath = path.join(uploadsDir, img.name);

        // Check if file already exists
        if (fs.existsSync(filepath)) {
            console.log(`⏭️  Skipped (already exists): ${img.name}`);
            continue;
        }

        // Using Picsum Photos as a reliable placeholder service
        const url = `https://picsum.photos/${img.width}/${img.height}?random=${Math.random()}`;

        try {
            await downloadImage(url, filepath);
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
            console.error(`Failed to download ${img.name}`);
        }
    }

    console.log('\n✨ Image download complete!');
    console.log(`📁 Images saved to: ${uploadsDir}`);
}

downloadAllImages().catch(console.error);
