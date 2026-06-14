import { Router } from 'express';
import {
  archiveOwnPost,
  createDraftPost,
  deleteOwnPost,
  getPublishedPostBySlug,
  listOwnPosts,
  listPublishedPosts,
  publishOwnPost,
  requireUser,
  updateOwnPost,
} from '../services/blogService.js';

const router = Router();

function sendError(res, err) {
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Unexpected blog API error' : err.message });
}

function asyncRoute(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      sendError(res, err);
    }
  };
}

router.get('/', asyncRoute(async (_req, res) => {
  const posts = await listPublishedPosts();
  res.json(posts);
}));

router.get('/me', asyncRoute(async (req, res) => {
  const { userId } = await requireUser(req);
  const posts = await listOwnPosts(userId);
  res.json(posts);
}));

router.post('/', asyncRoute(async (req, res) => {
  const { userId } = await requireUser(req);
  const post = await createDraftPost(req.body || {}, userId);
  res.status(201).json(post);
}));

router.put('/:id', asyncRoute(async (req, res) => {
  const { userId } = await requireUser(req);
  const post = await updateOwnPost(req.params.id, req.body || {}, userId);
  res.json(post);
}));

router.patch('/:id/publish', asyncRoute(async (req, res) => {
  const { userId } = await requireUser(req);
  const post = await publishOwnPost(req.params.id, userId);
  res.json(post);
}));

router.patch('/:id/archive', asyncRoute(async (req, res) => {
  const { userId } = await requireUser(req);
  const post = await archiveOwnPost(req.params.id, userId);
  res.json(post);
}));

router.delete('/:id', asyncRoute(async (req, res) => {
  const { userId } = await requireUser(req);
  await deleteOwnPost(req.params.id, userId);
  res.json({ message: 'Blog post deleted' });
}));

router.get('/:slug', asyncRoute(async (req, res) => {
  const post = await getPublishedPostBySlug(req.params.slug);
  if (!post) return res.status(404).json({ message: 'Blog post not found' });
  res.json(post);
}));

export default router;
