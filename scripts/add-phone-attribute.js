// Script to add 'phoneNumber' attribute to the 'users' collection in Appwrite
// Run: node scripts/add-phone-attribute.js

require('dotenv').config({ path: '.env.local' });

const { Client, Databases } = require('node-appwrite');

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID_STUDENT;
const apiKey = process.env.APPWRITE_API_KEY;
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'ncet-buddy-db';

console.log("Config:", { endpoint, projectId, dbId, hasKey: !!apiKey });

if (!apiKey) {
    console.error("ERROR: APPWRITE_API_KEY is missing from .env.local");
    process.exit(1);
}

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new Databases(client);

async function addPhoneNumberAttribute() {
    const collections = ['users', 'user_profiles'];
    
    for (const collectionId of collections) {
        try {
            console.log(`\nAdding 'phoneNumber' attribute to '${collectionId}' collection...`);
            await databases.createStringAttribute(
                dbId,
                collectionId,
                'phoneNumber',
                20,       // size
                false,    // required
                null,     // default
                false     // array
            );
            console.log(`✅ 'phoneNumber' attribute created in '${collectionId}'!`);
            console.log("   Note: It may take a few seconds for Appwrite to process the new attribute.");
        } catch (error) {
            if (error.code === 409) {
                console.log(`⚠️ 'phoneNumber' already exists in '${collectionId}', skipping.`);
            } else if (error.code === 404) {
                console.log(`⚠️ Collection '${collectionId}' not found, skipping.`);
            } else {
                console.error(`❌ Error adding to '${collectionId}':`, error.message || error);
            }
        }
    }
    
    console.log("\n🎉 Done! Please wait ~10 seconds for Appwrite to finish processing, then try the mentorship modal again.");
}

addPhoneNumberAttribute();
