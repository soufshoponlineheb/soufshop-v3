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
                borderRadius: '14px',
                background:
                  'linear-gradient(135deg, #125E4A 0%, #093429 52%, #041913 100%)',
                border: '1.5px solid rgba(251, 191, 36, 0.48)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="46"
                height="46"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.2 14.8C11.8 15.8 14.0 17.6 15.4 20.2L21.8 36.2C13.8 33.8 8.6 25.2 9.2 14.8Z"
                  fill="#FBBF24"
                />
                <path
                  d="M38.8 14.8C36.2 15.8 34.0 17.6 32.6 20.2L26.2 36.2C34.2 33.8 39.4 25.2 38.8 14.8Z"
                  fill="#F59E0B"
                />
                <path
                  d="M16.5 39.4L24 37.8L31.5 39.4L24 41.0L16.5 39.4Z"
                  fill="#FBBF24"
                />
                <path d="M24 7.5L17.8 18.5H24V7.5Z" fill="#FFFFFF" />
                <path d="M24 7.5L30.2 18.5H24V7.5Z" fill="#CCFBF1" />
                <path d="M17.8 18.5L24 33.8V18.5H17.8Z" fill="#E6F4F1" />
                <path d="M30.2 18.5L24 33.8V18.5H30.2Z" fill="#5EEAD4" />
                <path
                  d="M24 14.6L25.05 17.45L27.9 18.5L25.05 19.55L24 22.4L22.95 19.55L20.1 18.5L22.95 17.45L24 14.6Z"
                  fill="#F59E0B"
                />
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
