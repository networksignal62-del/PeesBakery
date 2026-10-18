import { ImageResponse } from 'next/og'

export const alt = "Pee's Bakery & Restaurant in Freetown"
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80, background: 'linear-gradient(135deg, #014325 0%, #166534 65%, #fd4d00 100%)', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: '#ffe4c7' }}>Freetown, Sierra Leone</div>
      <div style={{ display: 'flex', marginTop: 28, fontSize: 82, fontWeight: 800, lineHeight: 1.08 }}>Pee&apos;s Bakery<br />&amp; Restaurant</div>
      <div style={{ display: 'flex', marginTop: 40, fontSize: 33, color: '#fef3e8' }}>Fresh pastries · African dishes · Fast food</div>
      <div style={{ display: 'flex', marginTop: 44, width: 160, height: 8, borderRadius: 8, background: '#fd4d00' }} />
    </div>,
    size,
  )
}
