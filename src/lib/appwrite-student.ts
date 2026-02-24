import { Client, Account, Databases, Storage } from 'appwrite';

const client = new Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID_STUDENT || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

if (!projectId) {
    console.error("Appwrite Student Project ID is missing. Please check your .env.local file.");
} else {
    client
        .setEndpoint(endpoint)
        .setProject(projectId);
}

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const isAppwriteConfigured = () => {
    return !!projectId && !!endpoint;
}

export default client;
