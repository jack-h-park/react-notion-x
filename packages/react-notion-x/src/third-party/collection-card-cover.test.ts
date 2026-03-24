import { describe, expect, test } from 'vitest'

import { getCollectionCardCoverCandidate } from './collection-card-cover'

function createRecordMap(blocks: any, previewImages?: Record<string, any>) {
  return {
    block: Object.fromEntries(
      Object.entries(blocks).map(([id, value]) => [id, { value }])
    ),
    preview_images: previewImages ?? {}
  } as any
}

const pageContentCover = { type: 'page_content' } as const
const mapImageUrl = (url?: string) => url

describe('getCollectionCardCoverCandidate', () => {
  test('selects a direct top-level image', () => {
    const recordMap = createRecordMap({
      page: {
        id: 'page',
        type: 'page',
        content: ['image-1']
      },
      'image-1': {
        id: 'image-1',
        type: 'image',
        properties: {
          source: [['https://cdn.example.com/direct-image.png']]
        }
      }
    })

    const candidate = getCollectionCardCoverCandidate({
      block: recordMap.block.page.value,
      cover: pageContentCover,
      recordMap,
      mapImageUrl,
      cardCoverPosition: 50
    })

    expect(candidate).toMatchObject({
      kind: 'image',
      src: 'https://cdn.example.com/direct-image.png'
    })
  })

  test('selects a nested image inside transparent container blocks', () => {
    const recordMap = createRecordMap({
      page: {
        id: 'page',
        type: 'page',
        content: ['column-list']
      },
      'column-list': {
        id: 'column-list',
        type: 'column_list',
        content: ['column-a']
      },
      'column-a': {
        id: 'column-a',
        type: 'column',
        content: ['toggle-1']
      },
      'toggle-1': {
        id: 'toggle-1',
        type: 'toggle',
        properties: {
          title: [['Executive Summary']]
        },
        content: ['image-1']
      },
      'image-1': {
        id: 'image-1',
        type: 'image',
        properties: {
          source: [['https://cdn.example.com/nested-image.png']]
        }
      }
    })

    const candidate = getCollectionCardCoverCandidate({
      block: recordMap.block.page.value,
      cover: pageContentCover,
      recordMap,
      mapImageUrl,
      cardCoverPosition: 25
    })

    expect(candidate).toMatchObject({
      kind: 'image',
      src: 'https://cdn.example.com/nested-image.png',
      objectPosition: 'center 25%'
    })
  })

  test('extracts a project 2a style teaser from heading plus executive summary callout', () => {
    const recordMap = createRecordMap({
      page: {
        id: 'page',
        type: 'page',
        content: ['meta-1', 'header-1', 'callout-1']
      },
      'meta-1': {
        id: 'meta-1',
        type: 'text',
        properties: {
          title: [['Type: Personal Learning & Demo (Non-Commercial)']]
        }
      },
      'header-1': {
        id: 'header-1',
        type: 'header',
        properties: {
          title: [
            [
              'Conversational AI System (LangChain Orchestration + Shared Guardrails + Admin UI)'
            ]
          ]
        }
      },
      'callout-1': {
        id: 'callout-1',
        type: 'callout',
        format: {
          page_icon: '👉'
        },
        properties: {
          title: [['Executive Summary']]
        },
        content: ['callout-body-1']
      },
      'callout-body-1': {
        id: 'callout-body-1',
        type: 'text',
        properties: {
          title: [
            [
              'This project describes a production-grade personal AI chat assistant designed to answer questions about my background, projects, and writing with predictable behavior.'
            ]
          ]
        }
      }
    })

    const candidate = getCollectionCardCoverCandidate({
      block: recordMap.block.page.value,
      cover: pageContentCover,
      recordMap,
      mapImageUrl,
      cardCoverPosition: 50
    })

    expect(candidate).toEqual({
      kind: 'teaser',
      tone: 'callout',
      title:
        'Conversational AI System (LangChain Orchestration + Shared Guardrails + Admin UI)',
      eyebrow: 'Executive Summary',
      body: 'This project describes a production-grade personal AI chat assistant designed to answer questions about my background, projects, and writing with predictable behavior.',
      icon: '👉'
    })
  })

  test('ignores top metadata and uses heading plus paragraph for plain text pages', () => {
    const recordMap = createRecordMap({
      page: {
        id: 'page',
        type: 'page',
        content: ['meta-1', 'header-1', 'text-1']
      },
      'meta-1': {
        id: 'meta-1',
        type: 'text',
        properties: {
          title: [['Type: Personal Learning & Demo (Non-Commercial)']]
        }
      },
      'header-1': {
        id: 'header-1',
        type: 'header',
        properties: {
          title: [['Designing a Knowledge Backbone on Real Portfolio Content']]
        }
      },
      'text-1': {
        id: 'text-1',
        type: 'text',
        properties: {
          title: [
            [
              'As large language models become more capable, a recurring failure mode becomes more visible.'
            ]
          ]
        }
      }
    })

    const candidate = getCollectionCardCoverCandidate({
      block: recordMap.block.page.value,
      cover: pageContentCover,
      recordMap,
      mapImageUrl,
      cardCoverPosition: 50
    })

    expect(candidate).toEqual({
      kind: 'teaser',
      tone: 'default',
      title: 'Designing a Knowledge Backbone on Real Portfolio Content',
      body: 'As large language models become more capable, a recurring failure mode becomes more visible.'
    })
  })

  test('shows callout eyebrow with body when no distinct teaser title exists', () => {
    const recordMap = createRecordMap({
      page: {
        id: 'page',
        type: 'page',
        content: ['callout-1']
      },
      'callout-1': {
        id: 'callout-1',
        type: 'callout',
        content: ['callout-title-1', 'callout-body-1']
      },
      'callout-title-1': {
        id: 'callout-title-1',
        type: 'text',
        properties: {
          title: [['Executive Summary']]
        }
      },
      'callout-body-1': {
        id: 'callout-body-1',
        type: 'text',
        properties: {
          title: [['This callout stores its visible content in child blocks.']]
        }
      }
    })

    const candidate = getCollectionCardCoverCandidate({
      block: recordMap.block.page.value,
      cover: pageContentCover,
      recordMap,
      mapImageUrl,
      cardCoverPosition: 50
    })

    expect(candidate).toEqual({
      kind: 'teaser',
      tone: 'callout',
      eyebrow: 'Executive Summary',
      icon: undefined,
      title: undefined,
      body: 'This callout stores its visible content in child blocks.'
    })
  })

  test('pairs callout eyebrow with page body text when callout children are not loaded', () => {
    // Simulates a gallery card where the page has a top-level paragraph and a
    // callout labeled "Executive Summary" whose children are not yet in the
    // recordMap (common in collection views that do not deep-load nested blocks).
    const recordMap = createRecordMap({
      page: {
        id: 'page',
        type: 'page',
        content: ['text-1', 'callout-1']
      },
      'text-1': {
        id: 'text-1',
        type: 'text',
        properties: {
          title: [
            [
              'As a product manager, I wanted to build and operate a personal AI assistant that can reliably answer questions.'
            ]
          ]
        }
      },
      'callout-1': {
        id: 'callout-1',
        type: 'callout',
        properties: {
          title: [['Executive Summary']]
        }
        // No content/children in recordMap — simulates shallow collection fetch
      }
    })

    const candidate = getCollectionCardCoverCandidate({
      block: recordMap.block.page.value,
      cover: pageContentCover,
      recordMap,
      mapImageUrl,
      cardCoverPosition: 50
    })

    expect(candidate).toEqual({
      kind: 'teaser',
      tone: 'callout',
      eyebrow: 'Executive Summary',
      icon: undefined,
      title: undefined,
      body: 'As a product manager, I wanted to build and operate a personal AI assistant that can reliably answer questions.'
    })
  })

  test('uses generic section heading as eyebrow when followed by body text', () => {
    // Simulates a page where "Executive Summary" is a heading block (not a
    // callout) followed by body text. The heading is too generic to be a title
    // but should surface as an eyebrow label in the teaser thumbnail.
    const recordMap = createRecordMap({
      page: {
        id: 'page',
        type: 'page',
        content: ['heading-es', 'text-1']
      },
      'heading-es': {
        id: 'heading-es',
        type: 'sub_header',
        properties: {
          title: [['Executive Summary']]
        }
      },
      'text-1': {
        id: 'text-1',
        type: 'text',
        properties: {
          title: [
            [
              'This project focuses on designing a Retrieval-Augmented Generation system that serves as the knowledge backbone for the portfolio.'
            ]
          ]
        }
      }
    })

    const candidate = getCollectionCardCoverCandidate({
      block: recordMap.block.page.value,
      cover: pageContentCover,
      recordMap,
      mapImageUrl,
      cardCoverPosition: 50
    })

    expect(candidate).toEqual({
      kind: 'teaser',
      tone: 'callout',
      eyebrow: 'Executive Summary',
      title: undefined,
      body: 'This project focuses on designing a Retrieval-Augmented Generation system that serves as the knowledge backbone for the portfolio.'
    })
  })

  test('supports inline callout text stored in a single title field', () => {
    const recordMap = createRecordMap({
      page: {
        id: 'page',
        type: 'page',
        content: ['header-1', 'callout-1', 'text-1']
      },
      'header-1': {
        id: 'header-1',
        type: 'header',
        properties: {
          title: [['Conversational AI System']]
        }
      },
      'callout-1': {
        id: 'callout-1',
        type: 'callout',
        properties: {
          title: [
            [
              'Executive Summary This project describes a production-grade personal AI chat assistant designed to answer questions about my background and writing with predictable behavior.'
            ]
          ]
        }
      },
      'text-1': {
        id: 'text-1',
        type: 'text',
        properties: {
          title: [
            [
              'This later paragraph should not replace the inline callout summary.'
            ]
          ]
        }
      }
    })

    const candidate = getCollectionCardCoverCandidate({
      block: recordMap.block.page.value,
      cover: pageContentCover,
      recordMap,
      mapImageUrl,
      cardCoverPosition: 50
    })

    expect(candidate).toEqual({
      kind: 'teaser',
      tone: 'callout',
      title: 'Conversational AI System',
      eyebrow: 'Executive Summary',
      body: 'This project describes a production-grade personal AI chat assistant designed to answer questions about my background and writing with predictable behavior.'
    })
  })

  test('does not surface generic objective headings as the teaser title', () => {
    const recordMap = createRecordMap({
      page: {
        id: 'page',
        type: 'page',
        content: ['title-section-1', 'objective-1', 'text-1']
      },
      'title-section-1': {
        id: 'title-section-1',
        type: 'header',
        properties: {
          title: [['Designing the Nervous System of an AI Platform']]
        }
      },
      'objective-1': {
        id: 'objective-1',
        type: 'sub_header',
        properties: {
          title: [['Objective']]
        }
      },
      'text-1': {
        id: 'text-1',
        type: 'text',
        properties: {
          title: [
            [
              'As AI systems move from demos to real products, a new class of problems emerges.'
            ]
          ]
        }
      }
    })

    const candidate = getCollectionCardCoverCandidate({
      block: recordMap.block.page.value,
      cover: pageContentCover,
      recordMap,
      mapImageUrl,
      cardCoverPosition: 50
    })

    expect(candidate).toEqual({
      kind: 'teaser',
      tone: 'default',
      title: 'Designing the Nervous System of an AI Platform',
      body: 'As AI systems move from demos to real products, a new class of problems emerges.'
    })
  })

  test('suppresses teaser title when it duplicates the page title', () => {
    const recordMap = createRecordMap({
      page: {
        id: 'page',
        type: 'page',
        properties: {
          title: [
            [
              'Why Jobs to Be Done (JTBD) is so powerful for product conceptual modeling'
            ]
          ]
        },
        content: ['header-1', 'text-1']
      },
      'header-1': {
        id: 'header-1',
        type: 'header',
        properties: {
          title: [
            [
              'Why Jobs to Be Done (JTBD) is so powerful for product conceptual modeling'
            ]
          ]
        }
      },
      'text-1': {
        id: 'text-1',
        type: 'text',
        properties: {
          title: [
            [
              'At its core, JTBD reminds us of a simple truth: customers do not buy features, they hire products to get a job done.'
            ]
          ]
        }
      }
    })

    const candidate = getCollectionCardCoverCandidate({
      block: recordMap.block.page.value,
      cover: pageContentCover,
      recordMap,
      mapImageUrl,
      cardCoverPosition: 50
    })

    expect(candidate).toEqual({
      kind: 'teaser',
      tone: 'default',
      body: 'At its core, JTBD reminds us of a simple truth: customers do not buy features, they hire products to get a job done.'
    })
  })

  test('falls back to a quote teaser when quote is the first meaningful block', () => {
    const recordMap = createRecordMap({
      page: {
        id: 'page',
        type: 'page',
        content: ['quote-1']
      },
      'quote-1': {
        id: 'quote-1',
        type: 'quote',
        properties: {
          title: [
            [
              'The system should stay useful without turning itself into a playground.'
            ]
          ]
        }
      }
    })

    const candidate = getCollectionCardCoverCandidate({
      block: recordMap.block.page.value,
      cover: pageContentCover,
      recordMap,
      mapImageUrl,
      cardCoverPosition: 50
    })

    expect(candidate).toEqual({
      kind: 'teaser',
      tone: 'quote',
      body: 'The system should stay useful without turning itself into a playground.'
    })
  })

  test('falls back to empty when only weak text exists', () => {
    const recordMap = createRecordMap({
      page: {
        id: 'page',
        type: 'page',
        content: ['header-1', 'divider-1']
      },
      'header-1': {
        id: 'header-1',
        type: 'header',
        properties: {
          title: [['Intro']]
        }
      },
      'divider-1': {
        id: 'divider-1',
        type: 'divider'
      }
    })

    const candidate = getCollectionCardCoverCandidate({
      block: recordMap.block.page.value,
      cover: pageContentCover,
      recordMap,
      mapImageUrl,
      cardCoverPosition: 50
    })

    expect(candidate).toEqual({ kind: 'empty' })
  })

  test('does not let a bookmark card dominate the preview on its own', () => {
    const recordMap = createRecordMap({
      page: {
        id: 'page',
        type: 'page',
        content: ['bookmark-1']
      },
      'bookmark-1': {
        id: 'bookmark-1',
        type: 'bookmark',
        properties: {
          link: [['https://example.com']],
          title: [['Assistant Demo']],
          description: [['A preview card']]
        },
        format: {
          bookmark_cover: 'https://cdn.example.com/bookmark-preview.png'
        }
      }
    })

    const candidate = getCollectionCardCoverCandidate({
      block: recordMap.block.page.value,
      cover: pageContentCover,
      recordMap,
      mapImageUrl,
      cardCoverPosition: 50
    })

    expect(candidate).toEqual({ kind: 'empty' })
  })

  test('uses previewable file blocks before teaser fallback', () => {
    const fileUrl = 'https://cdn.example.com/previewable.pdf'
    const recordMap = createRecordMap(
      {
        page: {
          id: 'page',
          type: 'page',
          content: ['file-1', 'text-1']
        },
        'file-1': {
          id: 'file-1',
          type: 'file',
          properties: {
            source: [[fileUrl]]
          }
        },
        'text-1': {
          id: 'text-1',
          type: 'text',
          properties: {
            title: [['This text should not win when the file is previewable.']]
          }
        }
      },
      {
        [fileUrl]: {
          originalWidth: 1200,
          originalHeight: 800,
          dataURIBase64: 'data:image/png;base64,abc'
        }
      }
    )

    const candidate = getCollectionCardCoverCandidate({
      block: recordMap.block.page.value,
      cover: pageContentCover,
      recordMap,
      mapImageUrl,
      cardCoverPosition: 50
    })

    expect(candidate).toMatchObject({
      kind: 'image',
      src: fileUrl
    })
  })
})
