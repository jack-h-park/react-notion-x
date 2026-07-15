import * as react_jsx_runtime from 'react/jsx-runtime';
import * as types from 'notion-types';
import { Block, Decoration, ExtendedRecordMap } from 'notion-types';
import * as React from 'react';
import React__default from 'react';
import { S as SearchNotionFn, a as NotionComponents, M as MapPageUrlFn, b as MapImageUrlFn } from './context-ClaalJT0.js';
export { C as CollectionCardCoverOverrideFn, c as CollectionCardProps, d as CollectionGroupProps, e as CollectionViewProps, f as ComponentOverrideFn, N as NotionContext, g as NotionContextConsumer, h as NotionContextProvider, P as PartialNotionContext, i as dummyLink, u as useNotionContext } from './context-ClaalJT0.js';
export { formatDate, formatNotionDateTime, isUrl } from 'notion-utils';

declare function Button({ block, blockId, className }: {
    blockId: string;
    block: types.ButtonBlock;
    className?: string;
}): react_jsx_runtime.JSX.Element | null;

declare function Header({ block }: {
    block: types.CollectionViewPageBlock | types.PageBlock;
}): react_jsx_runtime.JSX.Element;
declare function Breadcrumbs({ block, rootOnly }: {
    block: types.Block;
    rootOnly?: boolean;
}): react_jsx_runtime.JSX.Element;
declare function Search({ block, search, title }: {
    block: types.Block;
    search?: SearchNotionFn;
    title?: React__default.ReactNode;
}): react_jsx_runtime.JSX.Element;

declare function PageIconImpl({ block, className, inline, hideDefaultIcon, defaultIcon }: {
    block: Block;
    className?: string;
    inline?: boolean;
    hideDefaultIcon?: boolean;
    defaultIcon?: string | null;
}): react_jsx_runtime.JSX.Element | null;
declare const PageIcon: React__default.MemoExoticComponent<typeof PageIconImpl>;

/**
 * Renders a single piece of Notion text, including basic rich text formatting.
 *
 * These represent the innermost leaf nodes of a Notion subtree.
 *
 * TODO: I think this implementation would be more correct if the reduce just added
 * attributes to the final element's style.
 */
declare function Text({ value, block, linkProps, linkProtocol }: {
    value?: Decoration[];
    block: Block;
    linkProps?: any;
    linkProtocol?: string;
    inline?: boolean;
}): react_jsx_runtime.JSX.Element;

declare function NotionRenderer({ components, recordMap, mapPageUrl, mapImageUrl, searchNotion, isShowingSearch, onHideSearch, fullPage, rootPageId, rootDomain, darkMode, previewImages, forceCustomImages, showCollectionViewDropdown, linkTableTitleProperties, isLinkCollectionToUrlProperty, isImageZoomable, showTableOfContents, minTableOfContentsItems, defaultPageIcon, defaultPageCover, defaultPageCoverPosition, ...rest }: {
    recordMap: ExtendedRecordMap;
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
    isImageZoomable?: boolean;
    showTableOfContents?: boolean;
    minTableOfContentsItems?: number;
    defaultPageIcon?: string;
    defaultPageCover?: string;
    defaultPageCoverPosition?: number;
    className?: string;
    bodyClassName?: string;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    pageHeader?: React.ReactNode;
    pageFooter?: React.ReactNode;
    pageTitle?: React.ReactNode;
    pageAside?: React.ReactNode;
    pageCover?: React.ReactNode;
    blockId?: string;
    hideBlockId?: boolean;
    disableHeader?: boolean;
}): react_jsx_runtime.JSX.Element;

declare const cs: (...classes: Array<string | undefined | false>) => string;
declare const getHashFragmentValue: (url: string) => string;
declare const isBrowser = true;
declare const getYoutubeId: (url: string) => string | null;
declare const getUrlParams: (url: string) => Record<string, string> | undefined;

export { Breadcrumbs, Button, Header, MapImageUrlFn, MapPageUrlFn, NotionComponents, NotionRenderer, PageIcon, PageIconImpl, Search, SearchNotionFn, Text, cs, getHashFragmentValue, getUrlParams, getYoutubeId, isBrowser };
