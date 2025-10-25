import type { CSSProperties } from 'react';

export const containerStyles: CSSProperties = {
  display: 'flex',
  width: '100%',
  height: '100%',
  background: 'linear-gradient(90deg,#60a5fa 0%,#34d399 100%)',
  padding: '48px',
  boxSizing: 'border-box',
  alignItems: 'center',
  justifyContent: 'flex-start',
  color: 'white',
  fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial'
};

export const contentStyles: CSSProperties = {
  maxWidth: 980
};

export const titleStyles: CSSProperties = {
  fontSize: 28,
  opacity: 0.95,
  marginBottom: 20
};

export const headingStyles: CSSProperties = {
  fontSize: 56,
  fontWeight: 700,
  lineHeight: 1.05
};

export const subheadingStyles: CSSProperties = {
  marginTop: 28,
  fontSize: 20,
  opacity: 0.95
};