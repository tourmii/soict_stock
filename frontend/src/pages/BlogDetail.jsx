import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { formatDateTime } from '../lib/formatters';
import { useAuthStore } from '../store/authStore';
import TickerAutocomplete from '../components/shared/TickerAutocomplete';
import './Blogs.css';

const DISCLAIMER = 'Posts are for educational/community discussion only and are not financial advice.';

function formatCompact(value = 0) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function CommentIcon() {
  return (
    <svg className="blog-comment-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4.5c-4.7 0-8.5 3.1-8.5 7 0 2.2 1.2 4.2 3.1 5.5l-.6 2.5 3-1.4c.9.3 1.9.4 3 .4 4.7 0 8.5-3.1 8.5-7s-3.8-7-8.5-7Z" />
    </svg>
  );
}

function renderStockMentions(text) {
  const parts = String(text || '').split(/(\$[A-Za-z][A-Za-z0-9]{0,11}\b)/g);
  return parts.map((part, index) => {
    const match = part.match(/^\$([A-Za-z][A-Za-z0-9]{0,11})$/);
    if (!match) return part;

    const tag = match[1].toUpperCase();
    return (
      <Link key={`${tag}-${index}`} to={`/blogs?stock=${encodeURIComponent(tag)}`} className="blog-inline-stock">
        ${tag}
      </Link>
    );
  });
}

export default function BlogDetail() {
  const { slug } = useParams();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.getBlog(slug, user?.id || '')
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
  }, [slug, user?.id]);

  useEffect(() => {
    if (!post || loading || location.hash !== '#comments') return;
    document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [loading, location.hash, post]);

  const handleVote = async (vote) => {
    if (!user || !post) {
      setError('Sign in to vote on blog posts.');
      return;
    }

    const nextVote = post.user_vote === vote ? 0 : vote;
    try {
      const updated = await api.voteBlogPost(post.id, nextVote, user.id);
      setPost(updated);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to vote on blog post');
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();
    if (!user || !post) {
      setError('Sign in to comment on blog posts.');
      return;
    }
    if (!comment.trim()) return;

    setSubmittingComment(true);
    try {
      const updated = await api.commentBlogPost(post.id, comment, user.id);
      setPost(updated);
      setComment('');
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (!user || !post) return;
    setDeletingCommentId(commentId);
    try {
      const updated = await api.deleteBlogComment(post.id, commentId, user.id);
      setPost(updated);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to delete comment');
    } finally {
      setDeletingCommentId('');
    }
  };

  const canDeleteComment = (item) => (
    user?.id && post && (String(item.author_id) === String(user.id) || String(post.author_id) === String(user.id))
  );

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
              <div className="blog-author-line blog-author-line--detail">
                By{' '}
                <Link to={`/profiles/${post.author_id}`}>
                  {user?.id && post.author_id === user.id ? 'you' : post.author_name || 'Trader'}
                </Link>
              </div>
              <h1>{post.title}</h1>
              {(post.stock_tags || []).length > 0 && (
                <div className="blog-stock-tags">
                  {post.stock_tags.map((tag) => (
                    <Link key={tag} to={`/blogs?stock=${encodeURIComponent(tag)}`} className="blog-stock-tag">
                      ${tag}
                    </Link>
                  ))}
                </div>
              )}
              {post.excerpt && <p>{renderStockMentions(post.excerpt)}</p>}
              <div className="blog-detail__social">
                <div className="blog-vote-pill" aria-label={`${post.upvotes || 0} upvotes`}>
                  <button
                    type="button"
                    className={post.user_vote === 1 ? 'blog-vote-pill__button blog-vote-pill__button--active' : 'blog-vote-pill__button'}
                    onClick={() => handleVote(1)}
                    aria-label="Upvote"
                  >
                    ↑
                  </button>
                  <span>{formatCompact(post.upvotes || 0)}</span>
                  <button
                    type="button"
                    className={post.user_vote === -1 ? 'blog-vote-pill__button blog-vote-pill__button--active' : 'blog-vote-pill__button'}
                    onClick={() => handleVote(-1)}
                    aria-label="Downvote"
                  >
                    ↓
                  </button>
                </div>
                <a href="#comments" className="blog-comment-pill" aria-label={`${post.comment_count || 0} comments`}>
                  <CommentIcon />
                  {formatCompact(post.comment_count || 0)}
                </a>
                {user?.id && post.author_id === user.id && (
                  <Link to={`/my-blogs/${post.id}/edit`} className="blog-edit-link blog-detail__edit-link">
                    Edit
                  </Link>
                )}
              </div>
            </header>

            {post.cover_image_url && (
              <img className="blog-detail__cover" src={post.cover_image_url} alt="" />
            )}

            <div className="blog-disclaimer">{DISCLAIMER}</div>
            <div className="blog-detail__content">{renderStockMentions(post.content)}</div>

            <section className="blog-comments" id="comments">
              <div className="blog-comments__header">
                <h3>Comments</h3>
                <span>{formatCompact(post.comment_count || 0)}</span>
              </div>

              {user ? (
                <form className="blog-comment-form" onSubmit={submitComment}>
                  <TickerAutocomplete
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    textareaProps={{
                      className: 'input',
                      maxLength: 1200,
                      placeholder: 'Join the discussion... use $TICKER to tag stocks',
                      rows: 3,
                      style: { width: '100%', fontFamily: 'inherit', resize: 'vertical' },
                    }}
                  />
                  <button type="submit" className="btn btn-primary" disabled={submittingComment || !comment.trim()}>
                    Comment
                  </button>
                </form>
              ) : (
                <div className="blog-empty blog-empty--compact">Sign in to comment or vote.</div>
              )}

              <div className="blog-comment-list">
                {(post.comments || []).length === 0 && (
                  <div className="blog-empty blog-empty--compact">No comments yet.</div>
                )}
                {(post.comments || []).map((item) => (
                  <article key={item.id} className="blog-comment">
                    <div className="blog-comment__meta">
                      <div>
                        <strong>{item.author_name || 'Trader'}</strong>
                        <span>{formatDateTime(item.created_at)}</span>
                      </div>
                      {canDeleteComment(item) && (
                        <button
                          type="button"
                          className="blog-comment__delete"
                          onClick={() => deleteComment(item.id)}
                          disabled={deletingCommentId === item.id}
                        >
                          {deletingCommentId === item.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                    <p>{renderStockMentions(item.content)}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </article>
    </div>
  );
}
