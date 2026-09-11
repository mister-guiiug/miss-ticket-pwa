/**
 * Rend l'icône maskable en PNG depuis `public/icon-maskable-512.svg`.
 *
 * POURQUOI UN SVG À PART. Un maskable n'est pas l'icône en plus petit : Android
 * lui applique un masque, et tout bord arrondi laissé dans l'image en ressort
 * comme un liseré. Le PNG livré jusqu'ici était la tuile arrondie posée sur un
 * fond plus sombre, encoche au coin comprise.
 *
 * `icon-maskable-512.svg` reprend le même aplat et le même ticket que
 * `icon-512.svg`, sans les coins arrondis, recentré et agrandi pour occuper la
 * zone de sécurité. Le commentaire du SVG dit ce qui en diffère, et pourquoi.
 *
 * Exécuter : npm run icons:maskable
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');

// `density` : sans elle, sharp pixellise le SVG à 72 ppp AVANT de
// redimensionner, et la brillance en ressort bandée.
await sharp(join(racine, 'public', 'icon-maskable-512.svg'), { density: 384 })
  .resize(512, 512)
  .png()
  .toFile(join(racine, 'public', 'icon-maskable-512.png'));

console.log('public/icon-maskable-512.png écrit (512×512, à fond perdu).');
