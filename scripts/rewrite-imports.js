const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let modifiedCount = 0;

walkDir('./src', function(filePath) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
    
    // Read file
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace
    content = content.replace(/@\/lib\/appwrite-db/g, '@/lib/pocketbase-db');
    content = content.replace(/@\/lib\/appwrite-cache/g, '@/lib/pocketbase-cache');
    content = content.replace(/@\/lib\/appwrite-student/g, '@/lib/pocketbase');
    
    // We also might have relative imports like `../lib/appwrite-db` or similar, depending on Next.js usage
    content = content.replace(/\.\.\/lib\/appwrite-db/g, '../lib/pocketbase-db');
    content = content.replace(/\.\.\/lib\/appwrite-cache/g, '../lib/pocketbase-cache');
    content = content.replace(/\.\.\/lib\/appwrite-student/g, '../lib/pocketbase');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated imports in: ${filePath}`);
        modifiedCount++;
    }
});

console.log(`\nImport rewrite complete! Modified ${modifiedCount} files.`);
