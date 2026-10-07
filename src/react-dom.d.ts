/**
 * react-dom ships with react-native-web but without types, and the app needs
 * one function from it: createPortal, for the web-only selection pill
 * (src/ui/exam/SelectionCapture.web.tsx).
 */
declare module 'react-dom' {
  import type { ReactNode, ReactPortal } from 'react';
  export function createPortal(children: ReactNode, container: Element | DocumentFragment, key?: string | null): ReactPortal;
}
