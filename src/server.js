import http from 'node:http';
import { URL } from 'node:url';
import path from 'node:path';
import { sendJson, sendError, parseJsonBody, serveStatic, setCorsHeaders } from './httpUtils.js';
import { getRecipes, getRecipeDetail } from './recipesApi.js';
import { registerUser, loginUser, checkUserExists } from './usersApi.js';

const PORT = process.env.PORT || 3000;
const publicDir = path.join(process.cwd(), 'public');

function notFound(res) {
  sendError(res, 404, 'Not Found');
}

async function handleRecipes(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/recipes') {
    const search = url.searchParams.get('search') || '';
    const category = url.searchParams.get('category') || '';
    const limit = url.searchParams.get('limit') || '';
    const ingredientsParam = url.searchParams.get('ingredients') || '';
    const ingredients = ingredientsParam
      .split(',')
      .map(term => term.trim())
      .filter(Boolean);

    try {
      const recipes = await getRecipes({ search, category, ingredients, limit });
      return sendJson(res, 200, { recipes });
    } catch (err) {
      const status = err.status || 500;
      return sendError(res, status, err.message || 'Failed to fetch recipes');
    }
  }

  const detailMatch = url.pathname.match(/^\/api\/recipes\/([^/]+)$/);
  if (req.method === 'GET' && detailMatch) {
    const id = decodeURIComponent(detailMatch[1]);
    try {
      const recipe = await getRecipeDetail(id);
      if (!recipe) return notFound(res);
      return sendJson(res, 200, { recipe });
    } catch (err) {
      const status = err.status || 500;
      return sendError(res, status, err.message || 'Failed to fetch recipe');
    }
  }

  return notFound(res);
}

async function handleUsers(req, res, url) {
  if (req.method === 'POST' && url.pathname === '/api/users/register') {
    try {
      const body = await parseJsonBody(req);
      const user = await registerUser(body);
      return sendJson(res, 201, { user });
    } catch (err) {
      const status = err.status || 500;
      return sendError(res, status, err.message || 'Failed to register user');
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/users/login') {
    try {
      const body = await parseJsonBody(req);
      const user = await loginUser(body);
      return sendJson(res, 200, { user });
    } catch (err) {
      const status = err.status || 500;
      return sendError(res, status, err.message || 'Failed to log in');
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/users/check') {
    const username = url.searchParams.get('username') || '';
    const email = url.searchParams.get('email') || '';
    try {
      const matches = await checkUserExists({ username, email });
      return sendJson(res, 200, { available: matches.length === 0 });
    } catch (err) {
      const status = err.status || 500;
      return sendError(res, status, err.message || 'Failed to check availability');
    }
  }

  return notFound(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname.startsWith('/api/recipes')) {
    return handleRecipes(req, res, url);
  }

  if (url.pathname.startsWith('/api/users')) {
    return handleUsers(req, res, url);
  }

  return serveStatic(publicDir, req, res, url.pathname);
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
