import type { ComponentProps, ComponentType, SVGProps } from "react";

import {
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  HomeModernIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SunIcon,
  UserCircleIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { HeartIcon as HeartIconOutline } from "@heroicons/react/24/outline";
import clsx from "clsx";

export type IconName =
  | "chat"
  | "discover"
  | "heart"
  | "home"
  | "manage"
  | "moon"
  | "profile"
  | "sparkles"
  | "sun"
  | "verify";

type IconVariant = "outline" | "solid";

type IconProps = {
  name: IconName;
  variant?: IconVariant;
  className?: string;
  ariaLabel?: string;
} & Omit<ComponentProps<"svg">, "className" | "aria-label">;

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const ICONS: Record<IconName, { outline: IconComponent; solid: IconComponent }> = {
  chat: {
    outline: ChatBubbleLeftRightIcon,
    solid: ChatBubbleLeftRightIcon
  },
  discover: {
    outline: MagnifyingGlassIcon,
    solid: MagnifyingGlassIcon
  },
  heart: {
    outline: HeartIconOutline,
    solid: HeartIconSolid
  },
  home: {
    outline: HomeModernIcon,
    solid: HomeModernIcon
  },
  manage: {
    outline: ClipboardDocumentCheckIcon,
    solid: ClipboardDocumentCheckIcon
  },
  moon: {
    outline: MoonIcon,
    solid: MoonIcon
  },
  profile: {
    outline: UserCircleIcon,
    solid: UserCircleIcon
  },
  sparkles: {
    outline: SparklesIcon,
    solid: SparklesIcon
  },
  sun: {
    outline: SunIcon,
    solid: SunIcon
  },
  verify: {
    outline: ShieldCheckIcon,
    solid: ShieldCheckIcon
  }
};

export function Icon({ name, variant = "outline", className, ariaLabel, ...props }: IconProps) {
  const iconSet = ICONS[name];
  if (!iconSet) {
    return null;
  }

  const Component = iconSet[variant] ?? iconSet.outline;
  const accessibilityProps = ariaLabel
    ? { role: "img", "aria-label": ariaLabel }
    : { "aria-hidden": true };

  return (
    <Component
      {...accessibilityProps}
      {...props}
      className={clsx("h-6 w-6", className)}
    />
  );
}
