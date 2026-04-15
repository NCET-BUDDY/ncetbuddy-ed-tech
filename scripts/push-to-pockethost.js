/**
 * Remote Migration Script: Local PocketBase → PocketHost.io
 * 
 * Reads data from local PocketBase (127.0.0.1:8090)
 * and pushes it to the remote PocketHost instance.
 * 
 * Usage: REMOTE_PB_URL=https://ncet-buddy.pockethost.io REMOTE_ADMIN_EMAIL=admin@ncetbuddy.com REMOTE_ADMIN_PASSWORD=yourpass node scripts/push-to-pockethost.js
 */

const PocketBase = require('pocketbase/cjs');

const LOCAL_URL = 'http://127.0.0.1:8090';
const REMOTE_URL = process.env.REMOTE_PB_URL || 'https://ncet-buddy.pockethost.io';
const REMOTE_EMAIL = process.env.REMOTE_ADMIN_EMAIL || 'admin@ncetbuddy.com';
const REMOTE_PASSWORD = process.env.REMOTE_ADMIN_PASSWORD || '';

// Collections to migrate (order matters for foreign keys)
const COLLECTIONS = [
    'users',
    'settings',
    'educators',
    'books',
    'formula_cards',
    'videos',
    'educator_videos',
    'pyqs',
    'banners',
    'notifications',
    'tests',
    'sessions',
    'payments',
    'purchases',
    'user_profiles',
    'user_analytics',
    'forum_posts',
    'forum_comments',
    'video_progress',
    'test_results',
    'events',
];

async function main() {
    if (!REMOTE_PASSWORD) {
        console.error('ERROR: Set REMOTE_ADMIN_PASSWORD environment variable');
        process.exit(1);
    }

    // Connect to local PocketBase
    const localPb = new PocketBase(LOCAL_URL);
    localPb.autoCancellation(false);

    // Connect to remote PocketHost
    const remotePb = new PocketBase(REMOTE_URL);
    remotePb.autoCancellation(false);

    // Authenticate as admin on local
    try {
        await localPb.admins.authWithPassword(
            process.env.LOCAL_ADMIN_EMAIL || 'admin@ncetbuddy.com',
            process.env.LOCAL_ADMIN_PASSWORD || 'password123'
        );
        console.log('✅ Connected to LOCAL PocketBase');
    } catch (e) {
        console.error('❌ Failed to connect to local PocketBase. Is it running on port 8090?');
        console.error(e.message);
        process.exit(1);
    }

    // Authenticate as admin on remote
    try {
        await remotePb.admins.authWithPassword(REMOTE_EMAIL, REMOTE_PASSWORD);
        console.log('✅ Connected to REMOTE PocketHost');
    } catch (e) {
        console.error('❌ Failed to connect to remote PocketHost. Check credentials.');
        console.error(e.message);
        process.exit(1);
    }

    // Step 1: Fetch all local collections and create them on remote
    console.log('\n📦 Step 1: Syncing collection schemas...');
    let localCollections;
    try {
        localCollections = await localPb.collections.getFullList();
        console.log(`   Found ${localCollections.length} collections locally`);
    } catch (e) {
        console.error('Failed to fetch local collections:', e.message);
        process.exit(1);
    }

    // Get existing remote collections
    let remoteCollections;
    try {
        remoteCollections = await remotePb.collections.getFullList();
    } catch (e) {
        remoteCollections = [];
    }
    const remoteCollectionNames = new Set(remoteCollections.map(c => c.name));

    // Create missing collections on remote (skip system collections like _superusers)
    for (const col of localCollections) {
        if (col.name.startsWith('_')) continue; // Skip system collections
        
        if (remoteCollectionNames.has(col.name)) {
            console.log(`   ⏭️  Collection "${col.name}" already exists remotely, skipping schema`);
            continue;
        }

        try {
            // Build collection create payload
            const payload = {
                name: col.name,
                type: col.type,
                schema: col.schema,
                listRule: col.listRule,
                viewRule: col.viewRule,
                createRule: col.createRule,
                updateRule: col.updateRule,
                deleteRule: col.deleteRule,
                options: col.options || {},
            };
            await remotePb.collections.create(payload);
            console.log(`   ✅ Created collection "${col.name}"`);
        } catch (e) {
            console.error(`   ❌ Failed to create "${col.name}":`, e.message);
        }
    }

    // Step 2: Migrate records for each collection
    console.log('\n📤 Step 2: Migrating records...');

    for (const colName of COLLECTIONS) {
        // Skip users collection (auth collection needs special handling)
        if (colName === 'users') {
            console.log(`   ⏭️  Skipping "users" (auth collection - must be migrated separately)`);
            continue;
        }

        try {
            const localRecords = await localPb.collection(colName).getFullList({
                batch: 200,
            });

            if (localRecords.length === 0) {
                console.log(`   ⏭️  "${colName}": 0 records, skipping`);
                continue;
            }

            let created = 0;
            let skipped = 0;
            let failed = 0;

            for (const record of localRecords) {
                // Strip PocketBase system fields
                const { id, collectionId, collectionName, created: _c, updated: _u, expand, ...data } = record;

                try {
                    // Try to create with the same ID to preserve relationships
                    await remotePb.collection(colName).create({ ...data, id });
                    created++;
                } catch (e) {
                    if (e.status === 400 && e.message?.includes('already exists')) {
                        skipped++;
                    } else {
                        failed++;
                        if (failed <= 3) {
                            console.error(`      ⚠️  "${colName}" record ${id}: ${e.message}`);
                        }
                    }
                }
            }

            console.log(`   ✅ "${colName}": ${created} created, ${skipped} skipped, ${failed} failed (of ${localRecords.length} total)`);
        } catch (e) {
            console.error(`   ❌ "${colName}": ${e.message}`);
        }
    }

    console.log('\n🎉 Migration complete!');
    console.log(`\n🌐 Your production PocketBase is live at: ${REMOTE_URL}`);
    console.log(`🔧 Admin panel: ${REMOTE_URL}/_/`);
}

main().catch(console.error);
