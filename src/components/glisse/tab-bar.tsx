"use client";

import type { ElementType, HTMLAttributes, JSX, ReactNode } from "react";

import { Segments } from "./internal/segments";

export interface TabBarItem {
  value: string;
  label: ReactNode;
  /** An icon drawn above the label, as in an iOS tab bar. */
  icon?: ReactNode;
  /** Renders the tab as a link. Clicking it navigates; the bar still tracks selection. */
  href?: string;
}

export interface TabBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  items: TabBarItem[];
  /** The selected tab's `value`, or `null` for none. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  /** The component used for tabs with an `href`, such as Next.js's `Link`. */
  link?: ElementType;
}

/**
 * A row of tabs on glass, as iOS 26's tab bar: the selection springs between
 * them, follows a drag, and lifts into a lens while held. Tabs with an `href`
 * are links, and the bar is then navigation.
 */
export function TabBar(props: TabBarProps): JSX.Element {
  return <Segments kind="tab-bar" {...props} />;
}
