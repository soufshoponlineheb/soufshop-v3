import React from 'react';
import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title =
    searchParams.get('title')?.trim() ||
    'SoufShop — أفضل صفقات Amazon وNoon وTemu وClickBank';
  const price = searchParams.get('price')?.trim() || '';
  const source = searchParams.get('source')?.trim() || 'SoufShop';

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
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#115E49',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                fontWeight: 700,
                color: '#FFFFFF',
              }}
            >
              S
            </div>
            <span
              style={{
                fontSize: '30px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              SoufShop
            </span>
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
          <span>soufshop.online — Curated Global Deals</span>
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
