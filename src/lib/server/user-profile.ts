import { Client, Databases } from 'node-appwrite';

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID_EDUCATOR || '')
    .setKey(process.env.APPWRITE_API_KEY_EDUCATOR || process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);

/**
 * Get user role from user_profiles collection
 * @param userId - Appwrite user ID
 * @returns User role ('student' | 'educator') or null if not found
 */
export async function getUserRole(userId: string): Promise<string | null> {
    try {
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';

        const response = await databases.getDocument(dbId, 'user_profiles', userId);

        return response.role as string;
    } catch (err) {
        console.error('Failed to get user role:', err);
        return null;
    }
}

/**
 * Upsert user profile (create or update)
 * @param userId - Appwrite user ID
 * @param data - Profile data to upsert
 */
export async function upsertUserProfile(
    userId: string,
    data: {
        role?: string;
        educatorCodeId?: string;
        email?: string;
    }
): Promise<void> {
    try {
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';

        // Try to get existing profile
        try {
            await databases.getDocument(dbId, 'user_profiles', userId);

            // Profile exists, update it
            await databases.updateDocument(dbId, 'user_profiles', userId, data);
        } catch (err: any) {
            // Profile doesn't exist, create it
            if (err.code === 404) {
                await databases.createDocument(dbId, 'user_profiles', userId, {
                    userId,
                    role: data.role || 'student',
                    educatorCodeId: data.educatorCodeId || null,
                    email: data.email || null,
                    createdAt: Math.floor(Date.now() / 1000),
                });
            } else {
                throw err;
            }
        }
    } catch (err) {
        console.error('Failed to upsert user profile:', err);
        throw err;
    }
}

export { databases };
