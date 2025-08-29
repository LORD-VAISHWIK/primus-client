// JWT Utility Functions for React
// Add this to a new file: utils/jwt.js

// Function to decode JWT token and extract user information
export const parseJwt = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
};

// Function to get user info from stored token
export const getUserFromToken = () => {
  const token = localStorage.getItem("primus_jwt");
  if (!token || token === "dummy_token_for_demo") {
    return null;
  }
  
  const decoded = parseJwt(token);
  if (!decoded) return null;
  const id = decoded.sub || decoded.id || decoded.user_id || null;
  const username = decoded.name || decoded.username || decoded.email || 'User';
  const email = decoded.email || '';
  const role = decoded.role || 'client';
  return { id, username, email, role };
};

// Function to check if token is valid and not expired
export const isTokenValid = (skewSeconds = 300) => {
  const token = localStorage.getItem("primus_jwt");
  if (!token || token === "dummy_token_for_demo") {
    return false;
  }
  
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) {
    return false;
  }
  
  // Check if token is expired
  const currentTime = Date.now() / 1000;
  return decoded.exp + skewSeconds > currentTime;
};