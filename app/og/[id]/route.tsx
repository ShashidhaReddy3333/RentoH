import React from 'react';
import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import type { CSSProperties } from 'react';

import { getById } from '@/lib/data-access/properties';
import { env } from '@/lib/env';

export const runtime = 'edge';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const property = await getById(id);

    if (!property) {
      return new Response('Not found', { status: 404 });
    }

    const title = property.title ?? 'Home for rent';
    const siteName = 'Rento';

    const containerStyle: CSSProperties = {
      display: 'flex',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg,#60a5fa 0%,#34d399 100%)',
      padding: '48px',
      boxSizing: 'border-box',
      alignItems: 'center',
      justifyContent: 'flex-start',
      color: 'white',
      fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, \"Helvetica Neue\", Arial'
    };

    const maxWidthStyle: CSSProperties = {
      maxWidth: 980
    };

    const siteNameStyle: CSSProperties = {
      fontSize: 28,
      opacity: 0.95,
      marginBottom: 20
    };

    const titleStyle: CSSProperties = {
      fontSize: 56,
      fontWeight: 700,
      lineHeight: 1.05
    };

    const cityStyle: CSSProperties = {
      marginTop: 28,
      fontSize: 20,
      opacity: 0.95
    };

    return new ImageResponse(
      (
        <div style={containerStyle}>
          <div style={maxWidthStyle}>
            <div style={siteNameStyle}>{siteName}</div>
            <div style={titleStyle}>{title}</div>
            <div style={cityStyle}>{property.city ?? ''}</div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630
      }
    );
  } catch (err) {
    return new Response('Error generating image', { status: 500 });
  }
}