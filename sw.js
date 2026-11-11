// Service worker ของ "แต่งรูปง่าย": เก็บไฟล์ของแอปไว้ในเครื่อง ให้เปิดได้เร็วและใช้งานได้แม้ไม่มีอินเทอร์เน็ต
// - หน้าเว็บ (index.html): ใช้เวอร์ชันล่าสุดจากเน็ตก่อน ถ้าออฟไลน์ค่อยใช้ที่เก็บไว้
// - ไลบรารีและโมเดล AI (vendor/): ใช้ที่เก็บไว้ก่อน (ไฟล์ใหญ่ โหลดครั้งแรกตอนใช้ฟีเจอร์นั้น)
// เมื่อแก้ไฟล์ในโฟลเดอร์ vendor ให้เปลี่ยน LIBS เป็นเวอร์ชันใหม่ด้วย
const SHELL = 'shell-v1';
const LIBS = 'libs-v1';
const SHELL_FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'vendor/fonts/fonts.css',
  'vendor/fonts/ibmplexsansthai-400-latin.woff2',
  'vendor/fonts/ibmplexsansthai-400-thai.woff2',
  'vendor/fonts/ibmplexsansthai-500-latin.woff2',
  'vendor/fonts/ibmplexsansthai-500-thai.woff2',
  'vendor/fonts/prompt-500-latin.woff2',
  'vendor/fonts/prompt-500-thai.woff2',
  'vendor/fonts/prompt-600-latin.woff2',
  'vendor/fonts/prompt-600-thai.woff2',
  'vendor/tabler/tabler-icons.min.css',
  'vendor/tabler/fonts/tabler-icons.woff2',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== SHELL && k !== LIBS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

async function networkFirst(req) {
  const cache = await caches.open(SHELL);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return (await cache.match(req, { ignoreSearch: true })) || (await cache.match('index.html')) || Response.error();
  }
}

async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/')) {
    e.respondWith(networkFirst(req));
  } else if (url.pathname.includes('/vendor/')) {
    e.respondWith(cacheFirst(req, url.pathname.includes('/vendor/fonts/') || url.pathname.includes('/vendor/tabler/') ? SHELL : LIBS));
  } else {
    e.respondWith(cacheFirst(req, SHELL));
  }
});
