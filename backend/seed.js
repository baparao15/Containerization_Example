import db, { query } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Curated product data (Prices in INR) - 3 premium items with real images
const products = [
    // Furniture (3 items)
    {
        title: 'Victorian Mahogany Writing Desk',
        description: 'Exquisite Victorian-era mahogany writing desk featuring ornate hand-carved details, brass handles, and a beautiful leather inlay top. This piece showcases the finest craftsmanship of the 19th century with its elegant proportions and functional design. Perfect for a home office or study.',
        price: 290000.00,
        condition: 'Excellent',
        year: 1880,
        category: 'Furniture',
        image: 'antique_furniture_1.jpg'
    },
    {
        title: 'French Louis XV Armchair',
        description: 'Authentic 18th century French Louis XV armchair with original gold gilt frame and burgundy velvet upholstery. Features the characteristic cabriole legs and ornate rococo carvings. A stunning example of French furniture artistry.',
        price: 350000.00,
        condition: 'Very Good',
        year: 1750,
        category: 'Furniture',
        image: 'antique_furniture_2.jpg'
    },
    {
        title: 'Oak Grandfather Clock',
        description: 'Majestic 1920s oak grandfather clock with brass pendulum, Westminster chimes, and Roman numeral dial. Features intricate woodwork and original mechanism in perfect working order. A timeless piece for any elegant home.',
        price: 232000.00,
        condition: 'Excellent',
        year: 1925,
        category: 'Furniture',
        image: 'antique_furniture_3.jpg'
    }
];

async function initializeDatabase() {
    console.log('🔧 Initializing database schema...');

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    try {
        // Use exec() to execute multiple SQL statements at once
        db.exec(schema);
        console.log('✅ Database schema initialized');
    } catch (error) {
        // If tables already exist, that's okay
        if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
            console.error('Error initializing schema:', error.message);
            throw error;
        }
        console.log('✅ Database schema already exists');
    }
}

async function seed() {
    try {
        console.log('🌱 Starting database seeding...');

        // Initialize database schema
        await initializeDatabase();

        // Create sample seller
        console.log('Creating sample seller account...');
        const sellerResult = await query(
            'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id',
            ['seller@antiques.com', 'seller123', 'Seller']
        );
        const sellerId = sellerResult.rows[0]?.id;
        console.log(`✅ Created seller with ID: ${sellerId}`);

        // Create sample buyer for testing
        console.log('Creating sample buyer account...');
        await query(
            'INSERT INTO users (email, password, role) VALUES ($1, $2, $3)',
            ['buyer@antiques.com', 'buyer123', 'Buyer']
        );
        console.log('✅ Created buyer account');

        // Get category IDs
        const categoriesResult = await query('SELECT id, name FROM categories');
        const categoryMap = {};
        categoriesResult.rows.forEach(row => {
            categoryMap[row.name] = row.id;
        });

        // Insert products
        console.log(`Creating ${products.length} curated product listings...`);
        for (const product of products) {
            const categoryId = categoryMap[product.category];
            const imagesJson = JSON.stringify([`/uploads/seed/${product.image}`]);

            await query(
                `INSERT INTO listings (seller_id, category_id, title, description, price, condition, year, images, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
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
        }
        console.log(`✅ Created ${products.length} product listings`);

        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📝 Sample Accounts:');
        console.log('   Seller: seller@antiques.com / seller123');
        console.log('   Buyer: buyer@antiques.com / buyer123');
        console.log(`\n📦 Created ${products.length} curated antique listings`);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
}

// Run the seed function
seed().catch(console.error);
