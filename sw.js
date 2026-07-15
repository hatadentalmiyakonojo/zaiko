/* 在庫発注アプリ Service Worker
   方針: ネットワーク優先＋キャッシュフォールバック。
   オンラインなら常に最新のindex.htmlを取得（バージョン番号の手動更新が不要）、
   オフラインでも直近キャッシュで起動できる。
   localStorage / IndexedDB のデータには一切触れない。 */
"use strict";
const CACHE = "zaiko-app-cache";
const PRECACHE = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // 外部（Ciサイト等）は素通し
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      })
      .catch(() =>
        caches.match(req).then(hit => hit || caches.match("./index.html"))
      )
  );
});
