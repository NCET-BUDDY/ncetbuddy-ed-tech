const sdk = require('node-appwrite');
const PocketBase = require('pocketbase/cjs');

// Appwrite Config
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY; // Admin API key required
const APPWRITE_DB_ID = process.env.APPWRITE_DB_ID || 'ncet-buddy-db';

// PocketBase Config
const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const POCKETBASE_ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const POCKETBASE_ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !POCKETBASE_ADMIN_EMAIL || !POCKETBASE_ADMIN_PASSWORD) {
    console.error("Missing required environment variables. Please check the script code.");
    process.exit(1);
}

// Init Appwrite
const appwriteClient = new sdk.Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);
const databases = new sdk.Databases(appwriteClient);

// Init PocketBase
const pb = new PocketBase(POCKETBASE_URL);
pb.autoCancellation(false);

const COLLECTIONS_TO_MIGRATE = [
    { from: 'users', to: 'users' }, 
    { from: 'tests', to: 'tests' }, 
    { from: 'test-results', to: 'test_results' }, 
    { from: 'purchases', to: 'purchases' }, 
    { from: 'payments', to: 'payments' }, 
    { from: 'books', to: 'books' }, 
    { from: 'pyqs', to: 'pyqs' }, 
    { from: 'videos', to: 'videos' }, 
    { from: 'formula_cards', to: 'formula_cards' }, 
    { from: 'settings', to: 'settings' },
    { from: 'forum_posts', to: 'forum_posts' }, 
    { from: 'forum_comments', to: 'forum_comments' }
];

async function migrateCollection(mapping) {
    const fromCol = mapping.from;
    const toCol = mapping.to;
    console.log(`\n--- Migrating Collection: ${fromCol} -> ${toCol} ---`);
    let offset = 0;
    const limit = 100;
    let totalMigrated = 0;

    let hasMore = true;

    while (hasMore) {
        try {
            const response = await databases.listDocuments(APPWRITE_DB_ID, fromCol, [
                sdk.Query.limit(limit),
                sdk.Query.offset(offset)
            ]);

            const docs = response.documents;
            if (docs.length === 0) {
                hasMore = false;
                break;
            }

            for (const doc of docs) {
                // Ensure ID is retained whenever possible, PocketBase IDs must be 15 chars string. 
                // Appwrite uses 20 length alphanumeric, PB restricts to 15.
                // We truncate to 15 chars to preserve relationships.
                const pbData = { ...doc };
                pbData.id = doc.$id.length > 15 ? doc.$id.substring(0, 15) : doc.$id;
                
                // Remove Appwrite system fields
                delete pbData.$id;
                delete pbData.$createdAt;
                delete pbData.$updatedAt;
                delete pbData.$permissions;
                delete pbData.$databaseId;
                delete pbData.$collectionId;
                delete pbData.$tenant;

                // Truncate foreign keys to 15 chars to match the new truncated IDs
                const relationalFields = ['userId', 'testId', 'educatorId', 'authorId', 'videoId', 'postId'];
                for (const field of relationalFields) {
                    if (pbData[field] && typeof pbData[field] === 'string' && pbData[field].length > 15) {
                        pbData[field] = pbData[field].substring(0, 15);
                    }
                }

                // Transform arrays/stringified JSON if needed
                for (const key in pbData) {
                    if (typeof pbData[key] === 'string' && (pbData[key].startsWith('[') || pbData[key].startsWith('{'))) {
                        try {
                            pbData[key] = JSON.parse(pbData[key]);
                        } catch(e) {
                            // Not a valid JSON, leave as string
                        }
                    }
                }

                // If migrating to the PocketBase builtin auth 'users' collection, a password is required by default.
                if (toCol === 'users') {
                    pbData.password = pbData.passwordConfirm = 'MigrationOauth123!';
                }

                try {
                    // Note: Ensure the collection is created in PocketBase admin UI first
                    // The schema MUST match or PB will reject unknown fields.
                    await pb.collection(toCol).create(pbData, { $autoCancel: false });
                    totalMigrated++;
                    process.stdout.write('.');
                } catch (createErr) {
                    // Might be duplicate or schema mismatch
                    if (createErr.status === 400 && createErr.data?.data?.id) {
                         // IDs didn't match validation length (usually PB restricts to 15 alphanum)
                         delete pbData.id;
                         try {
                             await pb.collection(toCol).create(pbData, { $autoCancel: false });
                             totalMigrated++;
                             process.stdout.write('+'); // indicates new ID
                         } catch (e) {
                             console.error(`\nFailed to create doc in ${toCol}:`, e);
                         }
                    } else {
                         console.error(`\nFailed to create doc in ${toCol} with ID ${doc.$id}:`, createErr);
                    }
                }
            }

            offset += limit;
        } catch (err) {
            console.error(`Error fetching from Appwrite collection ${fromCol}:`, err.message);
            hasMore = false;
        }
    }

    console.log(`\n✅ Completed mapping ${totalMigrated} documents for ${fromCol}`);
}

async function run() {
    try {
        console.log("Authenticating with PocketBase as Admin...");
        const response = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: POCKETBASE_ADMIN_EMAIL, password: POCKETBASE_ADMIN_PASSWORD })
        });
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();
        pb.authStore.save(data.token, data.admin);
        console.log('✅ Connected to PocketBase\n');

        for (const mapping of COLLECTIONS_TO_MIGRATE) {
            // NOTE: Before running, ensure all collections exist in PocketBase with identical schema requirements
            await migrateCollection(mapping);
        }

        console.log("\n🚀 MIGRATION COMPLETED.");

    } catch (error) {
        console.error("Migration failed centrally:", error);
    }
}

run();
