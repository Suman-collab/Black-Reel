import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X, Upload, Film, Image, Video, Trash2, Play, Monitor, Eye } from 'lucide-react';
import DataTable from '../components/DataTable';
import StatePanel from '../components/StatePanel';
import { createContent, deleteContent, getContent, updateContent } from '../features/content/content.service';

/* ─── helpers ──────────────────────────────────────────── */
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

/* ─── empty form state ─────────────────────────────────── */
const emptyContent = {
  title: '',
  type: 'Series',
  genre: 'Drama',
  description: '',
  accessLevel: 'free',
  maturityRating: 'PG-13',
  releaseYear: new Date().getFullYear(),
  language: 'English',
  status: 'published',
  // series fields
  seasonNumber: '',
  episodeNumber: '',
  episodeTitle: '',
  isFreeEpisode: false,
};

/* ═══════════════════════════════════════════════════════
   DROP ZONE COMPONENT
   ═══════════════════════════════════════════════════════ */
const DropZone = ({ label, accept, maxSizeMB, icon: Icon, preview, onFile, onClear, hint, isVideo }) => {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const maxBytes = maxSizeMB * 1024 * 1024;

  const handleFile = (file) => {
    setError('');
    if (!file) return;
    if (file.size > maxBytes) {
      setError(`File exceeds ${maxSizeMB}MB limit (${formatFileSize(file.size)})`);
      return;
    }
    onFile(file);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }, [onFile]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  const onDragLeave = useCallback(() => setIsDragging(false), []);

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon size={16} style={{ color: 'var(--brand-primary)' }} />
        {label}
        {hint && <span style={{ fontSize: '11px', color: '#666', fontWeight: 400 }}>({hint})</span>}
      </label>

      {preview ? (
        <div style={{
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#0a0a0c',
        }}
          onClick={() => inputRef.current?.click()}
        >
          {isVideo ? (
            <video
              src={preview}
              controls
              style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', background: '#000' }}
            />
          ) : (
            <img
              src={preview}
              alt={label}
              style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}
            />
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear(); setError(''); }}
            style={{
              position: 'absolute', top: '8px', right: '8px',
              background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%',
              width: '32px', height: '32px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ff4444',
            }}
          >
            <Trash2 size={14} />
          </button>
          <div style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            background: 'rgba(0,0,0,0.65)',
            color: '#ddd',
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.14)',
            pointerEvents: 'none',
          }}>
            Drop or click to replace
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={(e) => handleFile(e.target.files?.[0])}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: isDragging
              ? '2px solid var(--brand-primary)'
              : '2px dashed rgba(255,255,255,0.12)',
            borderRadius: '12px',
            padding: '28px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragging
              ? 'rgba(229, 9, 20, 0.06)'
              : 'rgba(255,255,255,0.02)',
            transition: 'all 0.2s ease',
          }}
        >
          <Upload size={24} style={{ color: isDragging ? 'var(--brand-primary)' : '#555', marginBottom: '8px' }} />
          <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>
            Drag & drop or <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>browse</span>
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#555' }}>
            Max {maxSizeMB >= 1024 ? `${maxSizeMB / 1024}GB` : `${maxSizeMB}MB`} · {accept.replace(/\./g, '').toUpperCase()}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={(e) => handleFile(e.target.files?.[0])}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {error && (
        <p style={{ margin: 0, fontSize: '12px', color: '#ff4444', fontWeight: 500 }}>⚠️ {error}</p>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   UPLOAD PROGRESS BAR
   ═══════════════════════════════════════════════════════ */
const ProgressBar = ({ progress, label }) => (
  <div style={{ marginTop: '8px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <span style={{ fontSize: '12px', color: '#aaa' }}>{label}</span>
      <span style={{ fontSize: '12px', color: 'var(--brand-primary)', fontWeight: 600 }}>{progress}%</span>
    </div>
    <div style={{
      height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
    }}>
      <div style={{
        height: '100%', width: `${progress}%`,
        background: 'linear-gradient(90deg, var(--brand-primary), #ff6b35)',
        borderRadius: '4px',
        transition: 'width 0.3s ease',
      }} />
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
const ContentManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contentItems, setContentItems] = useState([]);
  const [editingContent, setEditingContent] = useState(null);
  const [formState, setFormState] = useState(emptyContent);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // File states
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [heroFile, setHeroFile] = useState(null);
  const [heroPreview, setHeroPreview] = useState('');
  const [trailerFile, setTrailerFile] = useState(null);
  const [trailerPreview, setTrailerPreview] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');

  useEffect(() => {
    if (!isModalOpen) return undefined;

    const preventWindowDrop = (event) => {
      event.preventDefault();
    };

    window.addEventListener('dragover', preventWindowDrop);
    window.addEventListener('drop', preventWindowDrop);

    return () => {
      window.removeEventListener('dragover', preventWindowDrop);
      window.removeEventListener('drop', preventWindowDrop);
    };
  }, [isModalOpen]);

  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getContent();
        if (isMounted) setContentItems(data);
      } catch (apiError) {
        if (isMounted) setError(apiError.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadContent();
    return () => { isMounted = false; };
  }, []);

  const filteredContent = useMemo(() => {
    return contentItems.filter((item) => item.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [contentItems, searchTerm]);

  /* ─── file helpers ───────────────────────────────────── */
  const setFileWithPreview = (file, setFile, setPreview) => {
    setFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  const clearAllFiles = () => {
    setThumbnailFile(null); setThumbnailPreview('');
    setHeroFile(null); setHeroPreview('');
    setTrailerFile(null); setTrailerPreview('');
    setVideoFile(null); setVideoPreview('');
    setUploadProgress(0);
  };

  /* ─── modal openers ──────────────────────────────────── */
  const openCreateModal = () => {
    setEditingContent(null);
    setFormState(emptyContent);
    clearAllFiles();
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingContent(item);
    setFormState({
      title: item.title,
      type: item.type,
      genre: item.genre,
      description: item.description || item.desc,
      accessLevel: item.accessLevel || (item.isPremium ? 'premium' : 'free'),
      maturityRating: item.maturityRating || 'PG-13',
      releaseYear: item.releaseYear || new Date().getFullYear(),
      language: item.language || 'English',
      status: item.status || 'published',
      seasonNumber: item.seasonNumber || '',
      episodeNumber: item.episodeNumber || '',
      episodeTitle: item.episodeTitle || '',
      isFreeEpisode: Boolean(item.isFreeEpisode),
    });
    clearAllFiles();
    // Set existing previews
    if (item.thumbnailUrl) setThumbnailPreview(item.thumbnailUrl);
    if (item.heroImageUrl) setHeroPreview(item.heroImageUrl);
    if (item.trailerUrl) setTrailerPreview(item.trailerUrl);
    if (item.videoUrl) setVideoPreview(item.videoUrl);
    setIsModalOpen(true);
  };

  /* ─── save handler ───────────────────────────────────── */
  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();

      // Append text fields
      Object.entries(formState).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      // Append files
      if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
      if (heroFile) formData.append('heroBanner', heroFile);
      if (trailerFile) formData.append('trailer', trailerFile);
      if (videoFile) formData.append('video', videoFile);

      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 5, 90));
      }, 500);

      let result;
      if (editingContent) {
        result = await updateContent(editingContent.id, formData);
        setContentItems((current) => current.map((item) => (item.id === editingContent.id ? result : item)));
      } else {
        result = await createContent(formData);
        setContentItems((current) => [result, ...current]);
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        setIsModalOpen(false);
        clearAllFiles();
      }, 500);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSaving(false);
    }
  };

  /* ─── delete handler ─────────────────────────────────── */
  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"? This will also remove all Cloudinary assets.`)) return;
    try {
      await deleteContent(item.id);
      setContentItems((current) => current.filter((ci) => ci.id !== item.id));
    } catch (apiError) {
      setError(apiError.message);
    }
  };

  /* ─── loading / error states ─────────────────────────── */
  if (loading) {
    return <StatePanel title="Loading content" message="Fetching the live movie and series catalog." />;
  }

  if (error && contentItems.length === 0) {
    return <StatePanel title="Content unavailable" message={error} />;
  }

  /* ─── table columns ──────────────────────────────────── */
  const columns = [
    {
      key: 'thumbnailUrl',
      label: '',
      render: (value) => (
        <img
          src={value}
          alt=""
          style={{ width: '48px', height: '68px', objectFit: 'cover', borderRadius: '6px', background: '#1a1a1e' }}
        />
      ),
    },
    { key: 'title', label: 'Title' },
    {
      key: 'type',
      label: 'Type',
      render: (value) => (
        <span className={`badge ${String(value).toLowerCase() === 'movie' ? 'badge-blue' : 'badge-basic'}`}>{value}</span>
      ),
    },
    { key: 'genre', label: 'Genre' },
    {
      key: 'accessLevel',
      label: 'Access',
      render: (value) => (
        <span className={`badge ${value === 'premium' ? 'badge-premium' : 'badge-green'}`}
          style={value === 'premium' ? { background: 'rgba(229,9,20,0.15)', color: '#e50914', border: '1px solid rgba(229,9,20,0.3)' } : {}}>
          {value === 'premium' ? '★ Premium' : 'Free'}
        </span>
      ),
    },
    { key: 'views', label: 'Views' },
    {
      key: 'rating',
      label: 'Rating',
      render: (value) => (
        <span style={{ color: 'var(--text-gold)', fontWeight: '600' }}>⭐ {value || '0.0'}</span>
      ),
    },
  ];

  /* ─── modal styles ───────────────────────────────────── */
  const modalBackdropStyle = {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    padding: '40px 20px',
    overflowY: 'auto',
  };

  const modalStyle = {
    background: 'linear-gradient(145deg, #141418, #0d0d10)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    width: '100%', maxWidth: '720px',
    padding: '32px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
    animation: 'slideUp 0.3s ease',
  };

  const sectionStyle = {
    padding: '20px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.04)',
  };

  const sectionTitleStyle = {
    fontSize: '13px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#666',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Content Management</h1>
          <p className="admin-page-subtitle">Publish, update, and manage movies, series, and episodes with media uploads.</p>
        </div>
        <button
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '44px' }}
          onClick={openCreateModal}
        >
          <Plus size={18} /> Add Content
        </button>
      </div>

      <div className="admin-page-controls">
        <input
          type="text"
          placeholder="Search catalog by title..."
          className="search-input"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '8px', color: '#ff4444', fontSize: '13px' }}>
          ⚠️ {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredContent}
        actions={['edit', 'delete']}
        onAction={(action, row) => {
          if (action === 'edit') openEditModal(row);
          if (action === 'delete') handleDelete(row);
        }}
      />

      {/* ═══════ NETFLIX-STYLE PUBLISH MODAL ═══════ */}
      {isModalOpen && (
        <div style={modalBackdropStyle} onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div style={modalStyle}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <div>
                <h2 style={{
                  margin: 0, fontSize: '22px', fontWeight: '700',
                  background: 'linear-gradient(135deg, #fff, #aaa)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  {editingContent ? 'Edit Catalog Title' : '🎬 Publish New Title'}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#555' }}>
                  {editingContent ? 'Update content details and media files' : 'Upload media and configure your new title'}
                </p>
              </div>
              <button
                onClick={() => { setIsModalOpen(false); clearAllFiles(); }}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px', width: '40px', height: '40px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888',
                  transition: 'all 0.2s',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* ── SECTION: Basic Info ──────────────────── */}
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}><Film size={14} /> Basic Information</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Title</label>
                    <input className="form-input" placeholder="e.g. Black Mirror: Season 7" value={formState.title}
                      onChange={(e) => setFormState((s) => ({ ...s, title: e.target.value }))} required />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Description</label>
                    <textarea className="form-input" placeholder="A compelling plot overview..." value={formState.description}
                      onChange={(e) => setFormState((s) => ({ ...s, description: e.target.value }))}
                      style={{ minHeight: '80px', resize: 'vertical', paddingTop: '12px' }} required />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Type</label>
                      <select className="form-input" style={{ padding: '0 var(--space-2)' }} value={formState.type}
                        onChange={(e) => setFormState((s) => ({ ...s, type: e.target.value }))}>
                        <option value="Series">Series</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Genre</label>
                      <select className="form-input" style={{ padding: '0 var(--space-2)' }} value={formState.genre}
                        onChange={(e) => setFormState((s) => ({ ...s, genre: e.target.value }))}>
                        {['Drama', 'Action', 'Thriller', 'Comedy', 'Mystery', 'Originals', 'Romance', 'History', 'Horror', 'Sci-Fi', 'Documentary'].map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Release Year</label>
                      <input className="form-input" type="number" min="1900" max="2030" value={formState.releaseYear}
                        onChange={(e) => setFormState((s) => ({ ...s, releaseYear: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Language</label>
                      <select className="form-input" style={{ padding: '0 var(--space-2)' }} value={formState.language}
                        onChange={(e) => setFormState((s) => ({ ...s, language: e.target.value }))}>
                        {['English', 'Hindi', 'Telugu', 'Tamil', 'Malayalam', 'Kannada', 'Bengali', 'Marathi', 'Spanish', 'French', 'Korean', 'Japanese'].map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Maturity</label>
                      <select className="form-input" style={{ padding: '0 var(--space-2)' }} value={formState.maturityRating}
                        onChange={(e) => setFormState((s) => ({ ...s, maturityRating: e.target.value }))}>
                        {['G', 'PG', 'PG-13', 'TV-14', 'R', '18+', 'TV-MA'].map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SECTION: Media Uploads ──────────────── */}
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}><Image size={14} /> Media Assets</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <DropZone
                    label="Thumbnail"
                    accept=".jpg,.jpeg,.png,.webp"
                    maxSizeMB={10}
                    icon={Image}
                    hint="Poster artwork"
                    preview={thumbnailPreview}
                    onFile={(f) => setFileWithPreview(f, setThumbnailFile, setThumbnailPreview)}
                    onClear={() => { setThumbnailFile(null); setThumbnailPreview(''); }}
                  />
                  <DropZone
                    label="Hero Banner"
                    accept=".jpg,.jpeg,.png,.webp"
                    maxSizeMB={10}
                    icon={Monitor}
                    hint="1920×1080 recommended"
                    preview={heroPreview}
                    onFile={(f) => setFileWithPreview(f, setHeroFile, setHeroPreview)}
                    onClear={() => { setHeroFile(null); setHeroPreview(''); }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                  <DropZone
                    label="Trailer"
                    accept=".mp4,.mov,.webm"
                    maxSizeMB={200}
                    icon={Play}
                    hint="2-3 min preview"
                    isVideo
                    preview={trailerPreview}
                    onFile={(f) => setFileWithPreview(f, setTrailerFile, setTrailerPreview)}
                    onClear={() => { setTrailerFile(null); setTrailerPreview(''); }}
                  />
                  <DropZone
                    label="Full Video"
                    accept=".mp4,.mov,.webm"
                    maxSizeMB={5120}
                    icon={Video}
                    hint="Full movie / episode"
                    isVideo
                    preview={videoPreview}
                    onFile={(f) => setFileWithPreview(f, setVideoFile, setVideoPreview)}
                    onClear={() => { setVideoFile(null); setVideoPreview(''); }}
                  />
                </div>
              </div>

              {/* ── SECTION: Series Fields (conditional) ── */}
              {formState.type === 'Series' && (
                <div style={sectionStyle}>
                  <div style={sectionTitleStyle}><Film size={14} /> Episode Details</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '14px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Season #</label>
                      <input className="form-input" type="number" min="1" placeholder="1" value={formState.seasonNumber}
                        onChange={(e) => setFormState((s) => ({ ...s, seasonNumber: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Episode #</label>
                      <input className="form-input" type="number" min="1" placeholder="1" value={formState.episodeNumber}
                        onChange={(e) => {
                          const epNum = parseInt(e.target.value, 10);
                          setFormState((s) => ({
                            ...s,
                            episodeNumber: e.target.value,
                            isFreeEpisode: epNum === 1 ? true : s.isFreeEpisode,
                          }));
                        }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Episode Title</label>
                      <input className="form-input" placeholder="e.g. The Beginning" value={formState.episodeTitle}
                        onChange={(e) => setFormState((s) => ({ ...s, episodeTitle: e.target.value }))} />
                    </div>
                  </div>

                  <label style={{
                    display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer',
                    fontSize: '13px', marginTop: '14px', color: '#aaa',
                    padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <input type="checkbox" checked={formState.isFreeEpisode}
                      onChange={(e) => setFormState((s) => ({ ...s, isFreeEpisode: e.target.checked }))}
                      style={{ accentColor: '#22c55e', width: '16px', height: '16px' }} />
                    <span>
                      <strong style={{ color: '#22c55e' }}>Free Episode</strong>
                      <span style={{ marginLeft: '6px', color: '#666' }}>— Accessible without subscription</span>
                    </span>
                  </label>

                  {formState.episodeNumber && parseInt(formState.episodeNumber, 10) === 1 && (
                    <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#22c55e' }}>
                      💡 Episode 1 is automatically suggested as a free episode
                    </p>
                  )}
                </div>
              )}

              {/* ── SECTION: Access & Status ───────────── */}
              <div style={sectionStyle}>
                <div style={sectionTitleStyle}><Eye size={14} /> Access & Visibility</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Access Level</label>
                    <select className="form-input" style={{ padding: '0 var(--space-2)' }} value={formState.accessLevel}
                      onChange={(e) => setFormState((s) => ({ ...s, accessLevel: e.target.value }))}>
                      <option value="free">Free — Everyone can watch</option>
                      <option value="premium">Premium — Subscribers only</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Publish Status</label>
                    <select className="form-input" style={{ padding: '0 var(--space-2)' }} value={formState.status}
                      onChange={(e) => setFormState((s) => ({ ...s, status: e.target.value }))}>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* ── Upload Progress ─────────────────────── */}
              {saving && uploadProgress > 0 && (
                <ProgressBar
                  progress={uploadProgress}
                  label={uploadProgress >= 100 ? 'Upload complete!' : 'Uploading media files...'}
                />
              )}

              {/* ── Submit Button ──────────────────────── */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{
                  height: '52px', fontSize: '15px', fontWeight: '700',
                  background: saving
                    ? (editingContent ? 'rgba(34,197,94,0.45)' : 'rgba(229,9,20,0.4)')
                    : (editingContent
                      ? 'linear-gradient(135deg, #22c55e, #15803d)'
                      : 'linear-gradient(135deg, #e50914, #b81d24)'),
                  borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {saving ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                    {uploadProgress < 100 ? 'Uploading...' : 'Finalizing...'}
                  </>
                ) : (
                  <>
                    {editingContent ? 'Update Title' : 'Publish Title'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ContentManagement;
