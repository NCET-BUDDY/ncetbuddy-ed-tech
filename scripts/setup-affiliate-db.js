const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID_STUDENT)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'ncet-buddy-db';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function setupAffiliateDB() {
    try {
        console.log("Setting up affiliate_earnings ...");
        try {
            await databases.createCollection(DB_ID, 'affiliate_earnings', 'Affiliate Earnings');
            console.log("Created collection affiliate_earnings.");
        } catch (e) { console.log("Collection exists."); }

        try { await databases.createStringAttribute(DB_ID, 'affiliate_earnings', 'affiliateId', 100, true); } catch (e) { }
        try { await databases.createFloatAttribute(DB_ID, 'affiliate_earnings', 'amount', true); } catch (e) { }
        // Not required if there is a default
        try { await databases.createStringAttribute(DB_ID, 'affiliate_earnings', 'status', 50, false, "pending"); } catch (e) { }
        try { await databases.createStringAttribute(DB_ID, 'affiliate_earnings', 'referredUserId', 100, true); } catch (e) { }
        try { await databases.createStringAttribute(DB_ID, 'affiliate_earnings', 'purchaseId', 100, true); } catch (e) { }
        try { await databases.createDatetimeAttribute(DB_ID, 'affiliate_earnings', 'createdAt', true); } catch (e) { }

        console.log("Attributes for affiliate_earnings processed.");

        console.log("Setting up withdrawal_requests ...");
        try {
            await databases.createCollection(DB_ID, 'withdrawal_requests', 'Withdrawal Requests');
            console.log("Created collection withdrawal_requests.");
        } catch (e) { console.log("Collection exists."); }

        try { await databases.createStringAttribute(DB_ID, 'withdrawal_requests', 'userId', 100, true); } catch (e) { }
        try { await databases.createFloatAttribute(DB_ID, 'withdrawal_requests', 'amount', true); } catch (e) { }
        try { await databases.createStringAttribute(DB_ID, 'withdrawal_requests', 'upiId', 100, true); } catch (e) { }
        try { await databases.createStringAttribute(DB_ID, 'withdrawal_requests', 'status', 50, false, "pending"); } catch (e) { }
        try { await databases.createDatetimeAttribute(DB_ID, 'withdrawal_requests', 'createdAt', true); } catch (e) { }

        console.log("Attributes for withdrawal_requests processed.");

        console.log("Done.");
    } catch (e) {
        console.error("Setup failed:", e);
    }
}

setupAffiliateDB();
