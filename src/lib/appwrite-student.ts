import { Client, Account, Databases, Storage, Functions } from 'appwrite';

const client = new Client();
const analyticsClient = new Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID_STUDENT || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const analyticsProjectId = process.env.NEXT_PUBLIC_APPWRITE_ANALYTICS_PROJECT_ID;

if (!projectId) {
    console.error("Appwrite Student Project ID is missing. Please check your .env.local file.");
} else {
    client
        .setEndpoint(endpoint)
        .setProject(projectId);
}

if (!analyticsProjectId) {
    console.warn("Appwrite Analytics Project ID is missing. Analytics queries will fail until configured.");
} else {
    analyticsClient
        .setEndpoint(endpoint)
        .setProject(analyticsProjectId);
}

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

// Export the dedicated analytics databases client
export const analyticsDatabases = analyticsProjectId ? new Databases(analyticsClient) : databases;

export const isAppwriteConfigured = () => {
    return !!projectId && !!endpoint;
}

export default client;
