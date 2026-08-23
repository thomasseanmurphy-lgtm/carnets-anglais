// @ts-check
import { defineConfig } from 'astro/config';

// Site statique servi par GitHub Pages sous /carnets-anglais/ — mêmes URLs qu'avant :
//   /carnets-anglais/<classe>/<slug>/   (platform.js lit classId + slug dans le chemin)
export default defineConfig({
  site: 'https://thomasseanmurphy-lgtm.github.io',
  base: '/carnets-anglais',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },   // dist/<classe>/<slug>/index.html
});
