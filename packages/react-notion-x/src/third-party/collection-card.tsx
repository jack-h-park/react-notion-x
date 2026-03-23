import type React from 'react'
import { getTextContent } from 'notion-utils'

import { LazyImage } from '../components/lazy-image'
import { dummyLink, NotionContextProvider, useNotionContext } from '../context'
import { type CollectionCardProps } from '../types'
import { cs } from '../utils'
import { getCollectionCardCoverCandidate } from './collection-card-cover'
import { Property } from './property'

export function CollectionCard({
  collection,
  block,
  cover,
  coverSize,
  coverAspect,
  properties,
  className,
  ...rest
}: CollectionCardProps) {
  const ctx = useNotionContext()
  const {
    components,
    recordMap,
    mapPageUrl,
    mapImageUrl,
    isLinkCollectionToUrlProperty
  } = ctx
  let coverContent = null

  const { page_cover_position = 0.5, card_cover_position = 0.5 } =
    block.format || ({} as any)
  const coverPosition = (1 - page_cover_position) * 100
  const cardCoverPosition = (1 - card_cover_position) * 100

  // 1. Try to find an image cover
  if (cover?.type === 'page_content') {
    const candidate = getCollectionCardCoverCandidate({
      block,
      cover,
      recordMap,
      mapImageUrl,
      cardCoverPosition
    })

    if (candidate?.kind === 'image') {
      coverContent = (
        <LazyImage
          src={candidate.src}
          alt={candidate.alt}
          style={{
            objectFit: coverAspect,
            objectPosition: candidate.objectPosition
          }}
        />
      )
    } else if (candidate?.kind === 'teaser') {
      coverContent = (
        <div className='notion-collection-card-cover-teaser'>
          <div
            className={cs(
              'notion-collection-card-cover-teaser-panel',
              candidate.tone === 'callout' &&
                'notion-collection-card-cover-teaser-panel-callout',
              candidate.tone === 'quote' &&
                'notion-collection-card-cover-teaser-panel-quote'
            )}
          >
            {(candidate.icon || candidate.eyebrow) && (
              <div className='notion-collection-card-cover-teaser-header'>
                {candidate.icon && (
                  <div className='notion-collection-card-cover-teaser-icon'>
                    {candidate.icon}
                  </div>
                )}

                {candidate.eyebrow && (
                  <div className='notion-collection-card-cover-teaser-eyebrow'>
                    {candidate.eyebrow}
                  </div>
                )}
              </div>
            )}

            {candidate.title && (
              <div className='notion-collection-card-cover-teaser-title'>
                {candidate.title}
              </div>
            )}

            <div className='notion-collection-card-cover-teaser-body'>
              {candidate.body}
            </div>
          </div>
        </div>
      )
    } else if (candidate?.kind === 'empty') {
      coverContent = <div className='notion-collection-card-cover-empty' />
    }
  } else if (cover?.type === 'page_cover') {
    const { page_cover } = block.format || {}

    if (page_cover) {
      const coverPosition = (1 - page_cover_position) * 100

      coverContent = (
        <LazyImage
          src={mapImageUrl(page_cover, block)}
          alt={getTextContent(block.properties?.title)}
          style={{
            objectFit: coverAspect,
            objectPosition: `center ${coverPosition}%`
          }}
        />
      )
    }
  } else if (cover?.type === 'property') {
    const { property } = cover
    if (!property) return null

    const schema = collection.schema[property]
    const data = block.properties?.[property as keyof typeof block.properties]

    if (schema && data) {
      if (schema.type === 'file') {
        const files = data
          .filter((v) => v.length === 2)
          .map((f) => f.flat().flat())
        const file = files[0]

        if (file) {
          coverContent = (
            <span className={`notion-property-${schema.type}`}>
              <LazyImage
                alt={file[0] as string}
                src={mapImageUrl(file[2] as string, block)}
                style={{
                  objectFit: coverAspect,
                  objectPosition: `center ${coverPosition}%`
                }}
              />
            </span>
          )
        }
      } else {
        coverContent = (
          <Property propertyId={property} schema={schema} data={data} />
        )
      }
    }
  }

  // 2. Fallback to empty div if page_content couldn't resolve any displayable content
  if (!coverContent) {
    if (cover?.type === 'page_content') {
      coverContent = <div className='notion-collection-card-cover-empty' />
    }
  }

  let linkProperties: any[] = []
  // check if a visible property has a url and we settings are for linking to it for the card
  if (isLinkCollectionToUrlProperty && properties) {
    linkProperties = properties
      .filter(
        (p) =>
          p.visible && p.property !== 'title' && collection.schema[p.property]
      )
      .filter((p) => {
        if (!block.properties) return false
        const schema = collection.schema[p.property]

        return schema?.type === 'url'
      })
      .map((p) => {
        return block.properties?.[p.property as keyof typeof block.properties]
      })
      .filter((p) => p?.[0])
  }

  let url = null
  if (
    linkProperties &&
    linkProperties.length > 0 &&
    linkProperties[0].length > 0 &&
    linkProperties[0][0].length > 0
  ) {
    url = linkProperties[0][0][0]
  }

  const innerCard = (
    <>
      {(coverContent || cover?.type !== 'none') && (
        <div className='notion-collection-card-cover'>{coverContent}</div>
      )}

      <div className='notion-collection-card-body'>
        <div className='notion-collection-card-property'>
          <Property
            schema={collection.schema.title}
            data={block?.properties?.title}
            block={block}
            collection={collection}
          />
        </div>

        {properties
          ?.filter(
            (p) =>
              p.visible &&
              p.property !== 'title' &&
              collection.schema[p.property]
          )
          .map((p) => {
            if (!block.properties || !p.property) return null
            const schema = collection.schema[p.property]
            const data =
              block.properties[p.property as keyof typeof block.properties]

            return (
              <div className='notion-collection-card-property' key={p.property}>
                <Property
                  schema={schema}
                  data={data}
                  block={block}
                  collection={collection}
                  inline
                />
              </div>
            )
          })}
      </div>
    </>
  )

  return (
    <NotionContextProvider
      {...ctx}
      components={{
        ...ctx.components,
        // Disable <a> tabs in all child components so we don't create invalid DOM
        // trees with stacked <a> tags.
        Link: (props: any) => {
          return (
            <form action={props.href} target='_blank'>
              <input
                type='submit'
                value={props?.children?.props?.children ?? props.href}
                className='nested-form-link notion-link'
              />
            </form>
          )
        },
        PageLink: dummyLink
      }}
    >
      {isLinkCollectionToUrlProperty && url ? (
        <components.Link
          className={cs(
            'notion-collection-card',
            `notion-collection-card-size-${coverSize}`,
            className
          )}
          href={url}
          {...rest}
        >
          {innerCard}
        </components.Link>
      ) : (
        <components.PageLink
          className={cs(
            'notion-collection-card',
            `notion-collection-card-size-${coverSize}`,
            className
          )}
          href={mapPageUrl(block.id)}
          {...rest}
        >
          {innerCard}
        </components.PageLink>
      )}
    </NotionContextProvider>
  )
}
