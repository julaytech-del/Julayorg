#!/usr/bin/env bash
# MongoDB backup — runs mongodump, compresses, uploads to S3, prunes local copies older than 7 days
set -euo pipefail

DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="/tmp/mongo-backups"
DUMP_PATH="$BACKUP_DIR/julay-$DATE"
ARCHIVE="$DUMP_PATH.tar.gz"

MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/julayorg}"
S3_BUCKET="${S3_BACKUP_BUCKET:-}"   # e.g. "julay-backups"
S3_PREFIX="${S3_BACKUP_PREFIX:-mongo}"

mkdir -p "$BACKUP_DIR"

echo "[backup] dumping $MONGO_URI → $DUMP_PATH"
mongodump --uri="$MONGO_URI" --out="$DUMP_PATH" --quiet

echo "[backup] compressing → $ARCHIVE"
tar -czf "$ARCHIVE" -C "$BACKUP_DIR" "julay-$DATE"
rm -rf "$DUMP_PATH"

echo "[backup] archive size: $(du -sh "$ARCHIVE" | cut -f1)"

if [[ -n "$S3_BUCKET" ]]; then
  S3_KEY="$S3_PREFIX/julay-$DATE.tar.gz"
  echo "[backup] uploading to s3://$S3_BUCKET/$S3_KEY"
  aws s3 cp "$ARCHIVE" "s3://$S3_BUCKET/$S3_KEY" --storage-class STANDARD_IA
  echo "[backup] upload complete"
else
  echo "[backup] S3_BACKUP_BUCKET not set — skipping upload, keeping local archive"
fi

echo "[backup] pruning local backups older than 7 days"
find "$BACKUP_DIR" -name "julay-*.tar.gz" -mtime +7 -delete

echo "[backup] done — $ARCHIVE"
