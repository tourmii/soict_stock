import { ObjectId } from 'mongodb';
import { getDb } from './db.js';

const BLOG_COLLECTION = 'blog_posts';
const MAX_TITLE = 160;
const MAX_EXCERPT = 500;
const MAX_CONTENT = 50000;
const MAX_COVER_URL = 800;

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function collection() {
  return getDb().collection(BLOG_COLLECTION);
}

function getRequestUserId(req) {
  return String(req.headers['x-user-id'] || req.body?.userId || req.query?.userId || '').trim();
}

export async function requireUser(req) {
  const userId = getRequestUserId(req);
  if (!userId) throw httpError(401, 'Authentication required');

  const user = await getDb().collection('users').findOne({ _id: userId });
  if (!user) throw httpError(401, 'Invalid session user');

  return { user, userId };
}

export function slugifyTitle(title) {
  const slug = String(title || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
    .replace(/-+$/g, '');

  return slug || 'post';
}

function validateString(value, field, max, { required = false } = {}) {
  if (value === undefined || value === null) {
    if (required) throw httpError(400, `${field} is required`);
    return undefined;
  }

  const str = String(value).trim();
  if (required && !str) throw httpError(400, `${field} is required`);
  if (str.length > max) throw httpError(400, `${field} must be ${max} characters or fewer`);
  return str;
}

function validateCoverUrl(value) {
  const str = validateString(value, 'cover_image_url', MAX_COVER_URL);
  if (!str) return null;

  try {
    const url = new URL(str);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol');
    return str;
  } catch {
    throw httpError(400, 'cover_image_url must be a valid HTTP or HTTPS URL');
  }
}

function toObjectId(id) {
  if (!ObjectId.isValid(id)) throw httpError(400, 'Invalid blog post id');
  return new ObjectId(id);
}

function serializePost(post) {
  if (!post) return null;
  return {
    ...post,
    _id: post._id.toString(),
    id: post._id.toString(),
  };
}

async function uniqueSlug(baseSlug, excludeId = null) {
  for (let i = 0; i < 30; i++) {
    const slug = i === 0 ? baseSlug : `${baseSlug}-${i + 1}`;
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await collection().findOne(query, { projection: { _id: 1 } });
    if (!existing) return slug;
  }

  throw httpError(409, 'Could not generate a unique slug for this title');
}

function editableFields(input, existingPost = null) {
  const updates = {};
  let titleChanged = false;

  if (Object.prototype.hasOwnProperty.call(input, 'title')) {
    const title = validateString(input.title, 'title', MAX_TITLE, { required: true });
    updates.title = title;
    titleChanged = !existingPost || title !== existingPost.title;
  }
  if (Object.prototype.hasOwnProperty.call(input, 'excerpt')) {
    updates.excerpt = validateString(input.excerpt, 'excerpt', MAX_EXCERPT) || null;
  }
  if (Object.prototype.hasOwnProperty.call(input, 'content')) {
    updates.content = validateString(input.content, 'content', MAX_CONTENT) || '';
  }
  if (Object.prototype.hasOwnProperty.call(input, 'cover_image_url')) {
    updates.cover_image_url = validateCoverUrl(input.cover_image_url);
  }

  return { updates, titleChanged };
}

export async function listPublishedPosts() {
  const posts = await collection()
    .find({ status: 'published' })
    .sort({ published_at: -1, created_at: -1 })
    .toArray();

  return posts.map(serializePost);
}

export async function getPublishedPostBySlug(slug) {
  const post = await collection().findOne({
    slug: String(slug || '').trim(),
    status: 'published',
  });

  return serializePost(post);
}

export async function listOwnPosts(userId) {
  const posts = await collection()
    .find({ author_id: userId })
    .sort({ updated_at: -1, created_at: -1 })
    .toArray();

  return posts.map(serializePost);
}

export async function createDraftPost(input, userId) {
  const title = validateString(input.title, 'title', MAX_TITLE, { required: true });
  const excerpt = validateString(input.excerpt, 'excerpt', MAX_EXCERPT) || null;
  const content = validateString(input.content, 'content', MAX_CONTENT) || '';
  const coverImageUrl = validateCoverUrl(input.cover_image_url);
  const now = new Date().toISOString();
  const slug = await uniqueSlug(slugifyTitle(title));

  const doc = {
    author_id: userId,
    title,
    slug,
    excerpt,
    content,
    cover_image_url: coverImageUrl,
    status: 'draft',
    created_at: now,
    updated_at: now,
    published_at: null,
  };

  try {
    const result = await collection().insertOne(doc);
    return serializePost({ ...doc, _id: result.insertedId });
  } catch (err) {
    if (err.code === 11000) throw httpError(409, 'A blog post with this slug already exists');
    throw err;
  }
}

export async function updateOwnPost(id, input, userId) {
  const objectId = toObjectId(id);
  const post = await collection().findOne({ _id: objectId, author_id: userId });
  if (!post) throw httpError(404, 'Blog post not found');

  const { updates, titleChanged } = editableFields(input, post);
  if (Object.keys(updates).length === 0) {
    throw httpError(400, 'No editable blog fields were provided');
  }

  if (titleChanged) {
    updates.slug = await uniqueSlug(slugifyTitle(updates.title), objectId);
  }
  updates.updated_at = new Date().toISOString();

  try {
    await collection().updateOne({ _id: objectId, author_id: userId }, { $set: updates });
  } catch (err) {
    if (err.code === 11000) throw httpError(409, 'A blog post with this slug already exists');
    throw err;
  }

  const updated = await collection().findOne({ _id: objectId, author_id: userId });
  return serializePost(updated);
}

export async function publishOwnPost(id, userId) {
  const objectId = toObjectId(id);
  const post = await collection().findOne({ _id: objectId, author_id: userId });
  if (!post) throw httpError(404, 'Blog post not found');
  if (!post.title?.trim()) throw httpError(400, 'title is required before publishing');
  if (!post.content?.trim()) throw httpError(400, 'content is required before publishing');

  const now = new Date().toISOString();
  await collection().updateOne(
    { _id: objectId, author_id: userId },
    {
      $set: {
        status: 'published',
        updated_at: now,
        published_at: post.published_at || now,
      },
    }
  );

  return serializePost(await collection().findOne({ _id: objectId, author_id: userId }));
}

export async function archiveOwnPost(id, userId) {
  const objectId = toObjectId(id);
  const post = await collection().findOne({ _id: objectId, author_id: userId });
  if (!post) throw httpError(404, 'Blog post not found');

  const now = new Date().toISOString();
  await collection().updateOne(
    { _id: objectId, author_id: userId },
    { $set: { status: 'archived', updated_at: now } }
  );

  return serializePost(await collection().findOne({ _id: objectId, author_id: userId }));
}

export async function deleteOwnPost(id, userId) {
  const objectId = toObjectId(id);
  const post = await collection().findOne({ _id: objectId, author_id: userId });
  if (!post) throw httpError(404, 'Blog post not found');
  if (post.status === 'published') {
    throw httpError(400, 'Published posts must be archived before deletion');
  }

  await collection().deleteOne({ _id: objectId, author_id: userId });
}
