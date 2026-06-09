# Changes vs. Upstream (NotionX/react-notion-x)

이 문서는 upstream 저장소([NotionX/react-notion-x](https://github.com/NotionX/react-notion-x)) 대비 이 포크에서 추가 구현하거나 수정한 내용을 정리합니다.

---

## 신규 패키지

### `notion-x-to-md`

Notion 페이지를 Markdown 문자열로 변환하는 독립 패키지입니다. LLM 파이프라인이나 콘텐츠 추출 용도로 활용할 수 있습니다.

- **위치**: `packages/notion-x-to-md/`
- **진입점**: `notion-page-to-markdown.ts`
- **CLI**: `npx notion-x-to-md <page-id-or-url>`

**주요 기능**

| 기능 | 설명 |
|------|------|
| 전체 블록 지원 | 텍스트, 리스트, 코드, 테이블, 컬렉션 등 모든 Notion 블록 변환 |
| 수식(KaTeX) | 수식 블록을 `$$...$$` 형식으로 출력 |
| 컬렉션 | 모든 데이터베이스 뷰를 Markdown 테이블로 변환 |
| 트윗 임베드 | `tweet-to-md` 연동으로 트윗 본문 포함 |
| 숫자/날짜 포매팅 | 컬렉션 속성의 숫자·날짜 포맷 적용 |
| GFM 출력 | GitHub-Flavored Markdown 형식 |
| API 키 불필요 | 공개 페이지는 Notion API 키 없이 동작 |
| 포뮬러 평가 | `eval-formula.ts`를 통한 Notion 수식 계산 |

**사용 예시**

```ts
import { NotionAPI } from 'notion-client'
import { notionPageToMarkdown } from 'notion-x-to-md'

const api = new NotionAPI()
const page = await api.getPage('067dd719a912471ea9a3ac10710e7fdf')
const markdown = await notionPageToMarkdown(page)
console.log(markdown)
```

---

## 신규 블록 타입 지원

### Tab 블록 (`tab` / `tab_group`)

Notion의 탭 블록을 완전히 지원합니다.

- **컴포넌트**: `packages/react-notion-x/src/components/tab-block.tsx`
- **블록 타입**: `tab` (내부적으로 `tab_group` 안에 포함)

**구현 세부사항**

- `activeIndex` 상태로 현재 활성 탭 관리
- 탭 라벨이 빈 경우 `Tab 1`, `Tab 2` ... 로 자동 폴백
- WAI-ARIA `role="tablist"` / `role="tab"` / `role="tabpanel"` 적용
- `ResizeObserver` + scroll 이벤트로 탭 목록 overflow 시 **좌우 페이드 효과** 표시
- 탭 수가 변경될 때 `activeIndex`를 유효 범위 내로 자동 조정

**관련 CSS 클래스**

```
.notion-tab-block
.notion-tab-block-inner
.notion-tab-header-row
.notion-tab-scroll-host
.notion-tab-scroll
.notion-tab-list-inner
.notion-tab-pill-wrap
.notion-tab-button
.notion-tab-button-active
.notion-tab-button-label
.notion-tab-scroll-fade
.notion-tab-scroll-fade-left
.notion-tab-scroll-fade-right
.notion-tab-scroll-fade-visible
.notion-tab-panel
```

---

### Header 4 블록 (`header_4`)

Notion의 h4 제목 블록을 지원합니다.

- **위치**: `packages/react-notion-x/src/block.tsx` (case `'header_4'`)
- h1~h3와 동일한 앵커·TOC 통합 방식으로 렌더링
- CSS 클래스: `.notion-h4`

---

### Button 블록 (`button`)

Notion의 버튼 블록과 자동화(Automation) 액션을 지원합니다.

- **컴포넌트**: `packages/react-notion-x/src/components/button.tsx`

**렌더링 로직**

| 상태 | 동작 |
|------|------|
| 자동화 없음 | 정적 버튼으로만 렌더링 |
| 자동화 있음 | 클릭 시 첫 번째 액션 실행 (URL 열기 등) |

- `getBlockValue`를 통해 automation/action 블록의 이중 중첩 구조를 안전하게 언박싱
- 버튼 색상(Notion color) 적용

---

## notion-utils 신규 유틸리티

### `getBlockValue`

Notion API가 일부 블록을 이중 중첩(`{ value: { value: Block } }`) 구조로 반환하는 문제를 투명하게 처리하는 헬퍼 함수입니다.

- **위치**: `packages/notion-utils/src/get-block-value.ts`
- **export**: `notion-utils` 패키지에서 직접 import 가능

```ts
import { getBlockValue } from 'notion-utils'

const block = getBlockValue(recordMap.block[blockId])
```

`Block | Collection | CollectionView | User` 타입을 모두 지원하며, `value` 래퍼가 몇 겹이든 재귀적으로 언박싱합니다.

---

## notion-client 개선

### 커스텀 이모지 지원 (`custom_emojis`)

Notion의 커스텀 이모지(사용자 정의 이모지)를 API 응답에서 가져와 `recordMap`에 포함합니다.

- **위치**: `packages/notion-client/src/notion-api.ts`
- `getPage` 호출 시 `custom_emojis` 엔드포인트를 추가로 조회
- 결과를 `recordMap.custom_emojis`에 저장
- `react-notion-x`의 `page-icon.tsx`에서 커스텀 이모지 URL을 이미지로 렌더링

---

## react-notion-x 버그 수정 및 개선

### URL 두 가지 색상 표시 (URL Abbreviation)

Table 뷰의 URL 속성을 Notion 앱처럼 도메인은 진하게, 경로는 흐리게 구분해 표시합니다.

- **위치**: `packages/react-notion-x/src/third-party/property.tsx`
- 도메인: `.notion-url-domain` (불투명)
- 경로: `.notion-url-path` (반투명)
- URL 셀에는 tooltip을 표시하지 않음 (자체 축약 표시 사용)

---

### Table Cell Tooltip (테이블 셀 툴팁)

Table 뷰에서 truncate된 셀에 hover 시 전체 내용을 tooltip으로 표시합니다.

- **컴포넌트**: `packages/react-notion-x/src/third-party/table-cell-tooltip.tsx`

**구현 세부사항**

- `createPortal`로 `document.body`에 단일 tooltip DOM 노드를 마운트 (셀마다 개별 DOM 없음)
- 테이블 body에 delegated event listener 방식 적용 (`.notion-table-cell-nowrap` 셀에 반응)
- `scrollWidth > clientWidth` 비교로 실제 truncation 여부 판별
- select/multi-select 배지가 truncate된 경우도 감지
- 50ms debounce로 셀 이동 시 flicker 방지
- URL 셀(`.notion-table-cell-url`)은 tooltip 제외

---

### Table Cell Wrapping (테이블 셀 줄바꿈 제어)

테이블 뷰의 셀이 nowrap 모드로 동작하도록 CSS 및 컴포넌트를 개선합니다.

- `.notion-table-cell-nowrap` 클래스로 overflow 처리
- `TableCellTooltip`과 함께 동작해 잘린 내용을 hover 시 표시

---

### Title Text 정규화 (Table Cell)

Table 뷰의 title 속성에서 불필요한 공백·줄바꿈을 정규화합니다.

- **위치**: `packages/react-notion-x/src/third-party/property.tsx`
- title decorator를 단순 텍스트로 변환해 일관된 렌더링 보장

---

### 아이콘 flex-shrink 수정

Table 뷰 셀 안에서 페이지 아이콘이 압축되는 문제를 수정합니다.

- `.notion-page-icon` 요소에 `flex-shrink: 0` 적용

---

### List 뷰 Title 중복 방지

List 뷰의 body 영역에서 title 속성이 중복 렌더링되는 문제를 수정합니다.

- **위치**: `packages/react-notion-x/src/third-party/collection-view-list.tsx`
- body 렌더 시 title 속성을 건너뜀

---

### Inline Text 중첩 앵커 수정

인라인 텍스트 링크가 `<a>` 안에 `<a>`를 생성하는 HTML 유효성 오류를 수정합니다.

- **위치**: `packages/react-notion-x/src/components/text.tsx`
- `components.Link`를 사용해 중첩 앵커 방지

---

### Alias Pointer 순회 수정

Notion의 alias 블록 타입이 실제 페이지 ID를 가리키는 `alias_pointer`를 순회하도록 수정합니다.

- **위치**: `packages/notion-utils/src/get-page-content-block-ids.ts`
- `alias_pointer`를 재귀적으로 따라가 정확한 블록 ID 목록 반환

---

### 컬렉션 뷰 중첩 수정

컬렉션 뷰 내에서 중첩 컬렉션이 올바르게 렌더링되지 않는 문제를 수정합니다.

- **위치**: `packages/notion-client/src/notion-api.ts` (`getPage`)
- `getBlockValue`로 `collection_view` 블록 언박싱

---

### Button 텍스트 중첩 수정

버튼 블록의 텍스트 렌더링 시 중첩 요소가 잘못 생성되는 문제를 수정합니다.

- **위치**: `packages/notion-client/src/notion-api.ts`
- `getBlockValue`로 automation/action 블록 언박싱

---

### 숫자 리스트 시작 번호 지원

`numbered_list` 블록의 `format.list_start_index`를 존중해 임의의 시작 번호를 렌더링합니다.

- **위치**: `packages/notion-utils/src/get-list-number.ts`
- `list_start_index`가 설정된 경우 해당 번호부터 시작
- 미설정 시 그룹 내 위치 기반 자동 계산

---

### Collection Load Limit (클라이언트 사이드 로드 제한)

Notion의 `inline_collection_first_load_limit` 설정을 클라이언트 사이드에서 적용합니다.

- **위치**: 각 컬렉션 뷰 컴포넌트
  - `collection-view-table.tsx`
  - `collection-view-list.tsx`
  - `collection-view-gallery.tsx`
- 뷰가 접힌 상태(`!isExpanded`)일 때 `loadLimit`개만 렌더링
- 펼치기 시 전체 항목 표시

---

### 인라인 데이터베이스 제목 숨김 존중

인라인 데이터베이스의 `hide_inline_collection_name` 설정을 렌더링 시 반영합니다.

- **위치**: `packages/react-notion-x/src/third-party/collection-view.tsx`
- `format.hide_inline_collection_name === true`이면 컬렉션 제목 미표시

---

### Gallery Cover `page_content_first` 지원

갤러리 뷰의 커버 타입으로 `page_content_first`를 지원합니다.

- **위치**: `packages/react-notion-x/src/third-party/collection-view-gallery.tsx`
- 페이지 콘텐츠 첫 번째 이미지를 갤러리 커버로 사용

---

### Ghost Select Tag 필터링

Select / Multi-select 속성에서 스키마에 존재하지 않는 태그(ghost tag)를 렌더링 시 필터링합니다.

- **위치**: `packages/react-notion-x/src/third-party/property.tsx`

---

### TOC 헤더 수정

Table of Contents의 헤더 레벨 계산 버그를 수정합니다.

- h1~h4 혼용 시 TOC indent 레벨이 올바르게 계산되도록 개선

---

## 개발 환경 개선

### 로컬 개발 시 소스 파일 직접 참조

로컬 개발 환경에서 컴파일된 패키지 대신 소스 TypeScript 파일을 직접 참조합니다.

- `tsconfig.json`의 `paths` 및 패키지 `exports` 설정을 통해 `src/` 파일을 직접 임포트
- 빌드 없이 즉시 변경 사항 반영 가능

---

## 버전 이력 요약

| 버전 | 주요 변경 |
|------|-----------|
| v7.10.0 | Tab 블록 지원, 커스텀 이모지, InetIntel PR 시리즈 통합 |
| v7.9.1 | Header 4 블록 지원 |
| v7.9.0 | March 2026 Notion API 변경 대응 |
| v7.8.3 | 테이블 셀 개선 (URL 표시, 아이콘 수정, Title 정규화, Tooltip) |
| v7.8.2 | 컬렉션 Load Limit, Gallery cover, 인라인 DB 제목 숨김 |
| v7.8.1 | Button 블록 지원 |
| v7.8.0 | getBlockValue, 이중 중첩 블록 처리 |
