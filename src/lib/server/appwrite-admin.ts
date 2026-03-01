import { Client, Databases, Storage } from 'node-appwrite';

// Initialize Admin Client for STUDENT Project
const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID_STUDENT!)
    .setKey(process.env.APPWRITE_API_KEY!);

console.log("Appwrite Admin Config:", {
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID_STUDENT,
    dbId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
    hasKey: !!process.env.APPWRITE_API_KEY
});

const databases = new Databases(client);
const storage = new Storage(client);
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'ncet-buddy-db';
const BANNER_BUCKET_ID = 'banners';

export { client, databases, storage, DB_ID, BANNER_BUCKET_ID };
