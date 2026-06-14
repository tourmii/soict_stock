import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { formatDateTime } from '../lib/formatters';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import './Blogs.css';

export default function MyBlogs() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const addToast = useSettingsStore((s) => s.addToast);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState('');

  const loadPosts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getMyBlogs(user.id);
      setPosts(data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load your posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return undefined;

    let active = true;
    api.getMyBlogs(user.id)
      .then((data) => {
        if (!active) return;
        setPosts(data || []);
        setError('');
      })
      .catch((err) => {
        if (active) setError(err.message || 'Failed to load your posts');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [user]);

  const handleArchive = async (id) => {
    if (!user) return;
    try {
      await api.archiveBlogPost(id, user.id);
      addToast({ type: 'info', title: 'Post archived', message: 'The post is no longer public.' });
      await loadPosts();
    } catch (err) {
      addToast({ type: 'error', title: 'Archive failed', message: err.message });
    }
  };

  const handleDelete = async (post) => {
    if (!user || post.status === 'published') return;
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;

    try {
      await api.deleteBlogPost(post.id, user.id);
      addToast({ type: 'success', title: 'Post deleted', message: 'The draft or archived post was removed.' });
      await loadPosts();
    } catch (err) {
      addToast({ type: 'error', title: 'Delete failed', message: err.message });
    }
  };

  if (!user) {
    return (
      <div className="blogs-page">
        <div className="container blogs-shell">
          <div className="blog-empty">Sign in to manage your blog posts.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="blogs-page">
      <div className="container blogs-shell">
        <div className="blogs-header">
          <div>
            <span className="badge badge-primary">My Blog Posts</span>
            <h2>Post Management</h2>
            <p>Write community notes for education and discussion. Published posts are visible to everyone.</p>
          </div>
          <Link to="/my-blogs/new" className="btn btn-primary">New Post</Link>
        </div>

        {loading && <div className="blog-empty">Loading your posts...</div>}
        {error && <div className="blog-alert blog-alert--error">{error}</div>}
        {!loading && !error && posts.length === 0 && (
          <div className="blog-empty">You have not created any posts yet.</div>
        )}

        <div className="my-blog-list">
          {posts.map((post) => {
            const openEditor = () => navigate(`/my-blogs/${post.id}/edit`);

            return (
            <article
              key={post.id}
              className="my-blog-row my-blog-row--clickable"
              role="link"
              tabIndex={0}
              onClick={openEditor}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openEditor();
                }
              }}
            >
              <div>
                <div className="blog-card__meta">
                  <span>{formatDateTime(post.updated_at || post.created_at)}</span>
                  <span className={`blog-status blog-status--${post.status}`}>{post.status}</span>
                </div>
                <h3>{post.title}</h3>
                {(post.stock_tags || []).length > 0 && (
                  <div className="blog-stock-tags">
                    {post.stock_tags.map((tag) => (
                      <span key={tag} className="blog-stock-tag">${tag}</span>
                    ))}
                  </div>
                )}
                {post.excerpt && <p>{post.excerpt}</p>}
                {post.status === 'published' && (
                  <Link
                    to={`/blogs/${post.slug}`}
                    className="blog-read-link"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    View public post
                  </Link>
                )}
              </div>
              <div className="my-blog-row__actions">
                {post.status === 'published' && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleArchive(post.id);
                    }}
                  >
                    Archive
                  </button>
                )}
                {post.status !== 'published' && (
                  <button
                    className="btn btn-outline btn-sm blog-danger-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(post);
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
