/**
 * PocketBase Schema Setup Script
 * Creates all required collections with their fields in PocketBase.
 * 
 * Usage:
 *   1. Start PocketBase: ./pocketbase serve
 *   2. Create an admin account via the UI: http://127.0.0.1:8090/_/
 *   3. Set env vars:
 *      export POCKETBASE_URL=http://127.0.0.1:8090
 *      export POCKETBASE_ADMIN_EMAIL=admin@yourdomain.com
 *      export POCKETBASE_ADMIN_PASSWORD=your_password
 *   4. Run: node scripts/setup-pocketbase-schema.js
 */

const PocketBase = require('pocketbase/cjs');

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Please set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD environment variables.");
    process.exit(1);
}

const pb = new PocketBase(POCKETBASE_URL);
pb.autoCancellation(false);

/**
 * Collection definitions mapped from Appwrite schema.
 * PocketBase field types: text, number, bool, url, json, email, date, relation, file, select
 */
const COLLECTIONS = [
    {
        name: 'users',
        type: 'base', // 'auth' type already exists for built-in auth, this is the profile collection
        schema: [
            { name: 'userId', type: 'text', required: true },
            { name: 'email', type: 'email', required: true },
            { name: 'displayName', type: 'text', required: true },
            { name: 'role', type: 'select', required: true, options: { values: ['user', 'admin'], maxSelect: 1 } },
            { name: 'premiumStatus', type: 'bool', required: true },
            { name: 'isBanned', type: 'bool', required: false },
            { name: 'phoneNumber', type: 'text', required: false },
            { name: 'enrolledEducatorId', type: 'text', required: false },
            { name: 'totalScore', type: 'number', required: false },
            { name: 'testsAttempted', type: 'number', required: false },
            { name: 'streak', type: 'number', required: false },
            { name: 'lastActiveDate', type: 'text', required: false },
            { name: 'dailyGoal', type: 'text', required: false },
            { name: 'dailyProgress', type: 'number', required: false },
            { name: 'dailyGoalTarget', type: 'number', required: false },
            { name: 'stream', type: 'text', required: false },
            { name: 'createdAt', type: 'number', required: false },
        ]
    },
    {
        name: 'user_profiles',
        type: 'base',
        schema: [
            { name: 'userId', type: 'text', required: true },
            { name: 'email', type: 'email', required: false },
            { name: 'displayName', type: 'text', required: false },
            { name: 'role', type: 'select', required: true, options: { values: ['user', 'admin', 'educator'], maxSelect: 1 } },
            { name: 'premiumStatus', type: 'bool', required: false },
        ]
    },
    {
        name: 'tests',
        type: 'base',
        schema: [
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'text', required: false },
            { name: 'subject', type: 'text', required: false },
            { name: 'duration', type: 'number', required: true },
            { name: 'questions', type: 'json', required: true, options: { maxSize: 2000000 } },
            { name: 'createdBy', type: 'text', required: true },
            { name: 'isVisible', type: 'bool', required: true },
            { name: 'status', type: 'select', required: false, options: { values: ['Draft', 'Published', 'Archived'], maxSelect: 1 } },
            { name: 'createdAt', type: 'number', required: true },
            { name: 'testType', type: 'select', required: false, options: { values: ['pyq', 'educator'], maxSelect: 1 } },
            { name: 'pyqSubject', type: 'select', required: false, options: { values: ['languages', 'humanities', 'science', 'commerce', 'non-domain'], maxSelect: 1 } },
            { name: 'price', type: 'number', required: false },
            { name: 'series', type: 'text', required: false },
            { name: 'isFullSyllabus', type: 'bool', required: false },
            { name: 'maxSubjectChoices', type: 'number', required: false },
            { name: 'subjectAllocations', type: 'json', required: false, options: { maxSize: 2000000 } },
        ]
    },
    {
        name: 'test_results',
        type: 'base',
        schema: [
            { name: 'userId', type: 'text', required: true },
            { name: 'testId', type: 'text', required: true },
            { name: 'score', type: 'number', required: true },
            { name: 'totalQuestions', type: 'number', required: true },
            { name: 'answers', type: 'json', required: true, options: { maxSize: 2000000 } },
            { name: 'completedAt', type: 'number', required: true },
            { name: 'timeTaken', type: 'number', required: false },
            { name: 'questionTimes', type: 'json', required: false, options: { maxSize: 2000000 } },
        ]
    },
    {
        name: 'books',
        type: 'base',
        schema: [
            { name: 'title', type: 'text', required: true },
            { name: 'subject', type: 'text', required: true },
            { name: 'chapter', type: 'text', required: false },
            { name: 'url', type: 'url', required: true },
            { name: 'thumbnailColor', type: 'text', required: true },
            { name: 'isVisible', type: 'bool', required: true },
            { name: 'createdAt', type: 'number', required: false },
        ]
    },
    {
        name: 'formula_cards',
        type: 'base',
        schema: [
            { name: 'title', type: 'text', required: true },
            { name: 'subject', type: 'text', required: true },
            { name: 'chapter', type: 'text', required: false },
            { name: 'content', type: 'text', required: false },
            { name: 'imageUrl', type: 'url', required: false },
            { name: 'url', type: 'url', required: false },
            { name: 'isVisible', type: 'bool', required: true },
            { name: 'createdAt', type: 'number', required: false },
        ]
    },
    {
        name: 'pyqs',
        type: 'base',
        schema: [
            { name: 'title', type: 'text', required: true },
            { name: 'subject', type: 'text', required: true },
            { name: 'year', type: 'number', required: true },
            { name: 'url', type: 'url', required: true },
            { name: 'createdAt', type: 'number', required: true },
        ]
    },
    {
        name: 'videos',
        type: 'base',
        schema: [
            { name: 'videoId', type: 'text', required: false },
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'text', required: false },
            { name: 'url', type: 'url', required: true },
            { name: 'duration', type: 'number', required: false },
            { name: 'authorId', type: 'text', required: false },
            { name: 'subject', type: 'text', required: false },
            { name: 'thumbnailUrl', type: 'url', required: false },
            { name: 'createdAt', type: 'number', required: false },
        ]
    },
    {
        name: 'notifications',
        type: 'base',
        schema: [
            { name: 'title', type: 'text', required: true },
            { name: 'message', type: 'text', required: true },
            { name: 'type', type: 'select', required: true, options: { values: ['info', 'alert', 'success'], maxSelect: 1 } },
            { name: 'createdAt', type: 'number', required: true },
        ]
    },
    {
        name: 'settings',
        type: 'base',
        schema: [
            { name: 'bannerText', type: 'text', required: true },
            { name: 'primaryColor', type: 'text', required: true },
            { name: 'contactEmail', type: 'email', required: true },
            { name: 'showBanner', type: 'bool', required: true },
        ]
    },
    {
        name: 'educators',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'subject', type: 'text', required: true },
            { name: 'logoFileId', type: 'text', required: false },
            { name: 'catalogXmlFileId', type: 'text', required: false },
            { name: 'youtubeChannelId', type: 'text', required: false },
        ]
    },
    {
        name: 'educator_videos',
        type: 'base',
        schema: [
            { name: 'educatorId', type: 'text', required: true },
            { name: 'title', type: 'text', required: true },
            { name: 'url', type: 'url', required: true },
            { name: 'createdAt', type: 'number', required: true },
        ]
    },
    {
        name: 'purchases',
        type: 'base',
        schema: [
            { name: 'userId', type: 'text', required: true },
            { name: 'testId', type: 'text', required: true },
            { name: 'paymentId', type: 'text', required: false },
            { name: 'paymentRequestId', type: 'text', required: true },
            { name: 'amount', type: 'number', required: true },
            { name: 'status', type: 'select', required: true, options: { values: ['pending', 'completed', 'failed'], maxSelect: 1 } },
            { name: 'productName', type: 'text', required: false },
            { name: 'createdAt', type: 'number', required: true },
        ]
    },
    {
        name: 'payments',
        type: 'base',
        schema: [
            { name: 'userId', type: 'text', required: true },
            { name: 'paymentId', type: 'text', required: true },
            { name: 'paymentRequestId', type: 'text', required: true },
            { name: 'amount', type: 'number', required: true },
            { name: 'status', type: 'text', required: true },
            { name: 'productName', type: 'text', required: true },
            { name: 'createdAt', type: 'number', required: true },
        ]
    },
    {
        name: 'sessions',
        type: 'base',
        schema: [
            { name: 'userId', type: 'text', required: true },
            { name: 'startTime', type: 'number', required: true },
            { name: 'endTime', type: 'number', required: false },
            { name: 'duration', type: 'number', required: false },
            { name: 'deviceInfo', type: 'text', required: false },
        ]
    },
    {
        name: 'events',
        type: 'base',
        schema: [
            { name: 'userId', type: 'text', required: true },
            { name: 'eventType', type: 'select', required: true, options: { values: ['login', 'page_visit', 'test_start', 'test_complete', 'video_watch', 'other'], maxSelect: 1 } },
            { name: 'pageName', type: 'text', required: false },
            { name: 'metadata', type: 'json', required: false, options: { maxSize: 2000000 } },
            { name: 'timestamp', type: 'number', required: true },
        ]
    },
    {
        name: 'user_analytics',
        type: 'base',
        schema: [
            { name: 'userId', type: 'text', required: true },
            { name: 'totalTime', type: 'number', required: false },
            { name: 'lastActive', type: 'number', required: false },
            { name: 'mostUsedFeature', type: 'text', required: false },
            { name: 'testsAttempted', type: 'number', required: false },
            { name: 'engagementLevel', type: 'select', required: false, options: { values: ['High', 'Medium', 'Low'], maxSelect: 1 } },
            { name: 'sessions', type: 'number', required: false },
        ]
    },
    {
        name: 'video_progress',
        type: 'base',
        schema: [
            { name: 'studentId', type: 'text', required: true },
            { name: 'educatorId', type: 'text', required: true },
            { name: 'videoId', type: 'text', required: true },
            { name: 'watched', type: 'bool', required: true },
            { name: 'updatedAt', type: 'text', required: false },
        ]
    },
    {
        name: 'forum_posts',
        type: 'base',
        schema: [
            { name: 'userId', type: 'text', required: true },
            { name: 'authorName', type: 'text', required: true },
            { name: 'title', type: 'text', required: true },
            { name: 'content', type: 'text', required: true },
            { name: 'category', type: 'select', required: true, options: { values: ['General', 'Doubt', 'Exam Update', 'Strategy'], maxSelect: 1 } },
            { name: 'upvotes', type: 'number', required: false },
            { name: 'views', type: 'number', required: false },
            { name: 'createdAt', type: 'number', required: true },
        ]
    },
    {
        name: 'forum_comments',
        type: 'base',
        schema: [
            { name: 'postId', type: 'text', required: true },
            { name: 'userId', type: 'text', required: true },
            { name: 'authorName', type: 'text', required: true },
            { name: 'content', type: 'text', required: true },
            { name: 'createdAt', type: 'number', required: true },
        ]
    },
    {
        name: 'banners',
        type: 'base',
        schema: [
            { name: 'title', type: 'text', required: true },
            { name: 'imageUrl', type: 'url', required: true },
            { name: 'linkUrl', type: 'url', required: false },
            { name: 'isActive', type: 'bool', required: true },
            { name: 'order', type: 'number', required: true },
            { name: 'createdAt', type: 'number', required: true },
        ]
    },
];

async function setup() {
    console.log(`\nSetting up PocketBase schema at ${POCKETBASE_URL}...\n`);

    try {
        const response = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();
        pb.authStore.save(data.token, data.admin);
        console.log('✅ Authenticated as admin\n');
    } catch (err) {
        console.error('❌ Admin authentication failed:', err.message);
        console.error('   Make sure you have created an admin account at', `${POCKETBASE_URL}/_/`);
        process.exit(1);
    }

    // Fetch existing collections to check for duplicates
    let existingCollections = [];
    try {
        existingCollections = await pb.collections.getFullList();
    } catch (err) {
        console.warn('Warning: Could not fetch existing collections:', err.message);
    }
    const existingNames = new Set(existingCollections.map(c => c.name));

    for (const col of COLLECTIONS) {
        console.log(`Processing collection [${col.name}]...`);

        if (existingNames.has(col.name)) {
            console.log(`  ✅ Collection already exists — skipping creation`);
            continue;
        }

        try {
            await pb.collections.create({
                name: col.name,
                type: col.type || 'base',
                schema: col.schema,
                listRule: '', // Allow all reads (adjust per your security needs)
                viewRule: '',
                createRule: null, // Admin only for creates by default
                updateRule: null,
                deleteRule: null,
            });
            console.log(`  ✅ Collection created with ${col.schema.length} fields`);
        } catch (err) {
            console.error(`  ❌ Failed to create collection [${col.name}]:`, err.response?.data || err.message || err);
        }

        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 100));
    }

    console.log('\n🚀 Schema setup complete!');
    console.log('\nNext steps:');
    console.log('  1. Review API rules in PocketBase Admin UI');
    console.log('  2. Configure Google OAuth in Settings > Auth Providers');
    console.log('  3. Run the data migration script: node scripts/pocketbase-migrator.js');
}

setup();
