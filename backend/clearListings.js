import { query } from './db.js';

async function clearListings() {
    try {
        console.log('🗑️  Clearing all listings from database...\n');

        // Delete all listings (this will cascade delete related offers and messages)
        const result = await query('DELETE FROM listings');

        console.log(`✅ Deleted all listings successfully!`);
        console.log(`📊 Total listings removed: ${result.rowCount || 'all'}\n`);

        // Verify deletion
        const checkResult = await query('SELECT COUNT(*) as count FROM listings');
        console.log(`📋 Remaining listings: ${checkResult.rows[0].count}`);

        if (checkResult.rows[0].count === 0) {
            console.log('\n✨ Database is now clean! All listings have been removed.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing listings:', error);
        process.exit(1);
    }
}

clearListings();
