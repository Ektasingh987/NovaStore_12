'use strict';

/**
 * Convert a string to a URL-safe slug.
 * e.g. "My Product 2024!" → "my-product-2024"
 *
 * @param {string} str
 * @returns {string}
 */
const slugify = (str) =>
  String(str)
    .toLowerCase()
    .trim()
    .normalize('NFD')                    // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '')    // Strip diacritics
    .replace(/[^a-z0-9\s-]/g, '')       // Remove non-alphanumeric (keep spaces/hyphens)
    .replace(/\s+/g, '-')               // Spaces → hyphens
    .replace(/-+/g, '-')                // Collapse consecutive hyphens
    .replace(/^-|-$/g, '');             // Trim leading/trailing hyphens

/**
 * Generate a unique slug by appending a numeric suffix when collisions occur.
 *
 * @param {string} base         The base text to slugify (e.g. product name)
 * @param {Function} existsFn   Async (slug: string) => boolean — returns true if taken
 * @returns {Promise<string>}
 *
 * @example
 *   const slug = await uniqueSlug('Blue Shirt', (s) => Product.exists({ slug: s }));
 *   // → 'blue-shirt' or 'blue-shirt-2', 'blue-shirt-3', …
 */
const uniqueSlug = async (base, existsFn) => {
  const baseSlug = slugify(base);
  let slug = baseSlug;
  let suffix = 2;

  while (await existsFn(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

module.exports = { slugify, uniqueSlug };
