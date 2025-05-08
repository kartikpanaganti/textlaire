# Server Scripts

This directory contains utility scripts for server maintenance and data migration.

## Attachment Migration Script

The `migrateAttachments.js` script is used to migrate chat attachments from the old location (`uploads/chat/`) to the new location (`uploads/chat/attachment/`).

### How to Run the Migration

1. Make sure your MongoDB connection details are correct in your `.env` file
2. Navigate to the server directory:
   ```
   cd server
   ```
3. Run the script using Node.js:
   ```
   node scripts/migrateAttachments.js
   ```

The script will:
1. Connect to your MongoDB database
2. Find all messages that have attachments
3. For each attachment with the old path format, it will:
   - Copy the file to the new location
   - Update the file path in the database
4. Report progress and display any errors

### Verifying Migration

After running the migration, you can check that:
- Files have been copied to the new `uploads/chat/attachment/` directory
- The database entries have been updated with the new paths

New file uploads will automatically go to the new location. 