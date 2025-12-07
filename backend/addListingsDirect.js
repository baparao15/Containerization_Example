import db, { query } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = path.join(__dirname, 'data', 'heirloom_hub.db');

async function addListingsDirectly() {
    console.log('Adding listings directly to database...\n');

    try {
        // First, ensure seller exists
        let sellerId;
        const sellerCheck = await query('SELECT id FROM users WHERE email = ?', ['seller@antiques.com']);

        if (sellerCheck.rows.length === 0) {
            console.log('Creating seller account...');
            const newSeller = await query(
                'INSERT INTO users (email, password, role) VALUES (?, ?, ?) RETURNING id',
                ['seller@antiques.com', 'seller123', 'Seller']
            );
            sellerId = newSeller.rows[0].id;
        } else {
            sellerId = sellerCheck.rows[0].id;
        }

        console.log(`Seller ID: ${sellerId}\n`);

        // Get Furniture category ID
        const furnitureCat = await query('SELECT id FROM categories WHERE name = ?', ['Furniture']);
        const jewelryCat = await query('SELECT id FROM categories WHERE name = ?', ['Jewelry']);
        const artCat = await query('SELECT id FROM categories WHERE name = ?', ['Art & Paintings']);
        const collectiblesCat = await query('SELECT id FROM categories WHERE name = ?', ['Collectibles']);

        // Insert 5 listings
        const listings = [
            [sellerId, furnitureCat.rows[0].id, 'Victorian Mahogany Writing Desk', 'Exquisite Victorian-era mahogany writing desk from 1880s featuring ornate hand-carved details, brass handles, and a beautiful leather inlay top.', 290000, '5 Stars - Excellent', 1880, '["/uploads/seed/antique_furniture_1.jpg"]', 'available'],
            [sellerId, jewelryCat.rows[0].id, 'Art Deco Diamond Bracelet', 'Spectacular 1930s Art Deco platinum and diamond bracelet featuring geometric patterns. Set with high-quality diamonds totaling approximately 5 carats.', 1000000, '5 Stars - Excellent', 1935, '["/uploads/seed/antique_jewelry_1.jpg"]', 'available'],
            [sellerId, artCat.rows[0].id, '19th Century Landscape Oil Painting', 'Original 19th century oil painting depicting a pastoral landscape. Housed in an ornate gilded frame. Signed by the artist. Canvas measures 24" x 36".', 456000, '4 Stars - Very Good', 1870, '["/uploads/seed/antique_art_1.jpg"]', 'available'],
            [sellerId, collectiblesCat.rows[0].id, 'Vintage Porcelain Tea Set', 'Complete 1920s Royal Doulton porcelain tea set with hand-painted floral patterns and 24k gold trim. Includes teapot, sugar bowl, creamer, 6 cups and saucers.', 79000, '5 Stars - Excellent', 1925, '["/uploads/seed/antique_collectible_1.jpg"]', 'available'],
            [sellerId, collectiblesCat.rows[0].id, 'Antique Brass Telescope', 'Early 1900s brass telescope on wooden tripod with leather accents. Fully functional with clear optics. Tripod is made of solid mahogany with brass fittings.', 133000, '4 Stars - Very Good', 1905, '["/uploads/seed/antique_collectible_2.jpg"]', 'available']
        ];

        for (let i = 0; i < listings.length; i++) {
            const listing = listings[i];
            await query(
                'INSERT INTO listings (seller_id, category_id, title, description, price, condition, year, images, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                listing
            );
            console.log(`✅ Added listing ${i + 1}: ${listing[2]}`);
        }

        // Force save
        if (db) {
            const data = db.export();
            const buffer = Buffer.from(data);
            fs.writeFileSync(dbPath, buffer);
            console.log('\n💾 Database saved!');
        }

        // Verify
        const count = await query('SELECT COUNT(*) as count FROM listings');
        console.log(`\n✅ Total listings in database: ${count.rows[0].count}`);

        const sellerListings = await query('SELECT id, title FROM listings WHERE seller_id = ?', [sellerId]);
        console.log(`\nSeller's listings:`);
        sellerListings.rows.forEach(l => console.log(`  - ${l.title}`));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addListingsDirectly();
