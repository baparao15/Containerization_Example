import { query } from './db.js';

async function checkImagePaths() {
    try {
        console.log('🔍 Checking database image paths...\n');
        const r = await query('SELECT title, images FROM listings');

        if (r.rows.length === 0) {
            console.log('⚠️ No listings found.');
            process.exit(0);
        }

        r.rows.forEach(l => {
            // Parse images JSON if it's a string
            let images = l.images;
            try {
                if (typeof images === 'string') images = JSON.parse(images);
            } catch (e) { }

            console.log(`📦 Product: ${l.title}`);
            console.log(`   Path: ${JSON.stringify(images)}`);

            // Basic validation
            const isLocal = Array.isArray(images) && images.every(img => img.startsWith('/uploads/'));
            console.log(`   ✅ Is Local Path? ${isLocal ? 'YES' : 'NO'}`);
            console.log('---');
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkImagePaths();
