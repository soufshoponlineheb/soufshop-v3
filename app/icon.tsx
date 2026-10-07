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
            'linear-gradient(135deg, #125E4A 0%, #093429 52%, #041913 100%)',
          borderRadius: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          border: '2.5px solid rgba(251, 191, 36, 0.48)',
        }}
      >
        <svg
          width="84"
          height="84"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left Golden Rivo Wing */}
          <path
            d="M9.2 14.8C11.8 15.8 14.0 17.6 15.4 20.2L21.8 36.2C13.8 33.8 8.6 25.2 9.2 14.8Z"
            fill="#FBBF24"
          />
          {/* Right Golden Rivo Wing */}
          <path
            d="M38.8 14.8C36.2 15.8 34.0 17.6 32.6 20.2L26.2 36.2C34.2 33.8 39.4 25.2 38.8 14.8Z"
            fill="#F59E0B"
          />
          {/* Sovereign Diamond Pedestal */}
          <path
            d="M16.5 39.4L24 37.8L31.5 39.4L24 41.0L16.5 39.4Z"
            fill="#FBBF24"
          />
          {/* Central 4-Faceted Kite-Cut Aqua-Jewel */}
          <path d="M24 7.5L17.8 18.5H24V7.5Z" fill="#FFFFFF" />
          <path d="M24 7.5L30.2 18.5H24V7.5Z" fill="#CCFBF1" />
          <path d="M17.8 18.5L24 33.8V18.5H17.8Z" fill="#E6F4F1" />
          <path d="M30.2 18.5L24 33.8V18.5H30.2Z" fill="#5EEAD4" />
          {/* Inner 4-Point Golden Polaris Spark */}
          <path
            d="M24 14.6L25.05 17.45L27.9 18.5L25.05 19.55L24 22.4L22.95 19.55L20.1 18.5L22.95 17.45L24 14.6Z"
            fill="#F59E0B"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
