import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

async function load(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}
const { imageAtWidth, imageSources } = await load('../src/utils/responsiveImage.ts');
const { createReadCache } = await load('../src/utils/readCache.ts');
const { tourSearchQuery } = await load('../src/utils/tourSearch.ts');
const photo = 'https://res.cloudinary.com/demo/image/upload/v123/tours/hoi-an.jpg';

test('responsive images preserve the original public asset and expose bounded browser width choices', () => {
  assert.equal(imageAtWidth(photo, 640), 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_640/v123/tours/hoi-an.jpg');
  assert.equal(imageSources(photo, [640, 320, 640, -1, 9000]), `${imageAtWidth(photo, 320)} 320w, ${imageAtWidth(photo, 640)} 640w`);
  assert.equal(imageAtWidth(photo, Number.NaN), photo);
});

test('signed, authenticated, transformed and non-Cloudinary URLs are never rewritten', () => {
  for (const url of [
    photo.replace('/v123/', '/s--signature--/v123/'),
    photo.replace('/upload/', '/authenticated/'),
    photo.replace('/v123/', '/c_crop,w_100/v123/'),
    `${photo}?token=signature`, photo.replace('res.cloudinary.com', 'res.cloudinary.com.example.org'),
    photo.replace('https:', 'http:'), photo.replace('https://', 'https://user:pass@'),
    '/local/banner.webp', 'data:image/png;base64,AAA', 'not a URL',
  ]) {
    assert.equal(imageAtWidth(url, 640), url);
    assert.equal(imageSources(url, [320, 640]), undefined);
  }
});

test('concurrent catalog reads share a request; only a successful result remains within TTL', async () => {
  let clock = 100, calls = 0;
  const cache = createReadCache(1000, () => clock);
  const fetch = async () => { calls++; return { code: 1000, result: [1, 2] }; };
  const reads = await Promise.all([cache.get('locations', fetch), cache.get('locations', fetch)]);
  assert.equal(calls, 1); assert.equal(reads[0], reads[1]);
  clock += 999; await cache.get('locations', fetch); assert.equal(calls, 1);
  clock += 1; await cache.get('locations', fetch); assert.equal(calls, 2);
});

test('catalog failure permits retry and mutation invalidates even a still-running old read', async () => {
  const cache = createReadCache();
  await assert.rejects(cache.get('locations', () => Promise.reject(new Error('offline'))));
  let finish;
  const oldRead = cache.get('locations', () => new Promise(resolve => { finish = resolve; }));
  await Promise.resolve(); cache.invalidate();
  assert.equal(await cache.get('locations', async () => 'new'), 'new');
  finish('old'); assert.equal(await oldRead, 'old');
  assert.equal(await cache.get('locations', async () => { throw new Error('cache should still hold new result'); }), 'new');
});

test('an unsuccessful API envelope is not cached as an empty catalog', async () => {
  const cache = createReadCache(); let calls = 0;
  const fetch = async () => ({ code: ++calls === 1 ? 1500 : 1000 });
  await cache.get('vehicles', fetch, value => value.code === 1000);
  assert.equal((await cache.get('vehicles', fetch, value => value.code === 1000)).code, 1000);
  assert.equal(calls, 2);
});

test('search request and pagination share the same bounded size and preserve Unicode filter values', () => {
  const input = new URLSearchParams({ dest: 'Huế & Hội An', size: '20', page: '2', sort: 'priceLow' });
  const { query, page, size } = tourSearchQuery(input);
  assert.equal(page, 2); assert.equal(size, 20);
  assert.equal(query.get('dest'), 'Huế & Hội An'); assert.equal(query.get('size'), '20');
  assert.equal(query.get('sort'), 'priceLow');
  for (const invalid of ['NaN', '-1', '1.5', '', '99999999999999999999']) {
    const result = tourSearchQuery(new URLSearchParams({ size: invalid, page: invalid }));
    assert.equal(result.size, 5); assert.equal(result.page, 0);
  }
  assert.equal(tourSearchQuery(new URLSearchParams('size=9999')).size, 50);
});

const dataUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
async function componentUrl(path, dependencies = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  let code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText.replace(/import\s+['"]\.\/tourGallery\.css['"];?/g, '');
  for (const [from, to] of Object.entries({ react: import.meta.resolve('react'), 'react/jsx-runtime': import.meta.resolve('react/jsx-runtime'), ...dependencies })) {
    code = code.replaceAll(`'${from}'`, JSON.stringify(to)).replaceAll(`"${from}"`, JSON.stringify(to));
  }
  return dataUrl(code);
}
const utilsUrl = await componentUrl('../src/utils/responsiveImage.ts');
const responsiveUrl = await componentUrl('../src/components/Share/ResponsiveImage.tsx', {
  '@/utils/responsiveImage': utilsUrl,
  '@/assets/images/fallback.png': dataUrl('export default "fixture-fallback.png";'),
});
const { default: ResponsiveImage } = await import(responsiveUrl);
const galleryUrl = await componentUrl('../src/components/TourDetail/TourImage.tsx', {
  '@/components/Share/ResponsiveImage': responsiveUrl,
  antd: dataUrl(`import React from ${JSON.stringify(import.meta.resolve('react'))};
    export const Image={PreviewGroup:({items})=>React.createElement('span',{'data-viewer-items':items.length})};`),
});
const { default: Gallery } = await import(galleryUrl);

test('a ten-image gallery mounts only one main photo and three thumbnails before preview', () => {
  const urls = Array.from({ length: 10 }, (_, index) => photo.replace('hoi-an', `tour-${index}`));
  const html = renderToStaticMarkup(React.createElement(Gallery, { imageIds: urls }));
  assert.equal((html.match(/<img /g) || []).length, 4);
  assert.ok(html.includes('data-viewer-items="10"'));
  assert.ok(!html.includes('src="' + urls[9] + '"'));
  assert.equal(renderToStaticMarkup(React.createElement(Gallery, { imageIds: [] })), '');
});

test('forbidden image transformation retries the stored original once, then a stable local fallback', () => {
  const element = ResponsiveImage({ src: photo, alt: 'Huế' });
  let src = element.props.src;
  const image = { dataset: {}, removeAttribute() {}, getAttribute: () => src, get src() { return src; }, set src(value) { src = value; } };
  element.props.onError({ currentTarget: image }); assert.equal(src, photo);
  element.props.onError({ currentTarget: image }); assert.equal(src, 'fixture-fallback.png');
  element.props.onError({ currentTarget: image }); assert.equal(src, 'fixture-fallback.png');
});
