# PWA Icons Required

To complete the PWA setup, you need to add the following icon files to the `/public` directory:

## Required Icons

### 1. `icon-192.png` (192x192 pixels)
- **Size**: 192 x 192 pixels
- **Format**: PNG
- **Purpose**: Small icon for mobile home screen
- **Design**: Baby-themed icon with pink/pastel colors
- **Suggested**: Baby bottle, pacifier, or cute baby face emoji style

### 2. `icon-512.png` (512x512 pixels)
- **Size**: 512 x 512 pixels
- **Format**: PNG
- **Purpose**: Large icon for splash screen and app store
- **Design**: Same as icon-192 but higher resolution
- **Suggested**: Baby bottle, pacifier, or cute baby face emoji style

### 3. `screenshot1.png` (optional, 540x720 pixels)
- **Size**: 540 x 720 pixels (mobile aspect ratio)
- **Format**: PNG
- **Purpose**: App screenshot for PWA install prompt
- **Content**: Screenshot of the dashboard or main tracking page

## Icon Design Suggestions

The icons should match the Baby Tracker app's playful, pastel theme:
- **Colors**: Pastel pink (#FFE4E9), baby blue (#E4F1FF), yellow (#FFF9E4)
- **Style**: Rounded, friendly, playful
- **Symbol**: Baby bottle 🍼, pacifier, or stylized "BT" letters
- **Background**: Soft gradient or solid pastel color

## Quick Icon Generation Options

### Option 1: Use Favicon Generator
1. Visit https://realfavicongenerator.net/
2. Upload a design or emoji
3. Generate all sizes including PWA icons

### Option 2: Use Figma/Canva
1. Create a 512x512 design with baby theme
2. Export as PNG
3. Resize to 192x192 for smaller icon

### Option 3: Use Emoji/Icon Library
1. Find a baby-related emoji or icon
2. Use an icon generator to create PWA sizes
3. Apply the app's color scheme

## Current Status

- ✅ PWA manifest configured (`/public/manifest.json`)
- ✅ Service worker created (`/public/sw.js`)
- ✅ Service worker registration added to app
- ⏳ **Icons needed**: Please add `icon-192.png` and `icon-512.png`

## Testing PWA

Once icons are added:

1. Build the app: `npm run build`
2. Start production server: `npm start`
3. Open on mobile browser (or use Chrome DevTools → Application → Manifest)
4. You should see "Install App" prompt on mobile

## File Placement

Place the icon files directly in the `/public` directory:

```
public/
├── icon-192.png
├── icon-512.png
├── screenshot1.png (optional)
├── manifest.json
└── sw.js
```

The manifest.json is already configured to reference these files.
