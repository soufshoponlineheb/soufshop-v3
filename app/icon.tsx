import { ImageResponse } from 'next/og';

export const size = {
  width: 96,
  height: 96,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 96,
          height: 96,
          background:
            'linear-gradient(135deg, #0D382B 0%, #115E49 55%, #09221A 100%)',
          borderRadius: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          border: '2px solid rgba(45, 212, 191, 0.35)',
        }}
      >
        <svg
          width="82"
          height="82"
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Upper Turquoise Ribbon of S */}
          <path
            d="M29.5 11.5H17.2C13.7758 11.5 11 14.2758 11 17.7C11 20.65 13.06 23.12 15.85 23.75L21.5 22L17.4 18.8C16.55 18.45 16.1 17.6 16.4 16.75C16.65 16.05 17.32 15.6 18.1 15.6H26.8L29.5 11.5Z"
            fill="#2DD4BF"
          />
          {/* Lower Crisp White Ribbon of S */}
          <path
            d="M14.5 32.5H26.8C30.2242 32.5 33 29.7242 33 26.3C33 23.35 30.94 20.88 28.15 20.25L22.5 22L26.6 25.2C27.45 25.55 27.9 26.4 27.6 27.25C27.35 27.95 26.68 28.4 25.9 28.4H17.2L14.5 32.5Z"
            fill="#FFFFFF"
          />
          {/* Central 4-Pointed Saharan Gold Curation Star */}
          <path
            d="M22 16.6L23.55 20.45L27.4 22L23.55 23.55L22 27.4L20.45 23.55L16.6 22L20.45 20.45L22 16.6Z"
            fill="#FBBF24"
          />
          {/* Ascending Deal Arrowhead */}
          <path
            d="M27.8 9.8H33.2V15.2"
            stroke="#E0963E"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
