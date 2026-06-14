import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { STOCKS } from '../lib/constants';
import { formatDateTime } from '../lib/formatters';
import { useAuthStore } from '../store/authStore';
import './Blogs.css';

const DISCLAIMER = 'Posts are for educational/community discussion only and are not financial advice.';
const SUMMARY_LENGTH = 180;
const SORT_OPTIONS = [
  { value: 'time', label: 'Newest' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'comments', label: 'Most Discussed' },
  { value: 'oldest', label: 'Oldest' },
];

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

function summaryFor(post) {
  const excerpt = post.excerpt?.trim();
  if (excerpt) return excerpt;

  const firstLine = String(post.content || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) || 'No summary available yet.';

  return firstLine.length > SUMMARY_LENGTH
    ? `${firstLine.slice(0, SUMMARY_LENGTH).trim()}...`
    : `${firstLine}...`;
}

function stockFilterFromSearch(search) {
  const query = search.trim().replace(/^\$/, '').toLowerCase();
  if (!query) return '';

  const stock = STOCKS.find((item) => (
    item.ticker.toLowerCase() === query
    || item.name.toLowerCase().includes(query)
    || item.fullName.toLowerCase().includes(query)
  ));

  return stock?.ticker || '';
}

export default function Blogs() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [sort, setSort] = useState('time');
  const [filterSearch, setFilterSearch] = useState(searchParams.get('stock') || searchParams.get('author') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const stockFilter = stockFilterFromSearch(filterSearch);
  const authorFilter = stockFilter ? '' : filterSearch.trim();

  useEffect(() => {
    let active = true;
    api.getBlogs(sort, user?.id || '', stockFilter, authorFilter)
      .then((data) => {
        if (!active) return;
        setPosts(data || []);
        setError('');
      })
      .catch((err) => {
        if (active) setError(err.message || 'Failed to load blog posts');
      })
      .finally(() => {
        if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [authorFilter, sort, stockFilter, user?.id]);

  const updatePost = (updatedPost) => {
    setPosts((current) => current.map((post) => (
      post.id === updatedPost.id ? updatedPost : post
    )));
  };

  const handleVote = async (event, post, vote) => {
    event.stopPropagation();
    if (!user) {
      setError('Sign in to vote on blog posts.');
      return;
    }

    const nextVote = post.user_vote === vote ? 0 : vote;
    try {
      const updated = await api.voteBlogPost(post.id, nextVote, user.id);
      updatePost(updated);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to vote on blog post');
    }
  };

  return (
    <div className="blogs-page">
      <div className="container blogs-shell">
        <div className="blogs-header">
          <div>
            <span className="badge badge-primary">Community Blog</span>
            <h2>Market Notes and Trading Reflections</h2>
            <p>{DISCLAIMER}</p>
          </div>
          {user && <Link to="/my-blogs/new" className="btn btn-primary">Write a Post</Link>}
        </div>

        <div className="blog-toolbar">
          <div className="blog-toolbar__group">
            <span>Sort by</span>
            <div className="blog-sort">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`blog-sort__button ${sort === option.value ? 'blog-sort__button--active' : ''}`}
                  onClick={() => {
                    setLoading(true);
                    setSort(option.value);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <label className="blog-stock-search blog-combined-filter">
            <span>Filter</span>
            <input
              className="input"
              list="blog-filter-options"
              value={filterSearch}
              onChange={(event) => {
                setLoading(true);
                setFilterSearch(event.target.value);
              }}
              placeholder="Search by stock or username"
            />
            <datalist id="blog-filter-options">
              {STOCKS.map((stock) => (
                <option key={stock.ticker} value={stock.ticker}>
                  {stock.fullName}
                </option>
              ))}
            </datalist>
          </label>

          {filterSearch && (
            <button
              type="button"
              className="blog-clear-filter"
              onClick={() => {
                setLoading(true);
                setFilterSearch('');
              }}
            >
              Clear
            </button>
          )}
        </div>

        {stockFilter && (
          <div className="blog-active-filter">
            Showing posts tagged <strong>${stockFilter}</strong>
          </div>
        )}
        {authorFilter && (
          <div className="blog-active-filter">
            Showing posts by <strong>{authorFilter}</strong>
          </div>
        )}

        {loading && <div className="blog-empty">Loading published posts...</div>}
        {error && <div className="blog-alert blog-alert--error">{error}</div>}
        {!loading && !error && posts.length === 0 && (
          <div className="blog-empty">No published posts yet.</div>
        )}

        <div className="blog-grid">
          {posts.map((post) => {
            const isMine = user?.id && post.author_id === user.id;
            const openPost = () => navigate(`/blogs/${post.slug}`);

            return (
            <article
              key={post.id}
              className="blog-card blog-card--clickable"
              role="link"
              tabIndex={0}
              onClick={openPost}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openPost();
                }
              }}
            >
              <div className="blog-summary-popover" aria-hidden="true">
                <span>Excerpt</span>
                <p>{summaryFor(post)}</p>
              </div>

              {post.cover_image_url && (
                <div className="blog-card__cover">
                  <img src={post.cover_image_url} alt="" />
                </div>
              )}
              <div className="blog-card__body">
                <div className="blog-card__meta">
                  <span>{formatDateTime(post.published_at || post.created_at)}</span>
                  <span className="blog-status blog-status--published">Published</span>
                </div>
                <div className="blog-author-line" onClick={(event) => event.stopPropagation()}>
                  By{' '}
                  <Link
                    to={`/profiles/${post.author_id}`}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    {isMine ? 'you' : post.author_name || 'Trader'}
                  </Link>
                </div>
                <h3>
                  <Link to={`/blogs/${post.slug}`}>{post.title}</Link>
                </h3>
                {(post.stock_tags || []).length > 0 && (
                  <div className="blog-stock-tags" onClick={(event) => event.stopPropagation()}>
                    {post.stock_tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="blog-stock-tag"
                        onClick={() => {
                          setLoading(true);
                          setFilterSearch(tag);
                        }}
                      >
                        ${tag}
                      </button>
                    ))}
                  </div>
                )}
                {post.excerpt && <p>{post.excerpt}</p>}
                <div className="blog-card__actions">
                  <div className="blog-social-row" onClick={(event) => event.stopPropagation()}>
                    <div className="blog-vote-pill" aria-label={`${post.upvotes || 0} upvotes`}>
                      <button
                        type="button"
                        className={post.user_vote === 1 ? 'blog-vote-pill__button blog-vote-pill__button--active' : 'blog-vote-pill__button'}
                        onClick={(event) => handleVote(event, post, 1)}
                        aria-label="Upvote"
                      >
                        ↑
                      </button>
                      <span>{formatCompact(post.upvotes || 0)}</span>
                      <button
                        type="button"
                        className={post.user_vote === -1 ? 'blog-vote-pill__button blog-vote-pill__button--active' : 'blog-vote-pill__button'}
                        onClick={(event) => handleVote(event, post, -1)}
                        aria-label="Downvote"
                      >
                        ↓
                      </button>
                    </div>
                    <Link
                      to={`/blogs/${post.slug}#comments`}
                      className="blog-comment-pill"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                      aria-label={`${post.comment_count || 0} comments`}
                    >
                      <CommentIcon />
                      {formatCompact(post.comment_count || 0)}
                    </Link>
                  </div>
                  {isMine && (
                    <Link
                      to={`/my-blogs/${post.id}/edit`}
                      className="blog-edit-link"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
