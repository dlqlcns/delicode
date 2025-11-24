import { buildQuery, supabaseRequest } from './supabaseClient.js';
import { hashPassword, verifyPassword } from './password.js';

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return {
    ...safe,
    allergies: Array.isArray(safe.allergies) ? safe.allergies : [],
    ingredients: Array.isArray(safe.ingredients) ? safe.ingredients : [],
  };
}

async function checkUserExists({ username, email, excludeId }) {
  const filters = [];
  if (username) filters.push(`username.ilike.${username}`);
  if (email) filters.push(`email.ilike.${email}`);
  if (!filters.length) return [];

  const query = buildQuery({
    select: 'id,username,email',
    or: `(${filters.join(',')})`,
    id: excludeId ? `neq.${excludeId}` : undefined,
    limit: 1,
  });

  const rows = await supabaseRequest(`/users${query}`);
  return rows;
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
  const insertBody = [{
    username,
    email,
    password_hash,
    allergies: Array.isArray(allergies) ? allergies : [],
    ingredients: Array.isArray(ingredients) ? ingredients : [],
  }];
  const data = await supabaseRequest('/users', {
    method: 'POST',
    body: insertBody,
    prefer: 'return=representation',
  });

  return sanitizeUser(data[0]);
}

async function loginUser({ identifier, password }) {
  if (!identifier || !password) {
    const error = new Error('email/username and password are required');
    error.status = 400;
    throw error;
  }

  const query = buildQuery({
    select: 'id,username,email,password_hash,allergies,ingredients,created_at',
    or: `(email.eq.${identifier},username.eq.${identifier})`,
  });
  const users = await supabaseRequest(`/users${query}`);
  const user = users[0];
  if (!user || !verifyPassword(user.password_hash, password)) {
    const error = new Error('등록되지 않은 아이디이거나 아이디 또는 비밀번호를 잘못 입력했습니다.');
    error.status = 401;
    throw error;
  }

  return sanitizeUser(user);
}

async function getUser(id) {
  if (!id) return null;
  const query = buildQuery({
    select: 'id,username,email,allergies,ingredients,created_at',
    id: `eq.${id}`,
  });
  const rows = await supabaseRequest(`/users${query}`);
  return sanitizeUser(rows[0]);
}

async function updateUser(id, payload) {
  if (!id) {
    const error = new Error('user id is required');
    error.status = 400;
    throw error;
  }

  const allowedFields = ['username', 'email', 'allergies', 'ingredients'];
  const updates = {};
  allowedFields.forEach(field => {
    if (payload[field] !== undefined) {
      if (field === 'allergies' || field === 'ingredients') {
        updates[field] = Array.isArray(payload[field]) ? payload[field] : [];
      } else {
        updates[field] = payload[field];
      }
    }
  });

  if (updates.username || updates.email) {
    const conflicts = await checkUserExists({
      username: updates.username,
      email: updates.email,
      excludeId: id,
    });
    if (conflicts.length > 0) {
      const error = new Error('Username or email already in use');
      error.status = 409;
      throw error;
    }
  }

  if (Object.keys(updates).length === 0) {
    const error = new Error('No updatable fields provided');
    error.status = 400;
    throw error;
  }

  const query = buildQuery({ id: `eq.${id}` });
  const data = await supabaseRequest(`/users${query}`, {
    method: 'PATCH',
    body: updates,
    prefer: 'return=representation',
  });

  return sanitizeUser(data[0]);
}

async function upsertSocialUser(payload) {
  const { id, username, email, allergies = [], ingredients = [] } = payload;

  if (!id || !username || !email) {
    const error = new Error('id, username, and email are required');
    error.status = 400;
    throw error;
  }

  const insertBody = [
    {
      id,
      username,
      email,
      allergies: Array.isArray(allergies) ? allergies : [],
      ingredients: Array.isArray(ingredients) ? ingredients : [],
    },
  ];

  const query = buildQuery({ on_conflict: 'id' });
  const data = await supabaseRequest(`/users${query}`, {
    method: 'POST',
    body: insertBody,
    prefer: 'return=representation,resolution=merge-duplicates',
  });

  return sanitizeUser(data[0]);
}

export { registerUser, loginUser, checkUserExists, getUser, updateUser, upsertSocialUser };
