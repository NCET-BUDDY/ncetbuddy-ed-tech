#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# PocketBase Daily Backup Script
# Backs up pb_data (SQLite DB + uploaded files) and syncs to Google Drive
# ═══════════════════════════════════════════════════════════════
# 
# Setup:
#   1. chmod +x /root/backup_pb.sh
#   2. crontab -e
#      Add: 0 2 * * * /root/backup_pb.sh >> /var/log/pb_backup.log 2>&1
#   3. Ensure rclone is configured with a remote named 'gdrive'
#      Run: rclone config (follow prompts for Google Drive)
#
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────
PB_DATA_DIR="/root/pb/pb_data"
LOCAL_BACKUP_DIR="/root/backups"
RCLONE_REMOTE="gdrive"
RCLONE_PATH="NCETBuddy_Backups"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="pb_backup_${TIMESTAMP}.tar.gz"

# ── Pre-flight Checks ────────────────────────────────────────
echo "=== PocketBase Backup Started: $(date) ==="

if [ ! -d "$PB_DATA_DIR" ]; then
    echo "ERROR: PocketBase data directory not found: $PB_DATA_DIR"
    exit 1
fi

mkdir -p "$LOCAL_BACKUP_DIR"

# ── Step 1: Create compressed backup ─────────────────────────
# Using tar+gzip for efficient compression of both SQLite DB and storage files
echo "Creating backup archive..."
tar -czf "${LOCAL_BACKUP_DIR}/${BACKUP_FILE}" \
    -C "$(dirname "$PB_DATA_DIR")" \
    "$(basename "$PB_DATA_DIR")" \
    --exclude='*.tmp' \
    --exclude='*.wal'  # Exclude WAL file to avoid partial writes

BACKUP_SIZE=$(du -sh "${LOCAL_BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
echo "Backup created: ${BACKUP_FILE} (${BACKUP_SIZE})"

# ── Step 2: Sync to Google Drive ─────────────────────────────
echo "Syncing to Google Drive (${RCLONE_REMOTE}:${RCLONE_PATH})..."

if command -v rclone &> /dev/null; then
    rclone copy "${LOCAL_BACKUP_DIR}/${BACKUP_FILE}" "${RCLONE_REMOTE}:${RCLONE_PATH}/" \
        --progress \
        --transfers=1 \
        --retries=3 \
        --low-level-retries=5

    echo "✅ Synced to Google Drive successfully."
else
    echo "WARNING: rclone not installed. Backup stored locally only."
    echo "Install rclone: curl https://rclone.org/install.sh | sudo bash"
fi

# ── Step 3: Rotate old backups (keep last N days) ─────────────
echo "Rotating backups older than ${RETENTION_DAYS} days..."
DELETED_COUNT=$(find "$LOCAL_BACKUP_DIR" -name "pb_backup_*" -type f -mtime +${RETENTION_DAYS} | wc -l)
find "$LOCAL_BACKUP_DIR" -name "pb_backup_*" -type f -mtime +${RETENTION_DAYS} -delete
echo "Deleted ${DELETED_COUNT} old local backup(s)."

# Optionally clean remote backups too
if command -v rclone &> /dev/null; then
    rclone delete "${RCLONE_REMOTE}:${RCLONE_PATH}/" \
        --min-age="${RETENTION_DAYS}d" \
        --include="pb_backup_*" 2>/dev/null || true
    echo "Remote backup rotation complete."
fi

# ── Summary ──────────────────────────────────────────────────
echo "=== Backup Complete: $(date) ==="
echo "  File: ${BACKUP_FILE}"
echo "  Size: ${BACKUP_SIZE}"
echo "  Local: ${LOCAL_BACKUP_DIR}/${BACKUP_FILE}"
echo "  Remote: ${RCLONE_REMOTE}:${RCLONE_PATH}/${BACKUP_FILE}"
