# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the McqQuiz application.

## Prerequisites

- A Google Cloud Console account
- Node.js and npm installed
- The application installed with all dependencies

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add the following to "Authorized JavaScript origins":
     - `http://localhost:3000` (for development)
     - `http://localhost:3001` (alternative port)
     - Your production URL (e.g., `https://yourdomain.com`)
   - Add the following to "Authorized redirect URIs":
     - `http://localhost:5001/api/auth/google/callback`
     - Your production API URL (e.g., `https://api.yourdomain.com/api/auth/google/callback`)
   - Click "Create"
   - Copy the "Client ID" and "Client Secret"

## Step 2: Configure Backend Environment Variables

1. Navigate to the backend directory:
   ```bash
   cd mcq-quiz/backend
   ```

2. Create or update your `.env` file:
   ```env
   # MongoDB Connection
   MONGODB_URI=your_mongodb_connection_string

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   SESSION_SECRET=your_session_secret_key_here

   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback

   # Server Configuration
   PORT=5001
   NODE_ENV=development
   ```

3. Replace:
   - `your_mongodb_connection_string` with your MongoDB connection string
   - `your_jwt_secret_key_here` with a secure random string (at least 32 characters)
   - `your_session_secret_key_here` with another secure random string
   - `your_google_client_id_here` with the Client ID from Step 1
   - `your_google_client_secret_here` with the Client Secret from Step 1

## Step 3: Configure Frontend Environment Variables

1. Navigate to the frontend directory:
   ```bash
   cd mcq-quiz/frontend
   ```

2. Create or update your `.env` file:
   ```env
   # Google OAuth Configuration
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here

   # API Configuration
   REACT_APP_API_BASE_URL=http://localhost:5001/api
   ```

3. Replace `your_google_client_id_here` with the Client ID from Step 1

## Step 4: Test the Setup

1. Start the backend server:
   ```bash
   cd mcq-quiz/backend
   npm run dev
   ```

2. In a new terminal, start the frontend:
   ```bash
   cd mcq-quiz/frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`
4. Click on the "Sign in with Google" button on the login page
5. Select your Google account
6. You should be redirected to the role selection page
7. Choose your role (Teacher or Student)
8. You should be redirected to your dashboard

## Features

### For Users
- **Fast Login**: One-click authentication with Google account
- **No Password Management**: No need to remember another password
- **Profile Auto-Fill**: Name and email are automatically filled from Google profile
- **Role Selection**: First-time users select their role (Teacher/Student)
- **Secure**: Uses industry-standard OAuth 2.0 protocol

### Technical Details
- Uses `@react-oauth/google` for frontend integration
- Uses `google-auth-library` for backend token verification
- Stores Google ID to link accounts
- Supports both traditional email/password and Google login
- Seamless role-based routing after authentication

## Troubleshooting

### "Invalid Client" Error
- Check that your Google Client ID is correctly set in both backend and frontend `.env` files
- Ensure the Client ID matches the one in Google Cloud Console

### "Unauthorized" Error
- Verify that your authorized JavaScript origins and redirect URIs are correctly configured in Google Cloud Console
- Make sure the URLs match exactly (including http/https and port numbers)

### Role Selection Not Appearing
- Clear your browser cache and cookies
- Check browser console for any errors
- Verify that the backend API is running and accessible

### Google Sign-In Button Not Showing
- Ensure `REACT_APP_GOOGLE_CLIENT_ID` is set in frontend `.env`
- Check that you've restarted the development server after adding environment variables
- Check browser console for any JavaScript errors

## Production Deployment

When deploying to production:

1. Update Google OAuth credentials with production URLs
2. Set production environment variables:
   - Backend: Update `GOOGLE_CALLBACK_URL` to your production API URL
   - Frontend: Update `REACT_APP_GOOGLE_CLIENT_ID` and `REACT_APP_API_BASE_URL`
3. Use HTTPS for all URLs in production
4. Keep your Client Secret secure and never commit it to version control

## Security Considerations

- Never commit `.env` files to version control
- Use strong, unique secrets for JWT_SECRET and SESSION_SECRET
- Always use HTTPS in production
- Regularly rotate your secrets
- Monitor Google Cloud Console for unusual activity

## Support

If you encounter any issues:
1. Check the console logs in both backend and frontend
2. Verify all environment variables are correctly set
3. Ensure all npm packages are installed
4. Check that Google Cloud Console credentials are active

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [React Google OAuth Documentation](https://www.npmjs.com/package/@react-oauth/google)
- [Google Auth Library Documentation](https://www.npmjs.com/package/google-auth-library)
