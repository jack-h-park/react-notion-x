import type {
  Block,
  CollectionCardCover,
  ExtendedRecordMap
} from 'notion-types'
import { getBlockIcon, getTextContent, normalizeUrl } from 'notion-utils'

import type { MapImageUrlFn } from '../types'

type ThumbnailImageCandidate = {
  kind: 'image'
  src: string
  alt: string
  objectPosition: string
}

type ThumbnailTeaserCandidate = {
  kind: 'teaser'
  tone: 'default' | 'callout' | 'quote'
  eyebrow?: string
  title?: string
  body: string
  icon?: string
}

type ThumbnailEmptyCandidate = {
  kind: 'empty'
}

export type CollectionCardCoverCandidate =
  | ThumbnailImageCandidate
  | ThumbnailTeaserCandidate
  | ThumbnailEmptyCandidate

const headingBlockTypes = new Set(['header', 'sub_header', 'sub_sub_header'])
const bodyTextBlockTypes = new Set([
  'text',
  'bulleted_list',
  'numbered_list',
  'to_do',
  'toggle'
])
const imageExtensions = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'avif',
  'bmp',
  'svg'
])

const transparentContainerBlockTypes = new Set([
  'column_list',
  'column',
  'synced_block',
  'transclusion_container',
  'transclusion_reference'
])
const weakHeadingTexts = new Set([
  'objective',
  'overview',
  'summary',
  'executive summary',
  'context',
  'environment',
  'status',
  'type'
])
const genericEyebrowTexts = new Set([
  'executive summary',
  'overview',
  'summary',
  'key takeaways',
  'highlights'
])

function getBlockChildren(block: Block | undefined): string[] {
  return Array.isArray(block?.content) ? block.content : []
}

function traversePageContent(
  rootBlock: Block,
  recordMap: ExtendedRecordMap
): Block[] {
  const visited = new Set<string>()
  const blocks: Block[] = []

  function visit(blockId: string, isRoot = false) {
    if (!blockId || visited.has(blockId)) return
    visited.add(blockId)

    const block = recordMap.block[blockId]?.value
    if (!block) return

    if (!isRoot) {
      if (block.type === 'page' || block.type === 'collection_view_page') {
        return
      }

      blocks.push(block)
    }

    for (const childId of getBlockChildren(block)) {
      visit(childId)
    }
  }

  visit(rootBlock.id, true)
  return blocks
}

function getFlattenedPreviewBlocks(
  rootBlock: Block,
  recordMap: ExtendedRecordMap,
  maxBlocks = 16
): Block[] {
  const result: Block[] = []
  const queue = [...getBlockChildren(rootBlock)]
  const visited = new Set<string>()

  while (queue.length > 0 && result.length < maxBlocks) {
    const blockId = queue.shift()
    if (!blockId || visited.has(blockId)) continue
    visited.add(blockId)

    const block = recordMap.block[blockId]?.value
    if (!block) continue

    if (block.type === 'page' || block.type === 'collection_view_page') {
      continue
    }

    if (transparentContainerBlockTypes.has(block.type)) {
      queue.unshift(...getBlockChildren(block))
      continue
    }

    result.push(block)
  }

  return result
}

function getLoadedDescendantBlocks(
  rootBlock: Block,
  recordMap: ExtendedRecordMap,
  maxBlocks = 8
): Block[] {
  const result: Block[] = []
  const visited = new Set<string>()
  const queue = [...getBlockChildren(rootBlock)]

  while (queue.length > 0 && result.length < maxBlocks) {
    const blockId = queue.shift()
    if (!blockId || visited.has(blockId)) continue
    visited.add(blockId)

    const block = recordMap.block[blockId]?.value
    if (!block) continue

    if (block.type === 'page' || block.type === 'collection_view_page') {
      continue
    }

    result.push(block)
    queue.push(...getBlockChildren(block))
  }

  return result
}

function getBlockPlainText(block: Block): string {
  return getTextContent(block.properties?.title).replaceAll(/\s+/g, ' ').trim()
}

function getBlockSource(block: Block): string | null {
  return (
    block.properties?.source?.[0]?.[0] ??
    (block.format as any)?.display_source ??
    null
  )
}

function hasPreviewImage(
  src: string | undefined,
  recordMap: ExtendedRecordMap
): src is string {
  if (!src) return false

  return !!(
    recordMap.preview_images?.[src] ||
    recordMap.preview_images?.[normalizeUrl(src)]
  )
}

function isImageLikeUrl(url: string): boolean {
  if (
    url.startsWith('data:image/') ||
    url.includes('/image/') ||
    url.includes('image.notionusercontent.com') ||
    url.includes('secure.notion-static.com')
  ) {
    return true
  }

  try {
    const pathname = new URL(url).pathname
    const extension = pathname.split('.').pop()?.toLowerCase()
    return !!extension && imageExtensions.has(extension)
  } catch {
    return false
  }
}

function resolveVisualCandidate(
  block: Block,
  recordMap: ExtendedRecordMap,
  mapImageUrl: MapImageUrlFn,
  objectPosition: string
): ThumbnailImageCandidate | null {
  const blockTitle = getBlockPlainText(block) || 'notion image'

  if (block.type === 'image') {
    const source = getBlockSource(block)
    if (!source) return null

    const src = mapImageUrl(source, block)
    if (!src) return null

    return {
      kind: 'image',
      src,
      alt: blockTitle,
      objectPosition
    }
  }

  if (block.type === 'video') {
    const displaySource = (block.format as any)?.display_source
    if (!displaySource || !isImageLikeUrl(displaySource)) return null

    const src = mapImageUrl(displaySource, block)
    if (!src) return null

    return {
      kind: 'image',
      src,
      alt: blockTitle || 'notion video preview',
      objectPosition
    }
  }

  if (block.type === 'pdf' || block.type === 'file') {
    const source = getBlockSource(block)
    const src = source ? mapImageUrl(source, block) : null
    if (!src || !hasPreviewImage(src, recordMap)) return null

    return {
      kind: 'image',
      src,
      alt: blockTitle || 'notion file preview',
      objectPosition
    }
  }

  return null
}

function clipText(text: string, maxChars: number): string {
  const normalized = text.replaceAll(/\s+/g, ' ').trim()
  if (normalized.length <= maxChars) return normalized

  return `${normalized.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`
}

function isMetadataLikeText(text: string): boolean {
  return /^([A-Z_][A-Za-z0-9_ /&(),-]{1,28}):\s+\S/.test(text)
}

function hasReadableContent(text: string): boolean {
  return /[\p{L}\p{N}]/u.test(text)
}

function isUsefulLabel(text: string): boolean {
  return (
    text.length >= 4 && hasReadableContent(text) && !isMetadataLikeText(text)
  )
}

function isStrongBodyText(text: string): boolean {
  return (
    text.length >= 24 && hasReadableContent(text) && !isMetadataLikeText(text)
  )
}

function getMeaningfulTextParts(
  blocks: Block[],
  maxParts = 3,
  maxChars = 240
): string[] {
  const parts: string[] = []
  let totalChars = 0

  for (const block of blocks) {
    if (
      !headingBlockTypes.has(block.type) &&
      !bodyTextBlockTypes.has(block.type) &&
      block.type !== 'quote'
    ) {
      continue
    }

    const text = getBlockPlainText(block)
    if (!isStrongBodyText(text) && !isUsefulLabel(text)) continue

    const remainingChars = maxChars - totalChars
    if (remainingChars <= 0) break

    const clipped = clipText(text, Math.min(remainingChars, text.length))
    if (!clipped) continue

    parts.push(clipped)
    totalChars += clipped.length

    if (parts.length >= maxParts || totalChars >= maxChars) {
      break
    }
  }

  return parts
}

function getCalloutOrToggleTexts(
  block: Block,
  recordMap: ExtendedRecordMap
): { eyebrow?: string; body?: string } {
  const ownText = getBlockPlainText(block)
  const descendantParts = getMeaningfulTextParts(
    getLoadedDescendantBlocks(block, recordMap),
    4,
    260
  ).filter((text) => text !== ownText)

  let eyebrow: string | undefined
  let bodyParts = descendantParts

  if (!bodyParts.length && ownText) {
    const inlineCalloutMatch = ownText.match(
      /^(?:[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*)?(Executive Summary|Overview|Summary|Key Takeaways|Highlights)\s+(.*)$/u
    )

    if (inlineCalloutMatch) {
      const [, inferredEyebrow, inferredBody] = inlineCalloutMatch
      if (inferredEyebrow && isUsefulLabel(inferredEyebrow)) {
        eyebrow = inferredEyebrow
      }

      if (inferredBody && isStrongBodyText(inferredBody)) {
        bodyParts = [inferredBody]
      }
    }
  }

  if (!eyebrow && isUsefulLabel(ownText) && ownText.length <= 48) {
    eyebrow = ownText
  }

  if (
    !eyebrow &&
    descendantParts.length > 0 &&
    isUsefulLabel(descendantParts[0]!)
  ) {
    eyebrow = descendantParts[0]
    bodyParts = descendantParts.slice(1)
  }

  const body = clipText(bodyParts.join(' '), 240)
  return {
    eyebrow,
    body: isStrongBodyText(body) ? body : undefined
  }
}

function getPlainTextBody(
  blocks: Block[],
  maxParts = 2,
  maxChars = 220
): string | undefined {
  const parts = getMeaningfulTextParts(
    blocks.filter((block) => !headingBlockTypes.has(block.type)),
    maxParts,
    maxChars
  )
  if (!parts.length) return undefined

  const body = clipText(parts.join(' '), maxChars)
  return isStrongBodyText(body) ? body : undefined
}

function getHeadingText(block: Block): string | undefined {
  if (!headingBlockTypes.has(block.type)) return undefined

  const text = getBlockPlainText(block)
  return text.length >= 12 &&
    !isMetadataLikeText(text) &&
    !weakHeadingTexts.has(text.toLowerCase())
    ? clipText(text, 120)
    : undefined
}

function normalizeIcon(icon: string | null | undefined): string | undefined {
  if (!icon) return undefined
  if (icon.startsWith('/') || icon.includes('://')) return undefined
  return icon
}

function normalizeComparableText(text: string | undefined): string {
  return (text || '')
    .toLowerCase()
    .replaceAll(/[\s:;,.!?()[\]'"`+-]+/g, ' ')
    .trim()
}

function shouldSuppressTeaserTitle(
  teaserTitle: string | undefined,
  pageTitle: string | undefined
): boolean {
  const normalizedTeaserTitle = normalizeComparableText(teaserTitle)
  const normalizedPageTitle = normalizeComparableText(pageTitle)
  if (!normalizedTeaserTitle || !normalizedPageTitle) return false

  return (
    normalizedTeaserTitle === normalizedPageTitle ||
    normalizedTeaserTitle.includes(normalizedPageTitle) ||
    normalizedPageTitle.includes(normalizedTeaserTitle)
  )
}

function finalizeTeaserCandidate(
  candidate: ThumbnailTeaserCandidate
): ThumbnailTeaserCandidate {
  const normalizedEyebrow = normalizeComparableText(candidate.eyebrow)

  // Only suppress a generic eyebrow when there is no title AND no body to give it context.
  // If body text exists, even a generic label like "Executive Summary" provides useful
  // categorization for the reader and should be shown (matching Notion's reference behavior).
  if (
    !candidate.title &&
    !candidate.body &&
    genericEyebrowTexts.has(normalizedEyebrow)
  ) {
    return {
      ...candidate,
      eyebrow: undefined,
      icon: undefined
    }
  }

  return candidate
}

function buildTeaserCandidate(
  rootBlock: Block,
  recordMap: ExtendedRecordMap
): ThumbnailTeaserCandidate | null {
  const previewBlocks = getFlattenedPreviewBlocks(rootBlock, recordMap)
  if (!previewBlocks.length) return null

  const headingIndex = previewBlocks.findIndex(
    (block) => !!getHeadingText(block)
  )
  const rootPageTitle = getBlockPlainText(rootBlock)

  const extractedTitle =
    headingIndex !== -1
      ? getHeadingText(previewBlocks[headingIndex]!)
      : undefined
  const title = shouldSuppressTeaserTitle(extractedTitle, rootPageTitle)
    ? undefined
    : extractedTitle
  const searchBlocks =
    headingIndex !== -1 ? previewBlocks.slice(headingIndex + 1) : previewBlocks

  const preferredBlocks = searchBlocks.slice(0, 8)

  // When a callout has a useful label but its children aren't loaded in the
  // recordMap, save the eyebrow here so subsequent passes can still surface it
  // alongside any body text found elsewhere on the page.
  let pendingCalloutEyebrow: string | undefined
  let pendingCalloutIcon: string | undefined

  for (const block of preferredBlocks) {
    const text = getBlockPlainText(block)

    if (!text && block.type !== 'callout' && block.type !== 'quote') {
      continue
    }

    if (isMetadataLikeText(text)) {
      continue
    }

    if (block.type === 'callout' || block.type === 'toggle') {
      const teaser = getCalloutOrToggleTexts(block, recordMap)
      if (teaser.body) {
        return finalizeTeaserCandidate({
          kind: 'teaser',
          tone: block.type === 'callout' ? 'callout' : 'default',
          title,
          eyebrow: teaser.eyebrow,
          body: teaser.body,
          icon:
            block.type === 'callout'
              ? normalizeIcon(getBlockIcon(block, recordMap))
              : undefined
        })
      }

      // Callout has a useful label but body content isn't loaded yet —
      // save as context so we can pair it with nearby body text.
      if (!pendingCalloutEyebrow && teaser.eyebrow) {
        pendingCalloutEyebrow = teaser.eyebrow
        pendingCalloutIcon =
          block.type === 'callout'
            ? normalizeIcon(getBlockIcon(block, recordMap))
            : undefined
      }

      continue
    }

    if (block.type === 'quote') {
      const body = getPlainTextBody(
        [block, ...getLoadedDescendantBlocks(block, recordMap)],
        2,
        220
      )
      if (body) {
        return finalizeTeaserCandidate({
          kind: 'teaser',
          tone: 'quote',
          title,
          body
        })
      }

      continue
    }

    // A heading that is too generic to be a teaser title (e.g. "Executive
    // Summary", "Overview") can still serve as an eyebrow label when it
    // introduces a content section. Save it so we can pair it with the next
    // body text we find.
    if (
      headingBlockTypes.has(block.type) &&
      !pendingCalloutEyebrow &&
      isUsefulLabel(text)
    ) {
      const normalizedText = normalizeComparableText(text)
      if (genericEyebrowTexts.has(normalizedText)) {
        pendingCalloutEyebrow = text
      }
    }
  }

  for (const block of preferredBlocks) {
    const text = getBlockPlainText(block)

    if (!text && block.type !== 'callout' && block.type !== 'quote') {
      continue
    }

    if (isMetadataLikeText(text)) {
      continue
    }

    if (
      bodyTextBlockTypes.has(block.type) ||
      headingBlockTypes.has(block.type)
    ) {
      const body = getPlainTextBody(
        preferredBlocks.slice(preferredBlocks.indexOf(block)),
        2,
        220
      )
      if (body) {
        return finalizeTeaserCandidate({
          kind: 'teaser',
          tone: pendingCalloutEyebrow ? 'callout' : 'default',
          title,
          eyebrow: pendingCalloutEyebrow,
          icon: pendingCalloutIcon,
          body
        })
      }
    }
  }

  const body = getPlainTextBody(previewBlocks, 3, 220)
  if (body) {
    return finalizeTeaserCandidate({
      kind: 'teaser',
      tone: pendingCalloutEyebrow ? 'callout' : 'default',
      title,
      eyebrow: pendingCalloutEyebrow,
      icon: pendingCalloutIcon,
      body
    })
  }

  return null
}

export function getCollectionCardCoverCandidate({
  block,
  cover,
  recordMap,
  mapImageUrl,
  cardCoverPosition
}: {
  block: Block
  cover: CollectionCardCover
  recordMap: ExtendedRecordMap
  mapImageUrl: MapImageUrlFn
  cardCoverPosition: number
}): CollectionCardCoverCandidate | null {
  if (cover.type !== 'page_content') {
    return null
  }

  const objectPosition = `center ${cardCoverPosition}%`
  const contentBlocks = traversePageContent(block, recordMap)

  for (const contentBlock of contentBlocks) {
    const candidate = resolveVisualCandidate(
      contentBlock,
      recordMap,
      mapImageUrl,
      objectPosition
    )
    if (candidate) {
      return candidate
    }
  }

  const pageCover = (block.format as any)?.page_cover
  if (pageCover) {
    const src = mapImageUrl(pageCover, block)
    if (src) {
      return {
        kind: 'image',
        src,
        alt: getBlockPlainText(block),
        objectPosition
      }
    }
  }

  const teaserCandidate = buildTeaserCandidate(block, recordMap)
  if (teaserCandidate) {
    return teaserCandidate
  }

  return {
    kind: 'empty'
  }
}
