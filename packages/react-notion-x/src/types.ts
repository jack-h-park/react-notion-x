import type * as types from 'notion-types'
import type React from 'react'

export type MapPageUrlFn = (
  pageId: string,
  recordMap?: types.ExtendedRecordMap | undefined
) => string
export type MapImageUrlFn = (
  url: string | undefined,
  block: types.Block
) => string | undefined
export type SearchNotionFn = (
  params: types.SearchParams
) => Promise<types.SearchResults>

export type ComponentOverrideFn = (
  props: any,
  defaultValueFn: () => React.ReactNode
) => any

/**
 * Lets a host app take over what a gallery collection card renders inside its
 * cover area (e.g. a text "teaser" thumbnail for pages with no image). The
 * library calls this override (when provided) with the raw card context and its
 * own default cover node, and renders whatever the override returns. Return
 * `defaultCover()` to keep the built-in behavior for a given card.
 */
export type CollectionCardCoverOverrideFn = (
  props: {
    block: types.PageBlock
    cover: types.CollectionCardCover
    coverSize: types.CollectionCardCoverSize
    coverAspect: types.CollectionCardCoverAspect
    recordMap: types.ExtendedRecordMap
    mapImageUrl: MapImageUrlFn
    coverPosition: number
  },
  defaultCover: () => React.ReactNode
) => React.ReactNode

export interface NotionComponents {
  // TODO: better typing for arbitrary react components
  Image: any
  Link: any
  PageLink: any
  Checkbox: React.FC<{ isChecked: boolean; blockId?: string }>

  // blocks
  Code: any
  Equation: any
  Callout?: any
  Button?: React.ComponentType<{
    blockId: string
    block: types.ButtonBlock
    className?: string
  }>

  // collection
  Collection: any
  Property?: any

  /** Optional override for gallery collection-card cover rendering. */
  collectionCardCover?: CollectionCardCoverOverrideFn

  propertyTextValue: ComponentOverrideFn
  propertySelectValue: ComponentOverrideFn
  propertyRelationValue: ComponentOverrideFn
  propertyFormulaValue: ComponentOverrideFn
  propertyTitleValue: ComponentOverrideFn
  propertyPersonValue: ComponentOverrideFn
  propertyFileValue: ComponentOverrideFn
  propertyCheckboxValue: ComponentOverrideFn
  propertyUrlValue: ComponentOverrideFn
  propertyEmailValue: ComponentOverrideFn
  propertyPhoneNumberValue: ComponentOverrideFn
  propertyNumberValue: ComponentOverrideFn
  propertyLastEditedTimeValue: ComponentOverrideFn
  propertyCreatedTimeValue: ComponentOverrideFn
  propertyDateValue: ComponentOverrideFn
  propertyAutoIncrementIdValue: ComponentOverrideFn

  // assets
  Pdf: any
  Tweet: any
  Modal: any
  Embed: any

  // page navigation
  Header: any

  // optional next.js-specific overrides
  nextImage?: any
  nextLegacyImage?: any
  nextLink?: any
}

export interface CollectionViewProps {
  collection: types.Collection
  collectionView: types.CollectionView
  collectionData: types.CollectionQueryResult
  padding?: number
  width?: number
}

export interface CollectionCardProps {
  collection: types.Collection
  block: types.PageBlock
  cover: types.CollectionCardCover
  coverSize: types.CollectionCardCoverSize
  coverAspect: types.CollectionCardCoverAspect
  properties?: Array<{
    property: types.PropertyID
    visible: boolean
  }>
  className?: string
}
export interface CollectionGroupProps {
  collection: types.Collection
  collectionViewComponent: React.ElementType
  collectionGroup: any
  hidden: boolean
  schema: any
  value: any
  summaryProps: any
  detailsProps: any
}
