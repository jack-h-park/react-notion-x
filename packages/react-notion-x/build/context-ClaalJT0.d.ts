import * as react_jsx_runtime from 'react/jsx-runtime';
import * as types from 'notion-types';
import { ExtendedRecordMap } from 'notion-types';
import React__default from 'react';

type MapPageUrlFn = (pageId: string, recordMap?: types.ExtendedRecordMap | undefined) => string;
type MapImageUrlFn = (url: string | undefined, block: types.Block) => string | undefined;
type SearchNotionFn = (params: types.SearchParams) => Promise<types.SearchResults>;
type ComponentOverrideFn = (props: any, defaultValueFn: () => React__default.ReactNode) => any;
/**
 * Lets a host app take over what a gallery collection card renders inside its
 * cover area (e.g. a text "teaser" thumbnail for pages with no image). The
 * library calls this override (when provided) with the raw card context and its
 * own default cover node, and renders whatever the override returns. Return
 * `defaultCover()` to keep the built-in behavior for a given card.
 */
type CollectionCardCoverOverrideFn = (props: {
    block: types.PageBlock;
    cover: types.CollectionCardCover;
    coverSize: types.CollectionCardCoverSize;
    coverAspect: types.CollectionCardCoverAspect;
    recordMap: types.ExtendedRecordMap;
    mapImageUrl: MapImageUrlFn;
    coverPosition: number;
}, defaultCover: () => React__default.ReactNode) => React__default.ReactNode;
interface NotionComponents {
    Image: any;
    Link: any;
    PageLink: any;
    Checkbox: React__default.FC<{
        isChecked: boolean;
        blockId?: string;
    }>;
    Code: any;
    Equation: any;
    Callout?: any;
    Button?: React__default.ComponentType<{
        blockId: string;
        block: types.ButtonBlock;
        className?: string;
    }>;
    Collection: any;
    Property?: any;
    /** Optional override for gallery collection-card cover rendering. */
    collectionCardCover?: CollectionCardCoverOverrideFn;
    propertyTextValue: ComponentOverrideFn;
    propertySelectValue: ComponentOverrideFn;
    propertyRelationValue: ComponentOverrideFn;
    propertyFormulaValue: ComponentOverrideFn;
    propertyTitleValue: ComponentOverrideFn;
    propertyPersonValue: ComponentOverrideFn;
    propertyFileValue: ComponentOverrideFn;
    propertyCheckboxValue: ComponentOverrideFn;
    propertyUrlValue: ComponentOverrideFn;
    propertyEmailValue: ComponentOverrideFn;
    propertyPhoneNumberValue: ComponentOverrideFn;
    propertyNumberValue: ComponentOverrideFn;
    propertyLastEditedTimeValue: ComponentOverrideFn;
    propertyCreatedTimeValue: ComponentOverrideFn;
    propertyDateValue: ComponentOverrideFn;
    propertyAutoIncrementIdValue: ComponentOverrideFn;
    Pdf: any;
    Tweet: any;
    Modal: any;
    Embed: any;
    Header: any;
    nextImage?: any;
    nextLegacyImage?: any;
    nextLink?: any;
}
interface CollectionViewProps {
    collection: types.Collection;
    collectionView: types.CollectionView;
    collectionData: types.CollectionQueryResult;
    padding?: number;
    width?: number;
}
interface CollectionCardProps {
    collection: types.Collection;
    block: types.PageBlock;
    cover: types.CollectionCardCover;
    coverSize: types.CollectionCardCoverSize;
    coverAspect: types.CollectionCardCoverAspect;
    properties?: Array<{
        property: types.PropertyID;
        visible: boolean;
    }>;
    className?: string;
}
interface CollectionGroupProps {
    collection: types.Collection;
    collectionViewComponent: React__default.ElementType;
    collectionGroup: any;
    hidden: boolean;
    schema: any;
    value: any;
    summaryProps: any;
    detailsProps: any;
}

interface NotionContext {
    recordMap: ExtendedRecordMap;
    components: NotionComponents;
    mapPageUrl: MapPageUrlFn;
    mapImageUrl: MapImageUrlFn;
    searchNotion?: SearchNotionFn;
    isShowingSearch?: boolean;
    onHideSearch?: () => void;
    rootPageId?: string;
    rootDomain?: string;
    fullPage: boolean;
    darkMode: boolean;
    previewImages: boolean;
    forceCustomImages: boolean;
    showCollectionViewDropdown: boolean;
    showTableOfContents: boolean;
    minTableOfContentsItems: number;
    linkTableTitleProperties: boolean;
    isLinkCollectionToUrlProperty: boolean;
    defaultPageIcon?: string | null;
    defaultPageCover?: string | null;
    defaultPageCoverPosition?: number;
    zoom: any;
}
interface PartialNotionContext {
    recordMap?: ExtendedRecordMap;
    components?: Partial<NotionComponents>;
    mapPageUrl?: MapPageUrlFn;
    mapImageUrl?: MapImageUrlFn;
    searchNotion?: SearchNotionFn;
    isShowingSearch?: boolean;
    onHideSearch?: () => void;
    rootPageId?: string;
    rootDomain?: string;
    fullPage?: boolean;
    darkMode?: boolean;
    previewImages?: boolean;
    forceCustomImages?: boolean;
    showCollectionViewDropdown?: boolean;
    linkTableTitleProperties?: boolean;
    isLinkCollectionToUrlProperty?: boolean;
    showTableOfContents?: boolean;
    minTableOfContentsItems?: number;
    defaultPageIcon?: string | null;
    defaultPageCover?: string | null;
    defaultPageCoverPosition?: number;
    zoom?: any;
}
declare function dummyLink({ href, rel, target, title, ...rest }: any): react_jsx_runtime.JSX.Element;
declare function NotionContextProvider({ components: themeComponents, children, mapPageUrl, mapImageUrl, rootPageId, ...rest }: PartialNotionContext & {
    children?: React__default.ReactNode;
}): react_jsx_runtime.JSX.Element;
declare const NotionContextConsumer: React__default.Consumer<NotionContext>;
declare const useNotionContext: () => NotionContext;

export { type CollectionCardCoverOverrideFn as C, type MapPageUrlFn as M, type NotionContext as N, type PartialNotionContext as P, type SearchNotionFn as S, type NotionComponents as a, type MapImageUrlFn as b, type CollectionCardProps as c, type CollectionGroupProps as d, type CollectionViewProps as e, type ComponentOverrideFn as f, NotionContextConsumer as g, NotionContextProvider as h, dummyLink as i, useNotionContext as u };
