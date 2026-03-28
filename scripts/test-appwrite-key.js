const { Client, Users, Databases, Storage } = require('node-appwrite');

const projectId = process.argv[2];
const apiKey = process.argv[3];

if (!projectId || !apiKey) {
  console.log('Usage: node test-appwrite-key.js <OLD_PROJECT_ID> <API_KEY>');
  process.exit(1);
}

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(projectId)
    .setKey(apiKey);

async function testPermissions() {
    console.log(`\nTesting API Key permissions for Project: ${projectId}`);
    
    // Test 1: Users
    try {
        const users = new Users(client);
        await users.list();
        console.log('✅ Users read access: OK');
    } catch (e) {
        console.log(`❌ Users read access failed: ${e.message}`);
    }

    // Test 2: Databases
    try {
        const databases = new Databases(client);
        await databases.list();
        console.log('✅ Databases read access: OK');
    } catch (e) {
        console.log(`❌ Databases read access failed: ${e.message}`);
    }

    // Test 3: Storage
    try {
        const storage = new Storage(client);
        await storage.listBuckets();
        console.log('✅ Storage read access: OK');
    } catch (e) {
        console.log(`❌ Storage read access failed: ${e.message}`);
    }
    
    console.log('\nIf any of the above failed, your API key is missing scopes!');
    console.log('You need to go to your OLD project -> Settings -> API Keys -> Edit the key -> Click "Target All" or manually check ALL "read" scopes.\n');
}

testPermissions();
