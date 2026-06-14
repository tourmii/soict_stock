import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import './Blogs.css';

const emptyForm = {
  title: '',
  excerpt: '',
  content: '',
  cover_image_url: '',
  stock_tags: '',
};

function previewStockTags(value) {
  return String(value || '')
    .split(/[\s,;]+/)
    .map((tag) => tag.trim().replace(/^\$/, '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12))
    .filter(Boolean)
    .filter((tag, index, tags) => tags.indexOf(tag) === index)
    .slice(0, 8);
}

export default function BlogEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const addToast = useSettingsStore((s) => s.addToast);
  const [form, setForm] = useState(emptyForm);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canDelete = useMemo(() => post && post.status !== 'published', [post]);
  const previewTags = previewStockTags(form.stock_tags);
  const previousPage = location.state?.from || (user ? `/profiles/${user.id}` : '/blogs');

  useEffect(() => {
    if (isNew || !user) return undefined;

    let active = true;
    api.getMyBlogs(user.id)
      .then((posts) => {
        const found = (posts || []).find((item) => item.id === id);
        if (!active) return;
        if (!found) {
          setError('Blog post not found');
          return;
        }
        setPost(found);
        setForm({
          title: found.title || '',
          excerpt: found.excerpt || '',
          content: found.content || '',
          cover_image_url: found.cover_image_url || '',
          stock_tags: (found.stock_tags || []).join(', '),
        });
      })
      .catch((err) => {
        if (active) setError(err.message || 'Failed to load blog post');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [id, isNew, user]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveDraft = async () => {
    if (!user) return null;
    setSaving(true);
    setError('');
    try {
      const saved = isNew
        ? await api.createBlogPost(form, user.id)
        : await api.updateBlogPost(id, form, user.id);
      setPost(saved);
      addToast({ type: 'success', title: post?.status === 'published' ? 'Changes saved' : 'Draft saved', message: 'Your blog post has been saved.' });
      if (isNew) navigate(`/my-blogs/${saved.id}/edit`, { replace: true, state: { from: previousPage } });
      return saved;
    } catch (err) {
      setError(err.message || 'Failed to save draft');
      addToast({ type: 'error', title: 'Save failed', message: err.message });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const publishPost = async () => {
    if (!user) return;
    const saved = await saveDraft();
    if (!saved) return;

    setSaving(true);
    try {
      const published = await api.publishBlogPost(saved.id, user.id);
      setPost(published);
      addToast({ type: 'success', title: 'Post published', message: 'The post is now visible publicly.' });
      navigate(previousPage);
    } catch (err) {
      setError(err.message || 'Failed to publish post');
      addToast({ type: 'error', title: 'Publish failed', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const archivePost = async () => {
    if (!user || !post) return;
    setSaving(true);
    try {
      const archived = await api.archiveBlogPost(post.id, user.id);
      setPost(archived);
      addToast({ type: 'info', title: 'Post archived', message: 'The post is no longer public.' });
    } catch (err) {
      setError(err.message || 'Failed to archive post');
      addToast({ type: 'error', title: 'Archive failed', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async () => {
    if (!user || !post || !canDelete) return;
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;

    setSaving(true);
    try {
      await api.deleteBlogPost(post.id, user.id);
      addToast({ type: 'success', title: 'Post deleted', message: 'The draft or archived post was removed.' });
      navigate(previousPage);
    } catch (err) {
      setError(err.message || 'Failed to delete post');
      addToast({ type: 'error', title: 'Delete failed', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="blogs-page">
        <div className="container blogs-shell">
          <div className="blog-empty">Sign in to create and edit blog posts.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="blogs-page">
      <div className="container blog-editor">
        <div className="blogs-header">
          <div>
            <span className="badge badge-primary">{isNew ? 'New Post' : `Editing ${post?.status || 'post'}`}</span>
            <h2>{isNew ? 'Create Blog Post' : 'Edit Blog Post'}</h2>
            <p>Use a simple textarea editor. Public posts must stay educational and non-advisory.</p>
          </div>
          <Link to={previousPage} className="btn btn-outline">Back</Link>
        </div>

        {loading && <div className="blog-empty">Loading editor...</div>}
        {error && <div className="blog-alert blog-alert--error">{error}</div>}

        {!loading && (
          <div className="blog-editor__layout">
            <form className="blog-editor__form" onSubmit={(e) => { e.preventDefault(); saveDraft(); }}>
              <label>
                <span>Title</span>
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  maxLength={160}
                  required
                />
              </label>

              <label>
                <span>Excerpt</span>
                <textarea
                  className="input blog-editor__excerpt"
                  value={form.excerpt}
                  onChange={(e) => updateField('excerpt', e.target.value)}
                  maxLength={500}
                />
              </label>

              <label>
                <span>Cover Image URL</span>
                <input
                  className="input"
                  value={form.cover_image_url}
                  onChange={(e) => updateField('cover_image_url', e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                />
              </label>

              <label>
                <span>Stock Tags</span>
                <input
                  className="input"
                  value={form.stock_tags}
                  onChange={(e) => updateField('stock_tags', e.target.value)}
                  placeholder="$SCT, $HEAL"
                />
              </label>

              <label>
                <span>Content</span>
                <textarea
                  className="input blog-editor__content"
                  value={form.content}
                  onChange={(e) => updateField('content', e.target.value)}
                  required
                />
              </label>

              <div className="blog-editor__actions">
                <button type="submit" className="btn btn-outline" disabled={saving}>
                  {post?.status === 'published' ? 'Save Changes' : 'Save Draft'}
                </button>
                <button type="button" className="btn btn-primary" onClick={publishPost} disabled={saving}>Publish</button>
                {post && post.status === 'published' && (
                  <button type="button" className="btn btn-outline" onClick={archivePost} disabled={saving}>Archive</button>
                )}
                {canDelete && (
                  <button type="button" className="btn btn-outline blog-danger-btn" onClick={deletePost} disabled={saving}>Delete</button>
                )}
              </div>
            </form>

            <aside className="blog-editor__preview">
              <h4>Preview</h4>
              {form.cover_image_url && <img src={form.cover_image_url} alt="" />}
              <h3>{form.title || 'Untitled post'}</h3>
              {previewTags.length > 0 && (
                <div className="blog-stock-tags blog-editor__tags">
                  {previewTags.map((tag) => (
                    <span key={tag} className="blog-stock-tag">${tag}</span>
                  ))}
                </div>
              )}
              {form.excerpt && <p>{form.excerpt}</p>}
              <div>{form.content || 'Start writing your post content...'}</div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
