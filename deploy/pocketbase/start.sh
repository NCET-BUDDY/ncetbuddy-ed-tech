#!/bin/sh

echo "Starting PocketBase Container Setup..."

# Ensure persistent directories exist
mkdir -p /pb_data
mkdir -p /pb_migrations

# Check if data.db exists in the persistent volume. If not, it means this is a fresh setup.
if [ ! -f "/pb_data/data.db" ]; then
    echo "First run detected (no persistent database found). Extracting pre-migrated data..."
    
    # Extract to a temporary directory first
    unzip -o /app/pocketbase-production-data.zip -d /app/temp_data
    
    # Copy the extracted contents to the persistent volume mount paths
    cp -R /app/temp_data/pb_data/* /pb_data/ 2>/dev/null || true
    cp -R /app/temp_data/pb_migrations/* /pb_migrations/ 2>/dev/null || true
    
    # Clean up temporary files
    rm -rf /app/temp_data
    echo "Extraction complete!"
else
    echo "Persistent database found. Skipping extraction to prevent overwriting."
fi

echo "Starting PocketBase..."
# Start PocketBase using the explicitly mounted network volumes
exec /app/pocketbase serve --http=0.0.0.0:8090 --dir=/pb_data --publicDir=/pb_public --migrationsDir=/pb_migrations
