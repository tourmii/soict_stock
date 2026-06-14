import { ObjectId } from 'mongodb';
import { getDb } from './db.js';

const BLOG_COLLECTION = 'blog_posts';
const MAX_TITLE = 160;
const MAX_EXCERPT = 500;
const MAX_CONTENT = 50000;
const MAX_COVER_URL = 800;
const MAX_COMMENT = 1200;
const MAX_STOCK_TAGS = 8;

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

export function getOptionalUserId(req) {
  return getRequestUserId(req);
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

function normalizeSingleStockTag(value) {
  return String(value || '')
    .trim()
    .replace(/^\$/, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);
}

function extractStockTagsFromText(...values) {
  const text = values.map((value) => String(value || '')).join(' ');
  const tags = [];
  const mentionPattern = /\$([A-Za-z][A-Za-z0-9]{0,11})\b/g;
  let match = mentionPattern.exec(text);

  while (match && tags.length < MAX_STOCK_TAGS) {
    const tag = normalizeSingleStockTag(match[1]);
    if (tag && !tags.includes(tag)) tags.push(tag);
    match = mentionPattern.exec(text);
  }

  return tags;
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toObjectId(id) {
  if (!ObjectId.isValid(id)) throw httpError(400, 'Invalid blog post id');
  return new ObjectId(id);
}

function serializePost(post, viewerId = '') {
  if (!post) return null;
  const { votes_by_user: votesByUser = {}, ...safePost } = post;
  return {
    ...safePost,
    _id: post._id.toString(),
    id: post._id.toString(),
    comments: (post.comments || []).map((comment) => ({
      ...comment,
      _id: comment._id?.toString?.() || String(comment._id),
      id: comment._id?.toString?.() || String(comment._id),
    })),
    comment_count: Array.isArray(post.comments) ? post.comments.length : post.comment_count || 0,
    upvotes: post.upvotes || 0,
    downvotes: post.downvotes || 0,
    rating: post.rating || 0,
    user_vote: viewerId ? Number(votesByUser[viewerId] || 0) : 0,
  };
}

async function attachAuthorNames(posts, viewerId = '') {
  if (!posts.length) return [];

  const serializedPosts = posts.map((post) => serializePost(post, viewerId));
  const authorIds = [...new Set(serializedPosts.map((post) => post.author_id).filter(Boolean))];
  if (!authorIds.length) return serializedPosts;

  const users = await getDb()
    .collection('users')
    .find({ _id: { $in: authorIds } }, { projection: { display_name: 1, email: 1 } })
    .toArray();
  const namesById = new Map(users.map((user) => [
    String(user._id),
    user.display_name || user.email?.split('@')[0] || 'Trader',
  ]));

  return serializedPosts.map((post) => ({
    ...post,
    author_name: namesById.get(String(post.author_id)) || post.author_name || 'Trader',
  }));
}

async function serializePostWithAuthor(post, viewerId = '') {
  if (!post) return null;
  const [serializedPost] = await attachAuthorNames([post], viewerId);
  return serializedPost;
}

function serializePublicUser(user) {
  return {
    _id: String(user._id),
    id: String(user._id),
    display_name: user.display_name || user.email?.split('@')[0] || 'Trader',
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  };
}

async function authorIdsForSearch(search) {
  const query = String(search || '').trim();
  if (!query) return null;

  const pattern = new RegExp(escapeRegExp(query), 'i');
  const users = await getDb()
    .collection('users')
    .find(
      { $or: [{ display_name: pattern }, { email: pattern }] },
      { projection: { _id: 1 } }
    )
    .limit(50)
    .toArray();

  return users.map((user) => String(user._id));
}

function sortFor(sort = 'time') {
  switch (String(sort).toLowerCase()) {
    case 'rating':
    case 'top':
      return { upvotes: -1, published_at: -1, created_at: -1 };
    case 'alphabet':
    case 'alpha':
    case 'title':
      return { title: 1, published_at: -1 };
    case 'oldest':
      return { published_at: 1, created_at: 1 };
    case 'comments':
      return { comment_count: -1, published_at: -1, created_at: -1 };
    case 'time':
    case 'newest':
    default:
      return { published_at: -1, created_at: -1 };
  }
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

export async function listPublishedPosts(sort, viewerId = '', stock = '', author = '') {
  const query = { status: 'published' };
  const stockTag = normalizeSingleStockTag(stock);
  if (stockTag) query.stock_tags = stockTag;
  const authorIds = await authorIdsForSearch(author);
  if (authorIds && authorIds.length === 0) return [];
  if (authorIds) query.author_id = { $in: authorIds };

  const posts = await collection()
    .find(query)
    .sort(sortFor(sort))
    .toArray();

  return attachAuthorNames(posts, viewerId);
}

export async function getPublicProfileWithPosts(userId, sort, viewerId = '') {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) throw httpError(400, 'userId is required');

  const user = await getDb()
    .collection('users')
    .findOne({ _id: normalizedUserId }, { projection: { display_name: 1, email: 1, createdAt: 1, updatedAt: 1 } });
  if (!user) throw httpError(404, 'User not found');

  const posts = await collection()
    .find({ status: 'published', author_id: normalizedUserId })
    .sort(sortFor(sort))
    .toArray();

  return {
    user: serializePublicUser(user),
    posts: await attachAuthorNames(posts, viewerId),
  };
}

export async function getPublishedPostBySlug(slug, viewerId = '') {
  const post = await collection().findOne({
    slug: String(slug || '').trim(),
    status: 'published',
  });

  return serializePostWithAuthor(post, viewerId);
}

export async function listOwnPosts(userId) {
  const posts = await collection()
    .find({ author_id: userId })
    .sort({ updated_at: -1, created_at: -1 })
    .toArray();

  return attachAuthorNames(posts, userId);
}

export async function createDraftPost(input, userId) {
  const title = validateString(input.title, 'title', MAX_TITLE, { required: true });
  const excerpt = validateString(input.excerpt, 'excerpt', MAX_EXCERPT) || null;
  const content = validateString(input.content, 'content', MAX_CONTENT) || '';
  const coverImageUrl = validateCoverUrl(input.cover_image_url);
  const stockTags = extractStockTagsFromText(title, excerpt, content);
  const now = new Date().toISOString();
  const slug = await uniqueSlug(slugifyTitle(title));

  const doc = {
    author_id: userId,
    title,
    slug,
    excerpt,
    content,
    cover_image_url: coverImageUrl,
    stock_tags: stockTags,
    status: 'draft',
    upvotes: 0,
    downvotes: 0,
    rating: 0,
    votes_by_user: {},
    comments: [],
    comment_count: 0,
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
  if (
    Object.prototype.hasOwnProperty.call(updates, 'title')
    || Object.prototype.hasOwnProperty.call(updates, 'excerpt')
    || Object.prototype.hasOwnProperty.call(updates, 'content')
  ) {
    updates.stock_tags = extractStockTagsFromText(
      updates.title ?? post.title,
      updates.excerpt ?? post.excerpt,
      updates.content ?? post.content
    );
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

export async function voteOnPublishedPost(id, vote, userId) {
  const objectId = toObjectId(id);
  const value = Number(vote);
  if (![1, -1, 0].includes(value)) {
    throw httpError(400, 'vote must be 1, -1, or 0');
  }

  const post = await collection().findOne({ _id: objectId, status: 'published' });
  if (!post) throw httpError(404, 'Blog post not found');

  const votesByUser = post.votes_by_user || {};
  const previous = Number(votesByUser[userId] || 0);
  if (previous === value) return serializePostWithAuthor(post, userId);

  let upvotes = post.upvotes || 0;
  let downvotes = post.downvotes || 0;

  if (previous === 1) upvotes -= 1;
  if (previous === -1) downvotes -= 1;
  if (value === 1) upvotes += 1;
  if (value === -1) downvotes += 1;

  const update = {
    $set: {
      upvotes,
      downvotes,
      rating: upvotes - downvotes,
      updated_at: new Date().toISOString(),
    },
  };

  if (value === 0) {
    update.$unset = { [`votes_by_user.${userId}`]: '' };
  } else {
    update.$set[`votes_by_user.${userId}`] = value;
  }

  await collection().updateOne({ _id: objectId, status: 'published' }, update);
  return serializePostWithAuthor(await collection().findOne({ _id: objectId, status: 'published' }), userId);
}

export async function addCommentToPublishedPost(id, input, user) {
  const objectId = toObjectId(id);
  const content = validateString(input.content, 'comment', MAX_COMMENT, { required: true });
  const post = await collection().findOne({ _id: objectId, status: 'published' });
  if (!post) throw httpError(404, 'Blog post not found');

  const now = new Date().toISOString();
  const comment = {
    _id: new ObjectId(),
    author_id: user._id,
    author_name: user.display_name || user.email?.split('@')[0] || 'Trader',
    content,
    created_at: now,
    updated_at: now,
  };

  await collection().updateOne(
    { _id: objectId, status: 'published' },
    {
      $push: { comments: comment },
      $inc: { comment_count: 1 },
      $set: { updated_at: now },
    }
  );

  return serializePostWithAuthor(await collection().findOne({ _id: objectId, status: 'published' }), user._id);
}

export async function deleteCommentFromPublishedPost(id, commentId, userId) {
  const objectId = toObjectId(id);
  const post = await collection().findOne({ _id: objectId, status: 'published' });
  if (!post) throw httpError(404, 'Blog post not found');

  const comment = (post.comments || []).find((item) => String(item._id) === String(commentId));
  if (!comment) throw httpError(404, 'Comment not found');

  const isCommentAuthor = String(comment.author_id) === String(userId);
  const isPostAuthor = String(post.author_id) === String(userId);
  if (!isCommentAuthor && !isPostAuthor) {
    throw httpError(403, 'You can only delete your own comments or comments on your posts');
  }

  await collection().updateOne(
    { _id: objectId, status: 'published' },
    {
      $pull: { comments: { _id: comment._id } },
      $set: {
        comment_count: Math.max((post.comments || []).length - 1, 0),
        updated_at: new Date().toISOString(),
      },
    }
  );

  return serializePostWithAuthor(await collection().findOne({ _id: objectId, status: 'published' }), userId);
}
