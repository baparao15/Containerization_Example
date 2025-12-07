import db, { query } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 5 Real antique products with detailed descriptions
const products = [
    {
        title: 'Victorian Mahogany Writing Desk',
        description: 'Exquisite Victorian-era mahogany writing desk from 1880s featuring ornate hand-carved details, brass handles, and a beautiful leather inlay top. This piece showcases the finest craftsmanship of the 19th century with its elegant proportions and functional design. Features multiple drawers with original brass hardware. Perfect for a home office or study. Dimensions: 48"W x 24"D x 30"H.',
        price: 290000.00,
        condition: '5 Stars - Excellent',
        year: 1880,
        category: 'Furniture',
        image: 'antique_furniture_1.jpg'
    },
    {
        title: 'Art Deco Diamond Bracelet',
        description: 'Spectacular 1930s Art Deco platinum and diamond bracelet featuring geometric patterns characteristic of the era. Set with high-quality diamonds totaling approximately 5 carats in a stunning linear design. The platinum setting shows exceptional craftsmanship with intricate milgrain detailing. Comes with certificate of authenticity from a certified gemologist. A true investment piece.',
        price: 1000000.00,
        condition: '5 Stars - Excellent',
        year: 1935,
        category: 'Jewelry',
        image: 'antique_jewelry_1.jpg'
    },
    {
        title: '19th Century Landscape Oil Painting',
        description: 'Original 19th century oil painting depicting a pastoral landscape with rolling hills and dramatic sunset. Housed in an ornate gilded frame with beautiful patina. Signed by the artist in the lower right corner. Canvas measures 24" x 36". This beautiful example of classical European landscape art would make a stunning focal point in any room. Professionally cleaned and restored.',
        price: 456000.00,
        condition: '4 Stars - Very Good',
        year: 1870,
        category: 'Art & Paintings',
        image: 'antique_art_1.jpg'
    },
    {
        title: 'Vintage Porcelain Tea Set - Royal Doulton',
        description: 'Complete 1920s Royal Doulton porcelain tea set with hand-painted floral patterns and 24k gold trim. Includes teapot, sugar bowl, creamer, 6 cups and saucers, all in perfect condition with no chips or cracks. Made in England with the authentic Royal Doulton backstamp. The delicate hand-painted roses and gold accents showcase the exceptional quality of early 20th century English porcelain.',
        price: 79000.00,
        condition: '5 Stars - Excellent',
        year: 1925,
        category: 'Collectibles',
        image: 'antique_collectible_1.jpg'
    },
    {
        title: 'Antique Brass Telescope with Wooden Tripod',
        description: 'Early 1900s brass telescope on wooden tripod with leather accents. Fully functional with clear optics providing excellent magnification. The brass has developed a beautiful natural patina over the years. Tripod is made of solid mahogany with brass fittings. A beautiful blend of science and art, perfect for collectors or as a stunning decorative piece. Height adjustable from 36" to 48".',
        price: 133000.00,
        condition: '4 Stars - Very Good',
        year: 1905,
        category: 'Collectibles',
        image: 'antique_collectible_2.jpg'
    }
];

// Force save database function
function saveDatabase() {
    const dbPath = path.join(__dirname, 'data', 'heirloom_hub.db');
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
        console.log('💾 Database saved to disk');
    }
}

async function addRealProducts() {
    try {
        console.log('📦 Adding 5 real antique products...\n');

        // Get seller ID
        const sellerResult = await query(
            'SELECT id FROM users WHERE email = $1',
            ['seller@antiques.com']
        );

        if (sellerResult.rows.length === 0) {
            console.error('❌ Seller account not found!');
            console.log('Creating seller account...');
            const createSeller = await query(
                'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id',
                ['seller@antiques.com', 'seller123', 'Seller']
            );
            const sellerId = createSeller.rows[0].id;
            console.log(`✅ Created seller account (ID: ${sellerId})\n`);
        }

        const sellerCheck = await query(
            'SELECT id FROM users WHERE email = $1',
            ['seller@antiques.com']
        );
        const sellerId = sellerCheck.rows[0].id;
        console.log(`✅ Using seller account (ID: ${sellerId})\n`);

        // Get category IDs
        const categoriesResult = await query('SELECT id, name FROM categories');
        const categoryMap = {};
        categoriesResult.rows.forEach(row => {
            categoryMap[row.name] = row.id;
        });

        console.log('Categories available:', Object.keys(categoryMap).join(', '), '\n');

        // Insert products
        let count = 0;
        for (const product of products) {
            const categoryId = categoryMap[product.category];

            if (!categoryId) {
                console.warn(`⚠️  Category "${product.category}" not found, skipping ${product.title}`);
                continue;
            }

            const imagesJson = JSON.stringify([`/uploads/seed/${product.image}`]);

            const result = await query(
                `INSERT INTO listings (seller_id, category_id, title, description, price, condition, year, images, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING id`,
                [
                    sellerId,
                    categoryId,
                    product.title,
                    product.description,
                    product.price,
                    product.condition,
                    product.year,
                    imagesJson,
                    'available'
                ]
            );

            count++;
            console.log(`✅ Added (ID: ${result.rows[0].id}): ${product.title}`);
            console.log(`   Category: ${product.category} | Price: ₹${product.price.toLocaleString('en-IN')}`);
            console.log(`   Year: ${product.year} | Condition: ${product.condition}\n`);

            // Force save after each insert
            saveDatabase();
        }

        // Final save
        saveDatabase();

        // Wait a bit for save to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verify listings were created
        const verifyResult = await query('SELECT COUNT(*) as count FROM listings WHERE seller_id = $1', [sellerId]);
        console.log(`\n✅ Verification: ${verifyResult.rows[0].count} listings found for seller\n`);

        console.log(`🎉 Successfully added ${count} real antique products!`);
        console.log('\n📝 Products added:');
        console.log('   1. Victorian Mahogany Writing Desk (₹2,90,000)');
        console.log('   2. Art Deco Diamond Bracelet (₹10,00,000)');
        console.log('   3. 19th Century Landscape Oil Painting (₹4,56,000)');
        console.log('   4. Vintage Porcelain Tea Set (₹79,000)');
        console.log('   5. Antique Brass Telescope (₹1,33,000)');
        console.log('\n✨ All products are now visible in the seller dashboard!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding products:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

addRealProducts();
