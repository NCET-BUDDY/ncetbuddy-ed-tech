import { NextResponse } from 'next/server';
import { databases, DB_ID } from '@/lib/server/appwrite-admin';

export async function POST() {
    try {
        // Try to create the phoneNumber attribute in the users collection
        const result = await (databases as any).createStringAttribute(
            DB_ID,
            'users',
            'phoneNumber',
            20,       // size
            false,    // required
            null,     // default
            false     // array
        );
        
        return NextResponse.json({ success: true, message: 'phoneNumber attribute created in users collection', result });
    } catch (error: any) {
        if (error.code === 409) {
            return NextResponse.json({ success: true, message: 'phoneNumber attribute already exists' });
        }
        return NextResponse.json({ success: false, error: error.message || 'Unknown error', code: error.code }, { status: 500 });
    }
}
