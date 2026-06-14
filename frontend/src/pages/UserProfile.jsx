import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { formatDateTime } from '../lib/formatters';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import './Blogs.css';

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

function sortProfilePosts(posts, sort) {
  const sorted = [...posts];
  switch (sort) {
    case 'rating':
      return sorted.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    case 'comments':
      return sorted.sort((a, b) => (b.comment_count || 0) - (a.comment_count || 0));
    case 'oldest':
      return sorted.sort((a, b) => String(a.published_at || a.created_at).localeCompare(String(b.published_at || b.created_at)));
    case 'time':
    default:
      return sorted.sort((a, b) => String(b.published_at || b.updated_at || b.created_at).localeCompare(String(a.published_at || a.updated_at || a.created_at)));
  }
}

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const viewer = useAuthStore((s) => s.user);
  const addToast = useSettingsStore((s) => s.addToast);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [sort, setSort] = useState('time');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isOwnProfile = viewer?.id && userId === viewer.id;

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      const data = await api.getBlogProfile(userId, sort, viewer?.id || '');
      const profilePosts = isOwnProfile
        ? sortProfilePosts(await api.getMyBlogs(viewer.id), sort)
        : data.posts || [];

      return { profile: data.user, posts: profilePosts };
    };

    loadProfile()
      .then((data) => {
        if (!active) return;
        setProfile(data.profile);
        setPosts(data.posts || []);
        setError('');
      })
      .catch((err) => {
        if (active) setError(err.message || 'Failed to load profile');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [isOwnProfile, sort, userId, viewer?.id]);

  const isMe = Boolean(isOwnProfile && profile);
  const displayName = isMe ? 'you' : profile?.display_name || 'Trader';

  const loadOwnPosts = async () => {
    if (!viewer) return;
    const data = await api.getMyBlogs(viewer.id);
    setPosts(sortProfilePosts(data || [], sort));
  };

  const handleArchive = async (event, post) => {
    event.stopPropagation();
    if (!viewer) return;
    try {
      await api.archiveBlogPost(post.id, viewer.id);
      addToast({ type: 'info', title: 'Post archived', message: 'The post is no longer public.' });
      await loadOwnPosts();
    } catch (err) {
      addToast({ type: 'error', title: 'Archive failed', message: err.message });
    }
  };

  const handleDelete = async (event, post) => {
    event.stopPropagation();
    if (!viewer || post.status === 'published') return;
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;

    try {
      await api.deleteBlogPost(post.id, viewer.id);
      addToast({ type: 'success', title: 'Post deleted', message: 'The draft or archived post was removed.' });
      await loadOwnPosts();
    } catch (err) {
      addToast({ type: 'error', title: 'Delete failed', message: err.message });
    }
  };

  return (
    <div className="blogs-page">
      <div className="container blogs-shell blog-profile">
        <Link to="/blogs" className="blog-back-link">Back to blogs</Link>

        {loading && <div className="blog-empty">Loading profile...</div>}
        {error && <div className="blog-alert blog-alert--error">{error}</div>}

        {!loading && profile && (
          <>
            <div className="blogs-header blog-profile__header">
              <div>
                <span className="badge badge-primary">{isMe ? 'Your Profile' : 'Community Profile'}</span>
                <h2>{profile.display_name || 'Trader'}</h2>
                <p>{posts.length} {isMe ? '' : 'published '}{posts.length === 1 ? 'post' : 'posts'}</p>
              </div>
              {isMe && (
                <Link
                  to="/my-blogs/new"
                  state={{ from: `${location.pathname}${location.search}` }}
                  className="btn btn-primary"
                >
                  New Post
                </Link>
              )}
            </div>

            <div className="blog-toolbar">
              <div className="blog-toolbar__group">
                <span>Sort posts by</span>
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
            </div>

            {posts.length === 0 && (
              <div className="blog-empty">{isMe ? 'You have not created any posts yet.' : 'No published posts yet.'}</div>
            )}

            <div className="my-blog-list">
              {posts.map((post) => {
                const openPost = () => navigate(isMe ? `/my-blogs/${post.id}/edit` : `/blogs/${post.slug}`);

                return (
                <article
                  key={post.id}
                  className="my-blog-row my-blog-row--clickable"
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
                  <div>
                    <div className="blog-card__meta">
                      <span>{formatDateTime(post.published_at || post.updated_at || post.created_at)}</span>
                      <span className={`blog-status blog-status--${post.status || 'published'}`}>{post.status || 'published'}</span>
                    </div>
                    <div className="blog-author-line">By {displayName}</div>
                    <h3>{post.title}</h3>
                    {(post.stock_tags || []).length > 0 && (
                      <div className="blog-stock-tags">
                        {post.stock_tags.map((tag) => (
                          <Link
                            key={tag}
                            to={`/blogs?stock=${encodeURIComponent(tag)}`}
                            className="blog-stock-tag"
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            ${tag}
                          </Link>
                        ))}
                      </div>
                    )}
                    {post.excerpt && <p>{post.excerpt}</p>}
                  </div>
                  <div className="blog-social-row blog-profile__stats">
                    <span className="blog-vote-pill" aria-label={`${post.upvotes || 0} upvotes`}>
                      <span className="blog-vote-pill__figure" aria-hidden="true">↑</span>
                      {formatCompact(post.upvotes || 0)}
                    </span>
                    {post.status === 'published' && (
                      <Link
                        to={`/blogs/${post.slug}#comments`}
                        className="blog-comment-pill"
                        aria-label={`${post.comment_count || 0} comments`}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <CommentIcon />
                        {formatCompact(post.comment_count || 0)}
                      </Link>
                    )}
                    {isMe && (
                      <Link
                        to={`/my-blogs/${post.id}/edit`}
                        className="btn btn-outline btn-sm"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        Edit
                      </Link>
                    )}
                    {isMe && post.status === 'published' && (
                      <button className="btn btn-outline btn-sm" onClick={(event) => handleArchive(event, post)}>
                        Archive
                      </button>
                    )}
                    {isMe && post.status !== 'published' && (
                      <button className="btn btn-outline btn-sm blog-danger-btn" onClick={(event) => handleDelete(event, post)}>
                        Delete
                      </button>
                    )}
                  </div>
                </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
