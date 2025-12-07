import { query } from './db.js';

async function verifyListings() {
    try {
        await new Promise(resolve => setTimeout(resolve, 500));

        const listings = await query(`
            SELECT l.id, l.title, l.price, l.status, l.seller_id,
                   c.name as category
            FROM listings l
            LEFT JOIN categories c ON l.category_id = c.id
            ORDER BY l.id
        `);

        console.log('\n📋 LISTINGS IN DATABASE:\n');
        console.log(`Total: ${listings.rows.length} listings\n`);

        if (listings.rows.length > 0) {
            listings.rows.forEach((l, i) => {
                console.log(`${i + 1}. ${l.title}`);
                console.log(`   ID: ${l.id} | Category: ${l.category || 'N/A'}`);
                console.log(`   Price: ₹${parseFloat(l.price).toLocaleString('en-IN')}`);
                console.log(`   Status: ${l.status} | Seller ID: ${l.seller_id}\n`);
            });
        } else {
            console.log('⚠️  No listings found!\n');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

verifyListings();
