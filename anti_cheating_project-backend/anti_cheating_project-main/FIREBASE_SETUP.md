# Firebase Authentication Setup Guide

This project now includes Firebase authentication with Login and Sign Up functionality.

## Step 1: Set Up Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use an existing one
3. Enable Email/Password authentication:
   - Go to **Authentication** > **Sign-in method**
   - Enable **Email/Password**
4. Copy your Firebase configuration credentials

## Step 2: Configure Environment Variables

1. Create a `.env.local` file in the project root (or copy from `.env.example`)
2. Add your Firebase credentials:

```
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

3. Add MongoDB connection details for the backend:

```
MONGO_URI=mongodb://127.0.0.1:27017
MONGO_DB_NAME=proctorAi
```

If you use MongoDB Atlas, set `MONGO_URI` to your Atlas connection string instead.

## Step 3: Run the Project

```bash
# Start the backend server
npm.cmd run server

# In another terminal, start the frontend
npm.cmd run dev
```

## Features

- **Login**: Existing users can sign in with email and password
- **Sign Up**: New users can create an account with name, email, and password
- **Role Selection**: Choose between Student and Instructor roles
- **Firebase Auth**: Secure authentication powered by Firebase

## File Structure

- `src/firebase.js` - Firebase configuration and auth functions
- `src/pages/AuthPage.jsx` - Login and Sign Up UI with tabs
- `.env.local` - Your Firebase credentials (not committed to git)

## Testing Credentials

You can create test accounts directly through the Firebase Console or by signing up through the UI.
