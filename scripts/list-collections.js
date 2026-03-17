// Script to list all collections in the database
require('dotenv').config({ path: '.env.local' });
const { Client, Databases } = require('node-appwrite');

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID_STUDENT;
const apiKey = process.env.APPWRITE_API_KEY;
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'ncet-buddy-db';

console.log("Config:", { endpoint, projectId, dbId, hasKey: !!apiKey });

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

async function listCollections() {
    try {
        // First list databases
        console.log("Listing databases...");
        const dbs = await databases.list();
        console.log("Databases:", dbs.databases.map(d => `${d.$id} (${d.name})`));
        
        // List collections in each DB
        for (const db of dbs.databases) {
            console.log(`\nCollections in '${db.$id}':`);
            const cols = await databases.listCollections(db.$id);
            cols.collections.forEach(c => {
                console.log(`  - ${c.$id} (${c.name})`);
            });
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
}

listCollections();
