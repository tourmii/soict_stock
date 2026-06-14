import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { formatDateTime } from '../lib/formatters';
import './Blogs.css';

const DISCLAIMER = 'Posts are for educational/community discussion only and are not financial advice.';

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.getBlog(slug)
      .then((data) => {
        if (active) setPost(data);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Failed to load blog post');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [slug]);

  return (
    <div className="blogs-page">
      <article className="container blog-detail">
        <Link to="/blogs" className="blog-back-link">Back to blogs</Link>

        {loading && <div className="blog-empty">Loading post...</div>}
        {error && <div className="blog-alert blog-alert--error">{error}</div>}

        {post && (
          <>
            <header className="blog-detail__header">
              <div className="blog-card__meta">
                <span>{formatDateTime(post.published_at || post.created_at)}</span>
                <span className="blog-status blog-status--published">Published</span>
              </div>
              <h1>{post.title}</h1>
              {post.excerpt && <p>{post.excerpt}</p>}
            </header>

            {post.cover_image_url && (
              <img className="blog-detail__cover" src={post.cover_image_url} alt="" />
            )}

            <div className="blog-disclaimer">{DISCLAIMER}</div>
            <div className="blog-detail__content">{post.content}</div>
          </>
        )}
      </article>
    </div>
  );
}
