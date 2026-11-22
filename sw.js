/* Service Worker – Persönliche App
 * Bewusst klein und ohne Fachlogik. Kennt keine Module.
 * Liest nur `meta`, schreibt nur `outbox` (Architektur 4.2).
 */
const SW_VERSION = '1.2.0';
const CACHE = 'pa-shell-' + SW_VERSION;
const DB_NAME = 'persoenliche-app';
const DB_VERSION = 1;
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

/* ---------- Installation / Aktivierung ---------- */
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(SHELL.map(u => cache.add(new Request(u, { cache: 'no-cache' })).catch(() => {})));
    // Kein automatisches skipWaiting: die App fragt den Nutzer (außer beim allerersten Install).
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('pa-shell-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'skipWaiting') self.skipWaiting();
});

/* ---------- Offline: Netzwerk zuerst für App-Dateien ---------- */
function isShellRequest(req) {
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return false;
  if (req.mode === 'navigate') return true;
  const scope = new URL(self.registration.scope);
  const rel = './' + url.pathname.slice(scope.pathname.length);
  return SHELL.includes(rel);
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || !isShellRequest(req)) return; // alles andere (z. B. API) unverändert
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res && res.ok) {
        const key = req.mode === 'navigate' ? './index.html' : req;
        cache.put(key, res.clone());
      }
      return res;
    } catch (e) {
      const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await cache.match('./index.html') : null);
      if (hit) return hit;
      throw e;
    }
  })());
});

/* ---------- IndexedDB (gleiches Schema wie index.html) ---------- */
function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, DB_VERSION);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains('kv')) {
        const s = db.createObjectStore('kv', { keyPath: 'k' });
        s.createIndex('by_module', 'm');
        s.createIndex('by_collection', ['m', 'c']);
      }
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'k' });
      if (!db.objectStoreNames.contains('backups')) db.createObjectStore('backups', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', { keyPath: 'id' });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function metaGet(k) {
  const db = await openDB();
  try {
    return await new Promise((res, rej) => {
      const r = db.transaction('meta', 'readonly').objectStore('meta').get(k);
      r.onsuccess = () => res(r.result ? r.result.v : null); r.onerror = () => rej(r.error);
    });
  } finally { db.close(); }
}

async function outboxAdd(entry) {
  const db = await openDB();
  await new Promise((res, rej) => {
    const t = db.transaction('outbox', 'readwrite');
    t.objectStore('outbox').put(entry);
    t.oncomplete = res; t.onerror = () => rej(t.error);
  });
  db.close();
}

/* ---------- Entschlüsselung (identisch zu Crypto in index.html) ---------- */
function unb64u(str) {
  const s = String(str).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}
async function decryptTitle(key, enc, m, id) {
  if (!key || !enc) return null;
  try {
    const b = unb64u(enc);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.subarray(0, 12), additionalData: new TextEncoder().encode(`${m}/__reminders/${id}/title`) }, key, b.subarray(12));
    return JSON.parse(new TextDecoder().decode(pt));
  } catch (_) { return null; }
}
function duration(min) {
  min = Math.max(0, Math.round(min));
  if (min < 60) return `${Math.max(min, 1)} Min`;
  if (min < 1440) return `${Math.round(min / 60)} Std`;
  const d = Math.round(min / 1440); return `${d} ${d === 1 ? 'Tag' : 'Tage'}`;
}
function describe(it, now) {
  if (it.dl) {
    if (it.at || Math.abs(now - it.dl) < 60000) return '⏰ Jetzt fällig!';
    if (now > it.dl) return `🔴 Überfällig seit ${duration((now - it.dl) / 60000)}`;
    return `Abgabe in ${duration((it.dl - now) / 60000)}`;
  }
  return `${it.n || 1}. Erinnerung`;
}

/* ---------- Server (Push-Dienst) ---------- */
async function apiCall(method, path, body) {
  const sync = await metaGet('sync');
  if (!sync || !sync.enabled || !sync.token || !sync.api) return null;
  const res = await fetch(String(sync.api).replace(/\/+$/, '') + path, {
    method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + sync.token }, body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json().catch(() => ({}));
}
async function notifyClients(msg) {
  const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  all.forEach(c => c.postMessage(msg));
}

/* ---------- Benachrichtigungen ---------- */
async function focusOrOpen(hash) {
  const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const scope = self.registration.scope;
  const client = all.find(c => c.url.startsWith(scope));
  if (client) {
    if (hash) client.postMessage({ type: 'navigate', hash });
    try { return await client.focus(); } catch (_) { return client; }
  }
  return self.clients.openWindow(scope + (hash || ''));
}

self.addEventListener('notificationclick', event => {
  const n = event.notification;
  const data = n.data || {};
  n.close();
  event.waitUntil((async () => {
    if ((event.action === 'done' || event.action === 'snooze') && data.m && data.id) {
      // 1. lokal vormerken (die App aktualisiert beim nächsten Öffnen das Modul), 2. direkt an den Server melden
      await outboxAdd({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, kind: 'action', module: data.m, itemId: data.id, action: event.action, tries: 0, createdAt: Date.now() });
      try {
        await apiCall('POST', `/v1/reminders/${encodeURIComponent(data.m)}/${encodeURIComponent(data.id)}/ack`, event.action === 'done' ? { action: 'done' } : { action: 'snooze', snoozeMin: 60 });
      } catch (_) { /* offline: die App meldet die Änderung später über den normalen Sync */ }
      await notifyClients({ type: 'outbox' });
      return;
    }
    const hash = data.m ? `#/${data.m}` : '#/';  // Antippen öffnet das Modul (nicht das Bearbeiten-Fenster)
    await focusOrOpen(hash);
  })());
});

/* ---------- Push vom Push-Dienst (Architektur 8.4) ---------- */
async function handlePush(p) {
  const now = Date.now();
  const opts = { icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' };
  if (p.type === 'test') {
    return self.registration.showNotification('🔔 Test-Push', { ...opts, body: 'Push funktioniert' + (p.from ? ` (ausgelöst von ${p.from})` : '') + '.', tag: 'pa-test' });
  }
  const items = Array.isArray(p.items) ? p.items : [];
  const total = items.length + (p.more || 0);
  let key = null, names = null;
  // Namen und Schlüssel höchstens 1,5 s suchen – iOS verlangt, dass die Mitteilung sofort erscheint
  try {
    [names, key] = await Promise.race([
      Promise.all([metaGet('notifyTitles').catch(() => null), metaGet('cryptoKey').catch(() => null)]),
      new Promise(r => setTimeout(() => r([null, null]), 1500)),
    ]);
  } catch (_) {}
  const titled = await Promise.all(items.map(async it => ({ ...it, title: (names && names[`${it.m}/${it.id}`]) || await decryptTitle(key, it.t, it.m, it.id) })));
  notifyClients({ type: 'sync' }).catch(() => {});
  if (!total) return self.registration.showNotification('🔔 Erinnerung', { ...opts, body: 'Öffne die App für Details.', tag: 'pa-push' });
  if (total <= 5) {
    // Jeder Push MUSS eine Benachrichtigung zeigen (Safari entzieht sonst das Abo).
    await Promise.all(titled.map(it => self.registration.showNotification('🔔 ' + (it.title || 'ToDo fällig'), {
      ...opts, body: describe(it, now), tag: `${it.m}-${it.id}`, renotify: true,
      data: { m: it.m, id: it.id },
      actions: [{ action: 'done', title: '✓ Erledigt' }, { action: 'snooze', title: '⏰ 1 Std später' }],
    })));
    return;
  }
  const list = titled.slice(0, 6).map(it => '• ' + (it.title || 'ToDo')).join('\n');
  const first = titled.find(it => it.title);
  return self.registration.showNotification(first ? `🔔 ${first.title} + ${total - 1} weitere` : `🔔 ${total} Erinnerungen fällig`, {
    ...opts, body: list + (total > 6 ? `\n… und ${total - 6} weitere` : ''), tag: 'pa-summary', renotify: true,
    data: { m: titled[0] ? titled[0].m : undefined },
  });
}

self.addEventListener('push', event => {
  let p = {};
  try { p = event.data ? event.data.json() : {}; } catch (_) {}
  event.waitUntil(Promise.all([
    handlePush(p).catch(() => self.registration.showNotification('🔔 Erinnerung', { body: 'Öffne die App für Details.', tag: 'pa-push', icon: 'icons/icon-192.png' })),
    logReceipt(p),
  ]));
});

/* Diagnose: Empfang protokollieren (lokal in der Outbox und beim Server) */
async function logReceipt(p) {
  const at = Date.now();
  try { await outboxAdd({ id: `pushlog-${at}-${Math.random().toString(36).slice(2, 6)}`, kind: 'pushlog', type: p.type || '?', n: Array.isArray(p.items) ? p.items.length : 0, at, createdAt: at }); } catch (_) {}
  try { await apiCall('POST', '/v1/push-received', { at, type: p.type || '?' }); } catch (_) {}
}

/* Browser hat das Abo erneuert → beim Server aktualisieren */
self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil((async () => {
    try {
      const push = await metaGet('push');
      let sub = event.newSubscription;
      if (!sub && push && push.vapid) sub = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: unb64u(push.vapid) });
      if (sub) await apiCall('PUT', '/v1/subscription', sub.toJSON());
    } catch (_) { /* die App frischt das Abo beim nächsten Start auf */ }
  })());
});
