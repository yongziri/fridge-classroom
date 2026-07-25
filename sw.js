// 냉장고를 부탁해 — PWA 서비스워커
// 전략: network-first (네트워크 우선). 수업 환경은 항상 인터넷이 있으므로
// 오프라인 지원보다 "게임을 수정하면 즉시 반영되는 것"을 우선한다.
// 캐시는 네트워크가 끊겼을 때만 쓰는 비상용 폴백이다.

// 게임을 크게 바꾼 뒤 강제로 캐시를 비우고 싶으면 이 버전을 올린다 (fridge-v2, v3 ...)
const CACHE = 'fridge-v3';

// 설치 즉시 새 서비스워커를 활성 상태로 넘긴다 (대기 없이 교체)
self.addEventListener('install', function (event) {
  self.skipWaiting();
});

// 활성화 시 옛 버전 캐시를 정리하고, 열려 있는 탭들의 제어권을 곧바로 가져온다
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;

  // GET 이 아닌 요청은 건드리지 않는다
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return; // 파싱 불가한 URL 은 그대로 통과
  }

  // http/https 가 아닌 스킴(ws:, wss:, chrome-extension: 등)은 가로채지 않는다.
  // 이 게임은 MQTT WebSocket 을 쓰므로 서비스워커가 절대 관여하면 안 된다.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // 같은 출처(origin)가 아닌 요청도 그대로 네트워크에 맡긴다
  if (url.origin !== self.location.origin) return;

  // network-first: 네트워크를 먼저 시도하고, 성공하면 응답을 복제해 캐시에 저장한다.
  event.respondWith(
    fetch(req)
      .then(function (res) {
        // 정상 응답(같은 출처 basic 응답)만 캐시에 넣는다
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(req, copy);
          });
        }
        return res;
      })
      .catch(function () {
        // 네트워크 실패 시에만 캐시로 폴백한다
        return caches.match(req);
      })
  );
});
