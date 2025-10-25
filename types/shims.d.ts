// Project-level shims to help the TypeScript language server in environments
// where node_modules resolution can be flaky in editors.

declare module "next/font/google" {
  export const Inter: any;
  export default Inter;
}

// Project-level shims to help the TypeScript language server in environments
// where node_modules resolution can be flaky in editors. Keep these minimal and
// targeted — avoid overriding 'react' itself since @types/react is included as
// a devDependency and should provide the canonical types.

declare module "next/font/google" {
  export const Inter: any;
  export default Inter;
}

declare module "next/dynamic" {
  const dynamic: any;
  export default dynamic;
}

declare module "next" {
  export type Metadata = any;
}

declare module "next/navigation" {
  // Minimal shim so TypeScript understands `notFound()` narrowings in server components
  export function notFound(): never;
}

declare module "@heroicons/react/24/outline" {
  export const ClipboardDocumentCheckIcon: any;
  export const KeyIcon: any;
  export const MagnifyingGlassIcon: any;
  export const ShieldCheckIcon: any;
  export const WifiIcon: any;
  export const SparklesIcon: any;
  export const HomeModernIcon: any;
  export const BoltIcon: any;
  export const HeartIcon: any;
  export const AdjustmentsHorizontalIcon: any;
  export const MapIcon: any;
  export const Squares2X2Icon: any;
  export const ChatBubbleLeftRightIcon: any;
  export const EnvelopeIcon: any;
  export const PhoneIcon: any;
  export const ArrowRightIcon: any;
  export const CalendarIcon: any;
  export const ChatBubbleOvalLeftEllipsisIcon: any;
  export const ClipboardDocumentListIcon: any;
  export const MagnifyingGlassCircleIcon: any;
  export const MapPinIcon: any;
  export default any;
}

declare module "@heroicons/react/24/solid" {
  export const MapPinIcon: any;
  export const ShieldCheckIcon: any;
  export const HeartIcon: any;
  export const SparklesIcon: any;
  export default any;
}

// Allow JSX intrinsic elements in environments where the editor hasn't picked up
// the React JSX typings yet. This is intentionally permissive and temporary —
// once editor resolution works, prefer removing this shim.
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
  export const SparklesIcon: any;
