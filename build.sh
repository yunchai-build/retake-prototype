#!/bin/sh
# Build the React/Vite SPA (outputs dist/index.html + dist/assets/)
npm run build

# Landing/marketing page — served at / via Vercel rewrite
cp landing.html dist/landing.html

# Static assets needed by landing.html
cp cursor-hand.png bg-landscape.jpg hand-phone.png retake-logo.png dist/

# Assets needed by the SPA (stickers, fonts, canvas)
cp canvas-frame-teletubby.png sticker-yunchai.png logo.png dist/
cp camera-throw.png camera-icon.png sticker-frames.svg sticker-ball.png dist/
cp bedstead-extracondensed.otf bedstead-semicondensed.otf dist/
