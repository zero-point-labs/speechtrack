# Cloudflare R2 CORS Setup Instructions

## Why CORS Setup is Needed

Your large file uploads are failing because browsers block direct uploads to Cloudflare R2 unless the bucket is configured to allow cross-origin requests (CORS).

## Manual CORS Setup via Cloudflare Dashboard

### Step 1: Access R2 Dashboard
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2 Object Storage**
3. Click on your bucket (the one specified in `CLOUDFLARE_R2_BUCKET_NAME`)

### Step 2: Configure CORS
1. Click on the **Settings** tab
2. Scroll down to **CORS policy** section
3. Click **Add CORS policy** or **Edit** if one exists

### Step 3: Add CORS Rules
Add the following CORS configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://speechtrack.vercel.app",
      "https://*.vercel.app"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 86400
  }
]
```

### Step 4: Save Configuration
1. Click **Save** or **Update CORS policy**
2. Wait a few minutes for the changes to propagate

## Alternative: Wrangler CLI Method

If you have Wrangler CLI installed and configured:

```bash
# Install Wrangler if not already installed
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create a cors.json file
cat > cors.json << 'EOF'
[
  {
    "AllowedOrigins": [
      "http://localhost:3000", 
      "https://speechtrack.vercel.app",
      "https://*.vercel.app"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 86400
  }
]
EOF

# Apply CORS configuration to your R2 bucket
wrangler r2 bucket cors put YOUR_BUCKET_NAME --rules ./cors.json
```

## Verification

After setting up CORS, you can verify it's working by:

1. **Check the browser console** - CORS errors should disappear
2. **Try uploading a large file** (> 4MB) - should work without "Failed to fetch" errors
3. **Monitor the terminal** - you should see successful direct upload logs

## What Each Setting Means

- **AllowedOrigins**: Domains allowed to make requests to R2
  - `http://localhost:3000` - Your local development server
  - `https://speechtrack.vercel.app` - Your production domain
  - `https://*.vercel.app` - All Vercel preview deployments

- **AllowedMethods**: HTTP methods permitted for cross-origin requests
  - `PUT` - Required for direct file uploads
  - `GET` - For file downloads/views
  - `POST`, `DELETE`, `HEAD` - Additional operations

- **AllowedHeaders**: Request headers browsers can send
  - `*` - Allows all headers (including Content-Type, Authorization, etc.)

- **ExposeHeaders**: Response headers accessible to browser JavaScript
  - `ETag` - Useful for file integrity checking

- **MaxAgeSeconds**: How long browsers cache CORS preflight responses (24 hours)

## Troubleshooting

### If CORS Still Doesn't Work:
1. **Clear browser cache** and try again
2. **Check the exact domain** in browser developer tools
3. **Verify bucket name** matches your environment variable
4. **Wait 5-10 minutes** for CORS changes to propagate globally
5. **Check browser console** for specific CORS error messages

### Common Issues:
- **Wildcard domains**: Some browsers are strict about `*.vercel.app` - you might need to add specific preview URLs
- **Case sensitivity**: Ensure bucket name case matches exactly
- **Protocol mismatch**: Make sure you include both `http://` (dev) and `https://` (production) origins

## Testing After Setup

Once CORS is configured, test large file uploads:

1. Go to your session edit page
2. Try uploading a PDF > 4MB
3. Check console logs - you should see:
   ```
   📤 Large file detected (X MB): filename.pdf - Using direct upload method
   ✅ Direct upload to R2 successful: filename.pdf
   ✅ Large file upload finalized: filename.pdf
   ```

The "Failed to fetch" error should be resolved and large files should upload successfully!
