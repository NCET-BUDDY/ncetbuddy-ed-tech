import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID_STUDENT;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'ncet-buddy-db';

if (!projectId || !apiKey) {
    console.error("Missing Appwrite credentials in .env.local");
    process.exit(1);
}

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new Databases(client);

async function createPaymentsCollection() {
    try {
        console.log(`Creating 'payments' collection in database: ${databaseId}...`);

        try {
            await databases.createCollection(
                databaseId,
                'payments',
                'Payments'
            );
            console.log("Collection 'payments' created successfully.");
        } catch (e: any) {
            if (e.code === 409) {
                console.log("Collection 'payments' already exists. We will proceed to create missing attributes.");
            } else {
                throw e;
            }
        }

        console.log("Creating/verifying required attributes...");

        const attributes = [
            { id: 'userId', type: 'string', size: 255, required: true },
            { id: 'paymentId', type: 'string', size: 255, required: true },
            { id: 'paymentRequestId', type: 'string', size: 255, required: true },
            { id: 'amount', type: 'float', required: true },
            { id: 'status', type: 'string', size: 255, required: true },
            { id: 'productName', type: 'string', size: 255, required: true },
            { id: 'createdAt', type: 'integer', required: true }
        ];

        for (const attr of attributes) {
            try {
                if (attr.type === 'string') {
                    await databases.createStringAttribute(databaseId, 'payments', attr.id, attr.size!, attr.required);
                } else if (attr.type === 'float') {
                    await databases.createFloatAttribute(databaseId, 'payments', attr.id, attr.required);
                } else if (attr.type === 'integer') {
                    await databases.createIntegerAttribute(databaseId, 'payments', attr.id, attr.required);
                }
                console.log(`Attribute '${attr.id}' creation initiated.`);
            } catch (e: any) {
                if (e.code === 409) {
                    console.log(`Attribute '${attr.id}' already exists.`);
                } else {
                    console.error(`Error creating attribute '${attr.id}':`, e.message);
                }
            }
        }

        console.log("\nProcess completed. Note: Appwrite attribute creation is asynchronous. It might take a few moments for them to become 'available'.");
    } catch (error) {
        console.error("Error creating collection or attributes:", error);
    }
}

createPaymentsCollection();
