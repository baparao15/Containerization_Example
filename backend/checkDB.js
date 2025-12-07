import { query } from './db.js';

async function checkListings() {
    try {
        // Wait a bit for database to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('Checking database state...\n');

        // Check users
        const users = await query('SELECT id, email FROM users');
        console.log('Users in database:');
        users.rows.forEach(u => console.log(`  - ${u.email} (ID: ${u.id})`));

        // Check listings count
        const count = await query('SELECT COUNT(*) as count FROM listings');
        console.log(`\nTotal listings: ${count.rows[0].count}`);

        // Check all listings
        const listings = await query('SELECT id, title, seller_id, status FROM listings');
        if (listings.rows.length > 0) {
            console.log('\nListings:');
            listings.rows.forEach(l => {
                console.log(`  ${l.id}. ${l.title}`);
                console.log(`     Seller ID: ${l.seller_id} | Status: ${l.status}`);
            });
        } else {
            console.log('\n⚠️  No listings found in database!');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkListings();
