import { buildQuery, supabaseRequest } from './supabaseClient.js';
import { hashPassword, verifyPassword } from './password.js';

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

async function checkUserExists({ username, email }) {
  const filters = [];
  if (username) filters.push(`username.eq.${username}`);
  if (email) filters.push(`email.eq.${email}`);
  if (!filters.length) return [];
  const query = buildQuery({ select: 'id,username,email', or: `(${filters.join(',')})` });
  return supabaseRequest(`/users${query}`);
}

async function registerUser(payload) {
  const { username, email, password, allergies = [], ingredients = [] } = payload;
  if (!username || !email || !password) {
    const error = new Error('username, email, and password are required');
    error.status = 400;
    throw error;
  }

  const existing = await checkUserExists({ username, email });
  if (existing.length > 0) {
    const error = new Error('Username or email already in use');
    error.status = 409;
    throw error;
  }

  const password_hash = hashPassword(password);
  const insertBody = [{ username, email, password_hash, allergies, ingredients }];
  const data = await supabaseRequest('/users', {
    method: 'POST',
    body: insertBody,
    prefer: 'return=representation',
  });

  return sanitizeUser(data[0]);
}

async function loginUser({ email, password }) {
  if (!email || !password) {
    const error = new Error('email and password are required');
    error.status = 400;
    throw error;
  }

  const query = buildQuery({ select: 'id,username,email,password_hash,allergies,ingredients,created_at', email: `eq.${email}` });
  const users = await supabaseRequest(`/users${query}`);
  const user = users[0];
  if (!user || !verifyPassword(user.password_hash, password)) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  return sanitizeUser(user);
}

export { registerUser, loginUser, checkUserExists };
