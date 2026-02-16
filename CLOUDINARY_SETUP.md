# Cloudinary Setup Guide for TickIT

## What Changed?
Instead of storing images on the server's file system, they are now uploaded to Cloudinary (a cloud storage service). This ensures images work on Vercel and other serverless platforms.

## Setup Steps

### 1. Create a Free Cloudinary Account
1. Go to https://cloudinary.com
2. Click "Sign Up Free"
3. Fill in your details and complete registration
4. You'll be taken to your dashboard

### 2. Get Your Cloudinary Credentials
1. In the Cloudinary Dashboard, look for "Account Details" section
2. Copy these three values:
   - **Cloud Name** - Found at the top of your dashboard
   - **API Key** - Found in Account Details
   - **API Secret** - Found in Account Details

### 3. Set Up Your .env File
Create a `.env` file in your project root (copy from `.env.example`):

```
MONGO_URL=mongodb+srv://ticketing:pass123@ticketing.l4d0k5r.mongodb.net/
PORT=3000
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**⚠️ IMPORTANT:** Never commit your `.env` file to Git! It's already in `.gitignore`.

### 4. Verify Installation
```bash
npm install cloudinary multer-storage-cloudinary
```

### 5. Test It
1. Start your server: `npm run dev`
2. Try uploading an image in a ticket conversation
3. Check your Cloudinary Dashboard → Media Library to see the uploaded file

## How It Works

**Before (LocalHost only):**
```
Client → Upload → Multer → Save to /public/uploads/messages → Serve locally
```

**After (Works everywhere):**
```
Client → Upload → Multer-Cloudinary → Upload to Cloudinary cloud → Get secure URL → Store in MongoDB
```

## Benefits
✅ Images persist on Vercel
✅ Automatic optimization by Cloudinary
✅ Free tier: 25 GB/month storage
✅ Works offline or online
✅ Automatic backup

## Free Tier Limits
- 25 GB storage
- 25 GB bandwidth/month
- 1 GB API calls/month
- More than enough for a ticketing system!

## Troubleshooting

**Image not showing?**
- Check browser console for errors
- Verify Cloudinary credentials in .env
- Make sure .env file is loaded (restart server)

**Upload fails?**
- Check file size (max 10MB)
- Check file type (images, PDF, Word, TXT allowed)
- Verify Cloudinary credentials are correct

**To upgrade later:**
- Cloudinary offers paid plans with more storage/bandwidth
- Simply update your credentials in .env file
