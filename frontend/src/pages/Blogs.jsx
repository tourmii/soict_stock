import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { formatDateTime } from '../lib/formatters';
import { useAuthStore } from '../store/authStore';
import './Blogs.css';

const DISCLAIMER = 'Posts are for educational/community discussion only and are not financial advice.';

export default function Blogs() {
  const user = useAuthStore((s) => s.user);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.getBlogs()
      .then((data) => {
        if (active) setPosts(data || []);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Failed to load blog posts');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  return (
    <div className="blogs-page">
      <div className="container blogs-shell">
        <div className="blogs-header">
          <div>
            <span className="badge badge-primary">Community Blog</span>
            <h2>Market Notes and Trading Reflections</h2>
            <p>{DISCLAIMER}</p>
          </div>
          {user && <Link to="/my-blogs" className="btn btn-primary">Write a Post</Link>}
        </div>

        {loading && <div className="blog-empty">Loading published posts...</div>}
        {error && <div className="blog-alert blog-alert--error">{error}</div>}
        {!loading && !error && posts.length === 0 && (
          <div className="blog-empty">No published posts yet.</div>
        )}

        <div className="blog-grid">
          {posts.map((post) => (
            <article key={post.id} className="blog-card">
              {post.cover_image_url && (
                <Link to={`/blogs/${post.slug}`} className="blog-card__cover">
                  <img src={post.cover_image_url} alt="" />
                </Link>
              )}
              <div className="blog-card__body">
                <div className="blog-card__meta">
                  <span>{formatDateTime(post.published_at || post.created_at)}</span>
                  <span className="blog-status blog-status--published">Published</span>
                </div>
                <h3>
                  <Link to={`/blogs/${post.slug}`}>{post.title}</Link>
                </h3>
                {post.excerpt && <p>{post.excerpt}</p>}
                <Link to={`/blogs/${post.slug}`} className="blog-read-link">Read post</Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
