import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  active: boolean;
};

/** Renders print-only content at document body (hidden on screen, full page when printing). */
export default function PrintSheet({ children, active }: Props) {
  if (!active) return null;

  return createPortal(
    <div id="health-care-print-root">{children}</div>,
    document.body
  );
}
