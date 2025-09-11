# Primus Client Deployment Guide

## Overview
This guide explains how to deploy the Primus client application to `primustech.in` to enable user registration and login using the existing authentication UI.

## Prerequisites
- Node.js 18+ installed
- Access to deploy to primustech.in
- Backend API running at primusadmin.in

## Quick Setup

### 1. Build the Application
```bash
cd Primus/primus-client
chmod +x build.sh
./build.sh
```

Or manually:
```bash
npm install
npm run build
```

### 2. Deploy to primustech.in
Upload the contents of the `dist` directory to your web server at `primustech.in`.

### 3. Configure Web Server
Ensure your web server is configured to:
- Serve static files from the root directory
- Handle client-side routing (SPA)
- Serve `index.html` for all routes

### Apache Configuration Example
```apache
<VirtualHost *:80>
    ServerName primustech.in
    DocumentRoot /path/to/dist
    
    <Directory /path/to/dist>
        AllowOverride All
        Require all granted
    </Directory>
    
    # Handle client-side routing
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ /index.html [L]
</VirtualHost>
```

### Nginx Configuration Example
```nginx
server {
    listen 80;
    server_name primustech.in;
    root /path/to/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Features Available

### User Registration
- **Manual Registration**: Name, email, password with "client" role
- **Social Registration**: Google OAuth integration
- **Form Validation**: Client-side and server-side validation
- **Terms of Service**: Checkbox for TOS acceptance

### User Login
- **Email/Username Login**: Traditional email/password authentication
- **Google OAuth**: One-tap and popup Google sign-in
- **Password Recovery**: Forgot password functionality
- **JWT Tokens**: Secure token-based authentication

### Cross-Domain Authentication
- Client at primustech.in communicates with backend at primusadmin.in
- CORS is configured to allow cross-domain requests
- Secure JWT-based authentication

## Testing

### 1. Test Registration
1. Visit primustech.in
2. Click "Create account"
3. Choose "Register manually" or "Continue with Google"
4. Fill in the registration form
5. Verify account is created successfully

### 2. Test Login
1. Use the credentials from registration
2. Click "Log in"
3. Verify successful login and redirect to dashboard

### 3. Test Social Login
1. Click "Continue with Google"
2. Complete Google OAuth flow
3. Verify successful login

### 4. Test API Connection
1. Open browser developer tools
2. Check Network tab for API calls to primusadmin.in
3. Verify successful responses

## Authentication Flow

### Manual Registration
1. User fills out registration form
2. Form submits to `/api/auth/register` at primusadmin.in
3. Account created with "client" role
4. User redirected to login

### Manual Login
1. User enters email/username and password
2. Form submits to `/api/auth/login` at primusadmin.in
3. JWT token received and stored in localStorage
4. User redirected to dashboard

### Google OAuth
1. User clicks Google sign-in button
2. Google OAuth popup opens
3. User authenticates with Google
4. ID token sent to `/api/social/google/idtoken` at primusadmin.in
5. JWT token received and stored
6. User redirected to dashboard

## Troubleshooting

### CORS Issues
If you see CORS errors:
1. Verify backend CORS configuration allows primustech.in
2. Check that API calls are going to the correct domain
3. Ensure HTTPS is used for both domains

### Authentication Issues
If login/registration fails:
1. Check browser console for error messages
2. Verify backend API is running at primusadmin.in
3. Check network connectivity between domains
4. Verify Google OAuth configuration (if using social login)

### Build Issues
If build fails:
1. Ensure Node.js version is 18+
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Check for any missing dependencies

### UI Issues
If the UI doesn't look right:
1. Check that all CSS files are loading
2. Verify Tailwind CSS is properly configured
3. Check browser console for JavaScript errors

## Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **CORS**: Backend should only allow specific domains
3. **JWT Storage**: Tokens are stored in localStorage (consider httpOnly cookies for enhanced security)
4. **Input Validation**: Backend validates all inputs
5. **Rate Limiting**: Consider implementing rate limiting on auth endpoints
6. **Google OAuth**: Ensure Google Client ID is properly configured

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify network connectivity
3. Test API endpoints directly
4. Review backend logs for server-side issues
5. Check Google Cloud Console for OAuth configuration
