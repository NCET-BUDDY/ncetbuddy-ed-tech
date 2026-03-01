import { NextResponse } from 'next/server';
import { storage, BANNER_BUCKET_ID } from '@/lib/server/appwrite-admin';
import { ID, Permission, Role, InputFile } from 'node-appwrite';

// Helper to ensure bucket exists
async function ensureBannerBucket() {
    try {
        await storage.getBucket(BANNER_BUCKET_ID);
    } catch (error: any) {
        if (error.code === 404) {
            console.log("Creating banners bucket...");
            await storage.createBucket(
                BANNER_BUCKET_ID,
                'Banners',
                [
                    Permission.read(Role.any()),
                    Permission.create(Role.any()),
                    Permission.update(Role.any()),
                    Permission.delete(Role.any()),
                ],
                false, // fileSecurity
                true, // enabled
                10 * 1024 * 1024, // maximumFileSize (10MB)
                ['jpg', 'jpeg', 'png', 'gif', 'webp'] // allowedFileExtensions
            );
        }
    }
}

export async function POST(request: Request) {
    try {
        await ensureBannerBucket();

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Convert File to Buffer for node-appwrite
        const buffer = Buffer.from(await file.arrayBuffer());
        const inputFile = InputFile.fromBuffer(buffer, file.name);

        const response = await storage.createFile(
            BANNER_BUCKET_ID,
            ID.unique(),
            inputFile
        );

        // Construct the view URL
        const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
        const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID_STUDENT!;
        const fileUrl = `${endpoint}/storage/buckets/${BANNER_BUCKET_ID}/files/${response.$id}/view?project=${projectId}`;

        return NextResponse.json({
            id: response.$id,
            url: fileUrl
        });
    } catch (error: any) {
        console.error("API Error (Banners Upload):", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
