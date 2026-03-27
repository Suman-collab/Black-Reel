import { useEffect, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import DataTable from '../components/DataTable';
import StatePanel from '../components/StatePanel';
import { createContent, deleteContent, getContent, updateContent } from '../features/content/content.service';

const emptyContent = {
  title: '',
  type: 'Movie',
  genre: 'Drama',
  description: '',
  thumbnailUrl: '',
  featured: false,
  isPremium: false,
};

const ContentManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contentItems, setContentItems] = useState([]);
  const [editingContent, setEditingContent] = useState(null);
  const [formState, setFormState] = useState(emptyContent);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getContent();

        if (isMounted) {
          setContentItems(data);
        }
      } catch (apiError) {
        if (isMounted) {
          setError(apiError.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadContent();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredContent = useMemo(() => {
    return contentItems.filter((item) => item.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [contentItems, searchTerm]);

  const openCreateModal = () => {
    setEditingContent(null);
    setFormState(emptyContent);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingContent(item);
    setFormState({
      title: item.title,
      type: item.type,
      genre: item.genre,
      description: item.description || item.desc,
      thumbnailUrl: item.thumbnailUrl || item.image,
      featured: Boolean(item.featured),
      isPremium: Boolean(item.isPremium),
    });
    setIsModalOpen(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...formState,
        heroImageUrl: formState.thumbnailUrl,
      };

      if (editingContent) {
        const updated = await updateContent(editingContent.id, payload);
        setContentItems((current) => current.map((item) => (item.id === editingContent.id ? updated : item)));
      } else {
        const created = await createContent(payload);
        setContentItems((current) => [created, ...current]);
      }

      setIsModalOpen(false);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) {
      return;
    }

    try {
      await deleteContent(item.id);
      setContentItems((current) => current.filter((contentItem) => contentItem.id !== item.id));
    } catch (apiError) {
      setError(apiError.message);
    }
  };

  if (loading) {
    return <StatePanel title="Loading content" message="Fetching the live movie and series catalog." />;
  }

  if (error && contentItems.length === 0) {
    return <StatePanel title="Content unavailable" message={error} />;
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type' },
    { key: 'genre', label: 'Genre' },
    { key: 'views', label: 'Total Views' },
    { key: 'rating', label: 'Rating' }
  ];

  return (
    <div className="admin-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Content Management</h1>
          <p>Add, edit, or remove movies and series.</p>
          {error ? <p style={{ color: '#ffb3b3' }}>{error}</p> : null}
        </div>
        <button className="action-btn primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={openCreateModal}>
          <Plus size={18} /> Add Content
        </button>
      </div>

      <div className="page-controls">
        <input
          type="text"
          placeholder="Search content by title..."
          className="search-input"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredContent}
        actions={['edit', 'delete']}
        onAction={(action, row) => {
          if (action === 'edit') openEditModal(row);
          if (action === 'delete') handleDelete(row);
        }}
      />

      {isModalOpen ? (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1a1a1a', padding: '2rem', borderRadius: '12px', width: '500px', border: '1px solid #333', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{editingContent ? 'Edit Content' : 'Add New Content'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input className="search-input" placeholder="Title" value={formState.title} onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))} required />
              <textarea className="search-input" placeholder="Description" value={formState.description} onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))} style={{ minHeight: '90px', resize: 'vertical' }} required />
              <input className="search-input" placeholder="Thumbnail URL" value={formState.thumbnailUrl} onChange={(event) => setFormState((current) => ({ ...current, thumbnailUrl: event.target.value }))} required />
              <select className="filter-select" value={formState.type} onChange={(event) => setFormState((current) => ({ ...current, type: event.target.value }))}>
                <option value="Movie">Movie</option>
                <option value="Series">Series</option>
              </select>
              <select className="filter-select" value={formState.genre} onChange={(event) => setFormState((current) => ({ ...current, genre: event.target.value }))}>
                <option value="Drama">Drama</option>
                <option value="Action">Action</option>
                <option value="Thriller">Thriller</option>
                <option value="Comedy">Comedy</option>
                <option value="Mystery">Mystery</option>
                <option value="Originals">Originals</option>
                <option value="Romance">Romance</option>
                <option value="History">History</option>
              </select>
              <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="checkbox" checked={formState.featured} onChange={(event) => setFormState((current) => ({ ...current, featured: event.target.checked }))} />
                Featured title
              </label>
              <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="checkbox" checked={formState.isPremium} onChange={(event) => setFormState((current) => ({ ...current, isPremium: event.target.checked }))} />
                Premium only
              </label>

              <button type="submit" className="action-btn primary" style={{ marginTop: '1rem' }} disabled={saving}>
                {saving ? 'Saving...' : editingContent ? 'Update Content' : 'Save Content'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ContentManagement;
