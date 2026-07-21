# 냉장고를 부탁해 — PWA 배포 폴더

중학교 역사 수업용 교육 게임 **「냉장고를 부탁해 (식재료 속 문화 교류로 여는 세계시민성)」** 를
설치형 웹앱(PWA)으로 배포하기 위한 폴더입니다.

게임 본체는 `index.html` 단일 파일 안에 CSS·JS·이미지가 모두 인라인으로 들어 있어
외부 요청이 없습니다. 원본에서 바뀐 것은 PWA용 태그 3가지(manifest 링크, theme-color,
서비스워커 등록 스크립트)뿐입니다.

## 폴더 구성

| 파일 | 설명 |
|---|---|
| `index.html` | 게임 본체 (원본 + PWA 태그) |
| `manifest.webmanifest` | 앱 이름·아이콘·화면 모드 정의 |
| `sw.js` | 서비스워커 (network-first) |
| `icon-192.png` / `icon-512.png` | 앱 아이콘 (purpose: any) |
| `icon-512-maskable.png` | 안드로이드 마스크형 아이콘 (purpose: maskable) |
| `.nojekyll` | GitHub Pages 가 파일을 Jekyll 로 가공하지 않도록 하는 빈 파일 |

모든 경로는 상대경로(`./`)로 되어 있어 `https://아이디.github.io/저장소이름/` 같은
하위 경로에서도 그대로 동작합니다.

## 1. GitHub Pages 배포

1. GitHub 에서 새 저장소를 만듭니다 (예: `fridge-pwa`). **Public** 이어야 Pages 가 무료입니다.
2. 이 폴더의 파일 전부를 저장소 최상단에 올립니다.
   - 웹 브라우저에서 올리는 경우: 저장소 → **Add file → Upload files** → 파일 드래그 → Commit.
   - `index.html` 이 약 6MB 이므로 업로드에 시간이 조금 걸립니다.
3. 저장소 → **Settings → Pages** 로 이동합니다.
4. **Source** 를 `Deploy from a branch`, **Branch** 를 `main` / `/ (root)` 로 설정하고 저장합니다.
5. 1~2분 뒤 `https://<아이디>.github.io/<저장소이름>/` 에서 게임이 열립니다.

주소가 열리면 크롬 주소창 오른쪽에 **설치 아이콘**이 나타나고, 안드로이드 크롬에서는
"홈 화면에 추가" 안내가 뜹니다. 여기까지만 해도 태블릿에 앱처럼 설치할 수 있습니다.

## 2. PWABuilder 로 안드로이드 APK 만들기 (요약)

1. <https://www.pwabuilder.com> 접속.
2. 위에서 만든 Pages 주소를 입력하고 **Start** 를 누릅니다.
3. 분석이 끝나면 Manifest / Service Worker / Security 항목이 통과인지 확인합니다.
4. **Package For Stores → Android** 를 선택합니다.
5. 옵션 화면에서
   - **Package ID**: `io.github.<아이디>.fridge` 처럼 고유한 값으로 지정합니다.
   - **Signing key**: 처음이면 `Create new`. 생성된 서명 키 파일(`signing.keystore`)과
     비밀번호는 반드시 따로 보관하세요. **분실하면 다음 버전을 같은 앱으로 업데이트할 수 없습니다.**
6. **Download Package** 로 zip 을 받습니다. 안에 `app-release-signed.apk` 가 들어 있습니다.
7. 태블릿에 APK 를 옮겨 설치합니다. (설정에서 "출처를 알 수 없는 앱 설치" 허용 필요)

> 참고: PWABuilder 가 만드는 안드로이드 앱은 TWA(웹앱을 감싼 껍데기) 방식이라
> **실행할 때 인터넷이 필요합니다.** 수업 중 인터넷이 있는 환경을 전제로 한 구성입니다.
> zip 안의 `assetlinks.json` 을 저장소의 `.well-known/` 폴더에 올리면 주소창 없이 전체화면으로 실행됩니다.

## 3. 게임을 수정했을 때

`sw.js` 는 **network-first** 전략입니다. 즉 항상 서버의 최신 파일을 먼저 받아오고,
네트워크가 끊겼을 때만 캐시를 씁니다. 따라서 보통은 **`index.html` 만 새로 올리면
다음 실행부터 바로 반영**됩니다.

그래도 옛 화면이 남아 있다면 `sw.js` 맨 위의 캐시 버전을 올려 캐시를 통째로 비웁니다.

```js
const CACHE = 'fridge-v1';   // → 'fridge-v2' 로 수정 후 업로드
```

버전을 바꿔 올리면 새 서비스워커가 활성화되면서 옛 캐시를 모두 삭제합니다.

## 주의

- 이 게임은 MQTT WebSocket(실시간 기능)을 사용합니다. `sw.js` 는 `ws:`/`wss:` 요청과
  다른 출처의 요청을 가로채지 않도록 되어 있으니, 수정할 때 그 부분을 그대로 두세요.
