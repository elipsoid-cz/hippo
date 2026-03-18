// Hippo Admin API — Cloudflare Worker
// Proxies GitHub & Gemini API calls so tokens never reach the browser.
//
// Security layers:
// 1. Login rate limiting (KV) — 5 attempts per 15 min per IP
// 2. JWT auth (HMAC-SHA256) — 2h expiry, required for all protected routes
// 3. GitHub proxy scoping — only elipsoid-cz/hippo repo allowed
// 4. Gemini daily rate limit (KV) — max N calls per day (configurable)
// 5. Origin/custom header check — blocks raw curl without headers

const ALLOWED_ORIGINS = [
  'https://elipsoid-cz.github.io',
];

const JWT_EXPIRY = 7200; // 2 hours

// Rate limits
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_SEC = 900; // 15 minutes
const GEMINI_DAILY_LIMIT = 10;

// GitHub proxy — only these path prefixes are allowed
const ALLOWED_REPO = 'elipsoid-cz/hippo';
const GITHUB_PATH_PREFIXES = [
  `/repos/${ALLOWED_REPO}/contents/`,
  `/repos/${ALLOWED_REPO}/git/`,
  `/repos/${ALLOWED_REPO}/actions/workflows/generate-cover.yml/dispatches`,
  `/repos/${ALLOWED_REPO}/actions/workflows/generate-cover.yml/runs`,
  `/repos/${ALLOWED_REPO}/actions/runs/`,
];

// ── Helpers ──────────────────────────────────────────────

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return true;
  return false;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Hippo-Client',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data, status = 200, origin = '') {
  const headers = { 'Content-Type': 'application/json', ...corsHeaders(origin) };
  return new Response(JSON.stringify(data), { status, headers });
}

function errorResponse(message, status = 400, origin = '') {
  return jsonResponse({ error: message }, status, origin);
}

function getClientIP(request) {
  return request.headers.get('CF-Connecting-IP')
    || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    || 'unknown';
}

function todayKey() {
  return new Date().toISOString().slice(0, 10); // "2026-03-18"
}

// ── JWT (HMAC-SHA256) ────────────────────────────────────

function base64url(buf) {
  const str = btoa(String.fromCharCode(...new Uint8Array(buf)));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - str.length % 4) % 4);
  const binary = atob(padded);
  return new Uint8Array([...binary].map(c => c.charCodeAt(0)));
}

async function getJwtKey(secret) {
  const enc = new TextEncoder().encode(secret);
  return crypto.subtle.importKey('raw', enc, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function createJwt(secret) {
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payload = base64url(new TextEncoder().encode(JSON.stringify({
    sub: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY,
  })));
  const key = await getJwtKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${payload}`));
  return `${header}.${payload}.${base64url(sig)}`;
}

async function verifyJwt(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, sig] = parts;
  const key = await getJwtKey(secret);
  const valid = await crypto.subtle.verify(
    'HMAC', key,
    base64urlDecode(sig),
    new TextEncoder().encode(`${header}.${payload}`)
  );
  if (!valid) return null;

  const data = JSON.parse(new TextDecoder().decode(base64urlDecode(payload)));
  if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
  return data;
}

// ── SHA-256 hex ──────────────────────────────────────────

async function sha256hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Rate limiting (KV-based) ─────────────────────────────

async function checkLoginRateLimit(env, ip) {
  const key = `login:${ip}`;
  const data = await env.RATE_LIMIT.get(key, 'json').catch(() => null);
  if (!data) return { allowed: true, remaining: LOGIN_MAX_ATTEMPTS - 1 };

  if (data.count >= LOGIN_MAX_ATTEMPTS) {
    const elapsed = Math.floor(Date.now() / 1000) - data.first;
    if (elapsed < LOGIN_WINDOW_SEC) {
      const retryAfter = LOGIN_WINDOW_SEC - elapsed;
      return { allowed: false, retryAfter };
    }
    // Window expired — reset
    return { allowed: true, remaining: LOGIN_MAX_ATTEMPTS - 1, reset: true };
  }

  return { allowed: true, remaining: LOGIN_MAX_ATTEMPTS - data.count - 1 };
}

async function recordLoginAttempt(env, ip, success) {
  const key = `login:${ip}`;

  if (success) {
    // Clear on success
    await env.RATE_LIMIT.delete(key);
    return;
  }

  const data = await env.RATE_LIMIT.get(key, 'json').catch(() => null);
  const now = Math.floor(Date.now() / 1000);

  if (!data || (now - data.first) >= LOGIN_WINDOW_SEC) {
    // New window
    await env.RATE_LIMIT.put(key, JSON.stringify({ count: 1, first: now }), {
      expirationTtl: LOGIN_WINDOW_SEC,
    });
  } else {
    // Increment
    await env.RATE_LIMIT.put(key, JSON.stringify({ count: data.count + 1, first: data.first }), {
      expirationTtl: LOGIN_WINDOW_SEC - (now - data.first),
    });
  }
}

async function checkGeminiDailyLimit(env) {
  const key = `gemini:${todayKey()}`;
  const count = parseInt(await env.RATE_LIMIT.get(key) || '0', 10);
  return { allowed: count < GEMINI_DAILY_LIMIT, count, limit: GEMINI_DAILY_LIMIT };
}

async function incrementGeminiCount(env) {
  const key = `gemini:${todayKey()}`;
  const count = parseInt(await env.RATE_LIMIT.get(key) || '0', 10);
  // TTL = seconds until end of day UTC + 1h buffer
  const now = new Date();
  const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const ttl = Math.ceil((endOfDay - now) / 1000) + 3600;
  await env.RATE_LIMIT.put(key, String(count + 1), { expirationTtl: ttl });
}

// ── GitHub path validation ───────────────────────────────

function isAllowedGitHubPath(ghPath) {
  return GITHUB_PATH_PREFIXES.some(prefix => ghPath.startsWith(prefix));
}

// ── Route handlers ───────────────────────────────────────

async function handleLogin(request, env, origin) {
  const ip = getClientIP(request);

  // Rate limit check
  const rateCheck = await checkLoginRateLimit(env, ip);
  if (!rateCheck.allowed) {
    return errorResponse(
      `Příliš mnoho pokusů. Zkuste to za ${Math.ceil(rateCheck.retryAfter / 60)} min.`,
      429, origin
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.password) {
    return errorResponse('Missing password', 400, origin);
  }

  const hash = await sha256hex(body.password);
  if (hash !== env.PASSWORD_HASH) {
    await recordLoginAttempt(env, ip, false);
    return errorResponse('Nesprávné heslo.', 401, origin);
  }

  await recordLoginAttempt(env, ip, true);
  const token = await createJwt(env.JWT_SECRET);
  return jsonResponse({ token, expiresIn: JWT_EXPIRY }, 200, origin);
}

async function handleGitHubProxy(request, env, ghPath, origin) {
  // Scope check — only allow our repo
  if (!isAllowedGitHubPath(ghPath)) {
    return errorResponse(`GitHub path not allowed: ${ghPath.slice(0, 80)}`, 403, origin);
  }

  const url = `https://api.github.com${ghPath}`;
  const headers = {
    'Authorization': `Bearer ${env.GITHUB_PAT}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Hippo-Admin-Worker',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions = { method: request.method, headers };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    fetchOptions.body = await request.text();
  }

  const resp = await fetch(url, fetchOptions);

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: {
      'Content-Type': resp.headers.get('Content-Type') || 'application/json',
      ...corsHeaders(origin),
    },
  });
}

async function handleGeminiProxy(request, env, origin) {
  if (!env.GEMINI_KEY) {
    return errorResponse('Gemini API key not configured', 503, origin);
  }

  // Daily rate limit
  const limit = await checkGeminiDailyLimit(env);
  if (!limit.allowed) {
    return errorResponse(
      `Denní limit Gemini API dosažen (${limit.limit}/${limit.limit}). Zkuste zítra.`,
      429, origin
    );
  }

  const body = await request.text();

  // Basic validation — must be a valid generateContent request
  try {
    const parsed = JSON.parse(body);
    if (!parsed.contents || !Array.isArray(parsed.contents)) {
      return errorResponse('Invalid Gemini request: missing contents array', 400, origin);
    }
  } catch {
    return errorResponse('Invalid JSON body', 400, origin);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_KEY}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  // Only count successful calls
  if (resp.ok) {
    await incrementGeminiCount(env);
  }

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: {
      'Content-Type': resp.headers.get('Content-Type') || 'application/json',
      ...corsHeaders(origin),
    },
  });
}

async function handleGeminiStatus(env, origin) {
  const limit = await checkGeminiDailyLimit(env);
  return jsonResponse({
    available: !!env.GEMINI_KEY,
    dailyUsed: limit.count,
    dailyLimit: limit.limit,
  }, 200, origin);
}

// ── Main handler ─────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const hippoClient = request.headers.get('X-Hippo-Client') || '';

    // Security: require either a valid Origin or the custom X-Hippo-Client header.
    // This blocks raw curl/script attacks that don't know to send the header.
    // (Not bulletproof, but raises the bar significantly vs open endpoint.)
    const hasValidOrigin = isAllowedOrigin(origin);
    const hasClientHeader = hippoClient === 'admin';

    if (!hasValidOrigin && !hasClientHeader) {
      return errorResponse('Forbidden', 403, '');
    }

    const allowedOrigin = hasValidOrigin ? origin : ALLOWED_ORIGINS[0];

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(allowedOrigin) });
    }

    const path = url.pathname;

    // ── Public route: login (rate-limited) ──
    if (path === '/auth/login' && request.method === 'POST') {
      return handleLogin(request, env, allowedOrigin);
    }

    // ── Protected routes (require valid JWT) ──
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
      return errorResponse('Missing authorization token', 401, allowedOrigin);
    }

    const claims = await verifyJwt(token, env.JWT_SECRET);
    if (!claims) {
      return errorResponse('Invalid or expired token', 401, allowedOrigin);
    }

    // Auth check
    if (path === '/auth/check') {
      return jsonResponse({ ok: true }, 200, allowedOrigin);
    }

    // Gemini status (includes daily usage info)
    if (path === '/gemini/status') {
      return handleGeminiStatus(env, allowedOrigin);
    }

    // GitHub proxy (scoped to our repo)
    if (path.startsWith('/github/')) {
      const ghPath = path.slice(7); // strip "/github"
      const queryString = url.search;
      return handleGitHubProxy(request, env, ghPath + queryString, allowedOrigin);
    }

    // Gemini proxy (rate-limited)
    if (path === '/gemini/generate' && request.method === 'POST') {
      return handleGeminiProxy(request, env, allowedOrigin);
    }

    return errorResponse('Not found', 404, allowedOrigin);
  },
};
