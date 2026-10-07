import React from 'react';
import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title =
    searchParams.get('title')?.trim() ||
    'AQURIVO — أفضل صفقات Amazon وNoon وTemu وClickBank';
  const price = searchParams.get('price')?.trim() || '';
  const source = searchParams.get('source')?.trim() || 'AQURIVO';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          backgroundColor: '#101816',
          backgroundImage:
            'radial-gradient(circle at 85% 20%, rgba(17, 94, 73, 0.45), transparent 55%)',
          color: '#F7F6F2',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Brand Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                backgroundColor: '#0d1117',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="56"
                height="56"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="32" height="32" rx="6" fill="#0d1117" />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M4.5 27.5L12.1 6.4C12.9 4.2 14.3 3.5 16 3.5C17.7 3.5 19.1 4.2 19.9 6.4L27.5 27.5H22.6L17.4 12.1C17.0 10.9 16.5 10.5 16 10.5C15.5 10.5 15.0 10.9 14.6 12.1L9.4 27.5H4.5Z"
                  fill="#F9FAFB"
                />
                <path d="M16 3.5L17.6 7.5L16 9.2L14.4 7.5L16 3.5Z" fill="#2DD4BF" />
                <path d="M16 14.5L20.8 20.5L16 26.5L11.2 20.5L16 14.5Z" fill="#2DD4BF" />
              </svg>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '30px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#FFFFFF',
              }}
            >
              AQURIVO
            </div>
          </div>

          <div
            style={{
              padding: '8px 20px',
              borderRadius: '999px',
              backgroundColor: '#115E49',
              color: '#FFFFFF',
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            {source}
          </div>
        </div>

        {/* Center Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            maxWidth: '1000px',
          }}
        >
          <div
            style={{
              fontSize: '52px',
              fontWeight: 700,
              lineHeight: 1.2,
              color: '#FFFFFF',
            }}
          >
            {title.length > 90 ? `${title.slice(0, 87)}...` : title}
          </div>

          {price ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <span
                style={{
                  padding: '10px 26px',
                  borderRadius: '12px',
                  backgroundColor: '#C87D28',
                  color: '#FFFFFF',
                  fontSize: '32px',
                  fontWeight: 700,
                }}
              >
                {price}
              </span>
            </div>
          ) : (
            <div
              style={{
                fontSize: '24px',
                color: '#C7D1CE',
              }}
            >
              Amazon · Noon · Temu · ClickBank
            </div>
          )}
        </div>

        {/* Bottom Footer Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.16)',
            paddingTop: '24px',
            fontSize: '20px',
            color: '#9BA8A4',
          }}
        >
          <span>aqurivo.store — Curated Global Deals</span>
          <span>مراجعات مستقلة وروابط شراء مباشرة</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
