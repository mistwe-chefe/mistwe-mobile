/* Service Worker – Persönliche App
 * Bewusst klein und ohne Fachlogik. Kennt keine Module.
 * Liest nur `meta`, schreibt nur `outbox` (Architektur 4.2).
 */
const SW_VERSION = '1.0.0';
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

async function outboxAdd(entry) {
  const db = await openDB();
  await new Promise((res, rej) => {
    const t = db.transaction('outbox', 'readwrite');
    t.objectStore('outbox').put(entry);
    t.oncomplete = res; t.onerror = () => rej(t.error);
  });
  db.close();
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
      await outboxAdd({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, kind: 'action', module: data.m, itemId: data.id, action: event.action, tries: 0, createdAt: Date.now() });
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      all.forEach(c => c.postMessage({ type: 'outbox' }));
      // Ab Version 1.1 zusätzlich: POST /v1/reminders/{m}/{id}/ack an den Worker.
      return;
    }
    const hash = data.m ? (data.id ? `#/${data.m}/${data.id}` : `#/${data.m}`) : '#/';
    await focusOrOpen(hash);
  })());
});

/* ---------- Push (Empfang vorbereitet, Versand folgt mit dem Worker in 1.1) ---------- */
self.addEventListener('push', event => {
  let p = {};
  try { p = event.data ? event.data.json() : {}; } catch (_) {}
  // Jeder Push MUSS eine Benachrichtigung zeigen (Safari entzieht sonst das Abo).
  const title = p.type === 'test' ? '🔔 Test-Push' : '✅ ToDo fällig';
  const body = p.type === 'test' ? 'Push funktioniert.' : (p.items && p.items.length > 1 ? `${p.items.length} Erinnerungen fällig` : 'Öffne die App für Details.');
  const first = p.items && p.items[0];
  event.waitUntil(self.registration.showNotification(title, {
    body, tag: first ? `${first.m}-${first.id}` : 'pa-push', renotify: true,
    icon: 'icons/icon-192.png', badge: 'icons/icon-192.png',
    data: first ? { m: first.m, id: first.id } : {},
    actions: first ? [{ action: 'done', title: '✓ Erledigt' }, { action: 'snooze', title: '⏰ 1 Std später' }] : [],
  }));
});
