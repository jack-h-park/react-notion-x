# Changes vs. Upstream (NotionX/react-notion-x)

이 문서는 upstream 저장소([NotionX/react-notion-x](https://github.com/NotionX/react-notion-x)) 대비 이 포크(`jack-h-park/react-notion-x`)에서 직접 추가·수정한 내용을 정리합니다.

> 비교 대상: `upstream/master`  
> 확인된 포크 브랜치: `origin/main`, `origin/feat/text-thumbnail-preview`, `origin/claude/infallible-lovelace`

---

## 1. Gallery Card Cover — Text Thumbnail Teaser

이미지가 없는 갤러리 카드에 페이지 텍스트 콘텐츠로 썸네일을 생성하는 기능입니다. Notion 앱의 `page_content` / `page_content_first` 커버 타입 동작을 재현합니다.

### 신규 파일: `collection-card-cover.ts`

- **위치**: `packages/react-notion-x/src/third-party/collection-card-cover.ts` (669줄)
- **주요 export**: `getCollectionCardCoverCandidate()`

**반환 타입 (`CollectionCardCoverCandidate`)**

| kind | 설명 |
|------|------|
| `image` | 이미지 URL + alt + objectPosition |
| `teaser` | 텍스트 기반 썸네일 (eyebrow / title / body / icon + tone) |
| `empty` | 커버 없음 |

**이미지 후보 탐색 로직**

1. 페이지 직계 자식 블록 순회 (BFS, 최대 16개)
2. `column_list`, `column`, `synced_block` 등 투명 컨테이너는 내부를 재귀 탐색
3. `image` 블록 → 직접 사용
4. `video` 블록 → `display_source`가 이미지 URL이면 사용
5. `pdf` / `file` 블록 → `preview_images` 맵에 등록된 경우 사용
6. 중첩 `page` / `collection_view_page`는 건너뜀

**텍스트 Teaser 생성 로직**

이미지가 없을 때 텍스트 블록에서 Teaser를 구성합니다:

- **tone 분류**
  - `callout` → 눈에 띄는 callout 스타일
  - `quote` → 인용 블록 스타일
  - `default` → 일반 텍스트 스타일
- **eyebrow**: 짧은 라벨 (heading, callout 제목 등). 메타데이터성 텍스트(`KEY: value` 패턴)·약한 heading(`overview`, `summary` 등)은 제외
- **title**: 페이지 내 첫 번째 의미 있는 heading. 페이지 제목과 중복되면 억제
- **body**: 의미 있는 텍스트 블록 최대 3개, 240자 이내
- **icon**: callout 블록의 이모지/아이콘 (URL 형식은 제외)
- `genericEyebrowTexts` (executive summary, overview 등)는 body가 없으면 eyebrow 숨김

**헬퍼 함수 목록**

| 함수 | 역할 |
|------|------|
| `traversePageContent` | 방문 집합 기반 전체 페이지 블록 순회 |
| `getFlattenedPreviewBlocks` | BFS로 최대 16개 미리보기 블록 추출 |
| `getLoadedDescendantBlocks` | callout/toggle 자식 블록 추출 |
| `resolveVisualCandidate` | 단일 블록에서 이미지 후보 생성 |
| `buildTeaserCandidate` | 텍스트 블록 분석 후 Teaser 후보 생성 |
| `getCalloutOrToggleTexts` | callout/toggle의 eyebrow·body 추출 |
| `getMeaningfulTextParts` | 의미 있는 텍스트 파트 최대 N개 수집 |
| `shouldSuppressTeaserTitle` | Teaser 제목이 페이지 제목과 중복인지 판별 |
| `finalizeTeaserCandidate` | 최종 Teaser 후보 정리 (generic eyebrow 억제 등) |
| `clipText` | 텍스트를 maxChars 이내로 자르고 `…` 추가 |
| `isMetadataLikeText` | `KEY: value` 패턴 감지 |
| `isImageLikeUrl` | URL이 이미지인지 판별 (확장자·도메인 기반) |
| `hasPreviewImage` | `recordMap.preview_images`에 등록 여부 확인 |

### 테스트: `collection-card-cover.test.ts`

- **위치**: `packages/react-notion-x/src/third-party/collection-card-cover.test.ts` (659줄)
- Vitest 기반 단위 테스트
- 커버 케이스: 직접 이미지, 중첩 컨테이너 이미지, 비디오 preview, callout teaser, quote teaser, 페이지 제목 중복 억제, generic eyebrow 처리 등

### `collection-card.tsx` 수정

- `getCollectionCardCoverCandidate()` 를 호출해 `candidate.kind`에 따라 분기
  - `image` → 기존 `<LazyImage>` 렌더링
  - `teaser` → `<CollectionCardCoverTeaser>` 렌더링 (신규)
  - `empty` → 커버 영역 없음

---

## 2. Button 블록 개선

- **위치**: `packages/react-notion-x/src/components/button.tsx`

**변경 사항**

| 항목 | 내용 |
|------|------|
| 아이콘 표시 | automation의 `properties.icon`을 버튼 텍스트 앞에 `<span class="notion-button-icon">` 으로 렌더링 |
| `open_page` 액션 | `target.page.id` (신 API)와 `target.pageId` (구 API) 둘 다 지원 |
| 자동화 없는 버튼 | `getTextContent()` 대신 `<Text>` 컴포넌트로 렌더링 (rich text 지원) |
| import 순서 | ESLint 규칙에 맞게 import 순서 정리 |

---

## 3. Quote 블록 수정

- **위치**: `packages/react-notion-x/src/block.tsx`

**변경 내용**

```
// 변경 전
if (!block.properties) return null

// 변경 후
if (!block.properties && !children) return null
```

Notion에서 quote 블록의 텍스트가 `properties.title`이 아닌 **자식 블록**에만 있는 경우, 기존 코드는 해당 블록을 완전히 건너뛰었습니다. 이제 `properties`가 없어도 `children`이 있으면 렌더링합니다.

---

## 4. 신규 CSS 스타일

- **위치**: `packages/react-notion-x/src/styles.css`

**Teaser 썸네일 스타일** (Gallery card cover용)

| 클래스 | 역할 |
|--------|------|
| `.notion-collection-card-cover-teaser` | 테두리 없는 전체 영역, padding 18px |
| `.notion-collection-card-cover-teaser-panel` | flex column 레이아웃, gap 6px |
| `.notion-collection-card-cover-teaser-panel-callout` | callout 전용, gap 10px |
| `.notion-collection-card-cover-teaser-panel-quote` | 왼쪽 3px border + padding |
| `.notion-collection-card-cover-teaser-eyebrow` | 11px, uppercase, 1줄 clamp |
| `.notion-collection-card-cover-teaser-title` | 600 weight, 15px, 3줄 clamp |
| `.notion-collection-card-cover-teaser-body` | 13px, 여러 줄 clamp |
| `.notion-collection-card-cover-teaser-icon` | flex 고정, 17px |

**Button 다크모드 스타일**

| 클래스 | 역할 |
|--------|------|
| `.notion-button-icon` | 버튼 아이콘 여백 |
| `.dark-mode .notion-button:hover` | 다크모드 hover 색상 |
| `.dark-mode .notion-button:active` | 다크모드 active 색상 |
| `.dark-mode .notion-button.notion-default:hover` | 다크모드 기본 버튼 hover |
| `.dark-mode .notion-button.notion-default:active` | 다크모드 기본 버튼 active |

---

## 5. notion-client API 개선

- **위치**: `packages/notion-client/src/notion-api.ts`

**변경 사항**

| 항목 | 내용 |
|------|------|
| `automation` / `automation_action` 초기화 | `recordMap`에 해당 맵이 없는 경우 빈 객체로 초기화 |
| `getAllContentBlockIds()` 신규 메서드 | 일반 페이지 + 컬렉션 내 서브페이지 전체의 콘텐츠 블록 ID 수집 |
| `getCollectionPageIds()` 신규 메서드 | `recordMap`에서 컬렉션 소속 페이지 블록 ID 목록 반환 |
| signed URL 범위 확대 | `addSignedUrls` 호출 시 컬렉션 서브페이지 블록까지 포함 |

---

## 6. 패키징 — GitHub tarball 직접 설치 지원

upstream은 npm 배포만을 지원합니다. 이 포크는 GitHub 저장소를 npm 의존성으로 직접 설치(`github:jack-h-park/react-notion-x#tag`)할 수 있도록 패키지 구조를 수정했습니다.

**변경 내용**

| 파일 | 변경 내용 |
|------|-----------|
| `package.json` (루트) | 루트를 `react-notion-x` 패키지로 동작하도록 설정 (`main`, `exports` 추가) |
| `packages/react-notion-x/package.json` | `build/` 결과물을 `exports`에 포함, `prepare` 스크립트 제거 |
| `packages/react-notion-x/build/` | 빌드 결과물 (`index.js`, `third-party/*.js`, `.d.ts`) 저장소에 커밋 |

**배포 태그 네이밍 규칙**

```
7.10.0-jp.1 ~ 7.10.0-jp.8   (현재 최신: jp.8)
7.7.1-jp.2, 7.7.1-jp.3
```

`-jp.N` suffix로 upstream 버전과 구분합니다.
