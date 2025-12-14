import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  GripVertical,
  Type,
  Image,
  Quote,
  Info,
  Table,
  List,
  Columns,
  Grid,
  Megaphone,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { blogCategories, BlogCategory, ContentBlockType } from '../../lib/blog-types';

// API configuration
const API_BASE = process.env.NODE_ENV === 'production'
  ? '/api/blog'
  : '/.netlify/functions/blog';

// Types
interface Author {
  id: string;
  name: string;
  role?: string;
  bio?: string;
  avatarUrl?: string;
}

interface ContentBlock {
  id: string;
  blockType: ContentBlockType;
  content: string;
  sortOrder: number;
  metadata?: Record<string, unknown> | null;
}

interface BlogPostData {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  tags: string[];
  featuredImage?: string;
  iconName?: string;
  authorId?: string;
  publishedAt?: string;
  readTime: number;
  featured: boolean;
  status: 'draft' | 'published';
  blocks: ContentBlock[];
}

// Block template definitions
const blockTemplates: {
  type: ContentBlockType;
  label: string;
  icon: React.ReactNode;
  description: string;
  defaultContent: string;
}[] = [
  {
    type: 'text',
    label: 'Text Block',
    icon: <Type className="w-5 h-5" />,
    description: 'Paragraph text',
    defaultContent: ''
  },
  {
    type: 'heading',
    label: 'Heading',
    icon: <Type className="w-5 h-5 font-bold" />,
    description: 'Section headings (H2, H3, H4)',
    defaultContent: JSON.stringify({ text: '', level: 2 })
  },
  {
    type: 'image',
    label: 'Image',
    icon: <Image className="w-5 h-5" />,
    description: 'Full-width or inline images',
    defaultContent: JSON.stringify({ src: '', alt: '', caption: '' })
  },
  {
    type: 'quote',
    label: 'Quote',
    icon: <Quote className="w-5 h-5" />,
    description: 'Pull quote with attribution',
    defaultContent: JSON.stringify({ text: '', author: '', role: '' })
  },
  {
    type: 'info-box',
    label: 'Info Box',
    icon: <Info className="w-5 h-5" />,
    description: 'Highlighted tip or important info',
    defaultContent: JSON.stringify({ title: '', text: '', icon: 'info' })
  },
  {
    type: 'table',
    label: 'Table',
    icon: <Table className="w-5 h-5" />,
    description: 'Data table with headers',
    defaultContent: JSON.stringify({ headers: ['Column 1', 'Column 2'], rows: [['', '']] })
  },
  {
    type: 'list',
    label: 'List',
    icon: <List className="w-5 h-5" />,
    description: 'Bullet or numbered list',
    defaultContent: JSON.stringify({ items: [''], ordered: false })
  },
  {
    type: 'two-column',
    label: 'Two Column',
    icon: <Columns className="w-5 h-5" />,
    description: 'Side-by-side content layout',
    defaultContent: JSON.stringify({ left: '', right: '' })
  },
  {
    type: 'gallery',
    label: 'Gallery',
    icon: <Grid className="w-5 h-5" />,
    description: 'Image gallery grid',
    defaultContent: JSON.stringify({ images: [] })
  },
  {
    type: 'cta',
    label: 'Call to Action',
    icon: <Megaphone className="w-5 h-5" />,
    description: 'Button with heading and text',
    defaultContent: JSON.stringify({ title: '', text: '', buttonText: '', buttonLink: '' })
  },
];

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Helper to generate unique ID
function generateId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface Props {
  postId?: string; // If provided, we're editing an existing post
  onSave?: () => void;
  onCancel?: () => void;
}

const BlogPostEditor: React.FC<Props> = ({ postId, onSave, onCancel }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

  // Form state
  const [formData, setFormData] = useState<BlogPostData>({
    slug: '',
    title: '',
    excerpt: '',
    category: 'design-tips',
    tags: [],
    featuredImage: '',
    iconName: '',
    authorId: '',
    readTime: 5,
    featured: false,
    status: 'draft',
    blocks: [],
  });

  const [tagInput, setTagInput] = useState('');

  // Fetch authors on mount
  useEffect(() => {
    fetchAuthors();
    if (postId) {
      fetchPost(postId);
    }
  }, [postId]);

  const getAuthToken = () => {
    return localStorage.getItem('admin_token');
  };

  const fetchAuthors = async () => {
    try {
      const response = await fetch(`${API_BASE}/authors`);
      const data = await response.json();
      if (data.success) {
        setAuthors(data.authors);
      }
    } catch (err) {
      console.error('Failed to fetch authors:', err);
    }
  };

  const fetchPost = async (id: string) => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/admin/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        const post = data.posts.find((p: { id: string }) => p.id === id);
        if (post) {
          setFormData({
            id: post.id,
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt || '',
            category: post.category,
            tags: post.tags || [],
            featuredImage: post.featuredImage || '',
            iconName: post.iconName || '',
            authorId: post.authorId || '',
            publishedAt: post.publishedAt,
            readTime: post.readTime || 5,
            featured: post.featured || false,
            status: post.status || 'draft',
            blocks: post.blocks?.map((b: ContentBlock, index: number) => ({
              id: b.id || generateId(),
              blockType: b.blockType,
              content: b.content,
              sortOrder: b.sortOrder ?? index,
              metadata: b.metadata,
            })) || [],
          });
          // Expand all blocks by default when editing
          setExpandedBlocks(new Set(post.blocks?.map((b: ContentBlock) => b.id || generateId())));
        }
      }
    } catch (err) {
      setError('Failed to load post');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (publish = false) => {
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const token = getAuthToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      // Validate required fields
      if (!formData.title.trim()) {
        setError('Title is required');
        return;
      }

      const slug = formData.slug || generateSlug(formData.title);
      const payload = {
        ...formData,
        slug,
        status: publish ? 'published' : formData.status,
        publishedAt: publish && !formData.publishedAt ? new Date().toISOString() : formData.publishedAt,
        blocks: formData.blocks.map((block, index) => ({
          type: block.blockType,
          content: block.content,
          sortOrder: index,
          metadata: block.metadata,
        })),
      };

      const url = postId
        ? `${API_BASE}/admin/posts/${postId}`
        : `${API_BASE}/admin/posts`;

      const method = postId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(postId ? 'Post updated successfully!' : 'Post created successfully!');
        if (onSave) {
          setTimeout(onSave, 1000);
        }
      } else {
        setError(data.error || 'Failed to save post');
      }
    } catch (err) {
      setError('Failed to save post');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const addBlock = (type: ContentBlockType) => {
    const template = blockTemplates.find(t => t.type === type);
    if (!template) return;

    const newBlock: ContentBlock = {
      id: generateId(),
      blockType: type,
      content: template.defaultContent,
      sortOrder: formData.blocks.length,
    };

    setFormData(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }));
    setExpandedBlocks(prev => new Set(Array.from(prev).concat(newBlock.id)));
    setShowBlockPicker(false);
  };

  const updateBlock = (blockId: string, content: string) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.map(b =>
        b.id === blockId ? { ...b, content } : b
      ),
    }));
  };

  const deleteBlock = (blockId: string) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => b.id !== blockId),
    }));
  };

  const toggleBlockExpanded = (blockId: string) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(blockId)) {
        next.delete(blockId);
      } else {
        next.add(blockId);
      }
      return next;
    });
  };

  const handleReorder = (newOrder: ContentBlock[]) => {
    setFormData(prev => ({
      ...prev,
      blocks: newOrder,
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const updateFormField = <K extends keyof BlogPostData>(
    field: K,
    value: BlogPostData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#64a70b]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel || (() => navigate('/admin/blog'))}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {postId ? 'Edit Blog Post' : 'Create Blog Post'}
            </h1>
            <p className="text-gray-500 text-sm">
              {formData.status === 'published' ? 'Published' : 'Draft'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {formData.slug && (
            <a
              href={`/blog/${formData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview
            </a>
          )}
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#64a70b] text-white rounded-lg hover:bg-[#578f09] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {formData.status === 'published' ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700"
          >
            <AlertCircle className="w-5 h-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700"
          >
            <Check className="w-5 h-5" />
            {success}
            <button onClick={() => setSuccess(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Title */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter post title..."
              className="w-full px-4 py-3 text-xl font-semibold border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
            />
          </div>

          {/* Excerpt */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excerpt
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => updateFormField('excerpt', e.target.value)}
              placeholder="Brief description for the blog list..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none resize-none"
            />
          </div>

          {/* Content Blocks */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Content Blocks</h3>
              <button
                onClick={() => setShowBlockPicker(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#64a70b] text-white rounded-lg hover:bg-[#578f09] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Block
              </button>
            </div>

            {formData.blocks.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                <Type className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No content blocks yet</p>
                <p className="text-gray-400 text-sm mt-1">Click "Add Block" to start building your post</p>
              </div>
            ) : (
              <Reorder.Group
                axis="y"
                values={formData.blocks}
                onReorder={handleReorder}
                className="space-y-3"
              >
                {formData.blocks.map((block) => (
                  <Reorder.Item
                    key={block.id}
                    value={block}
                    className="bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-2 p-3 cursor-move">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <div className="w-8 h-8 rounded bg-[#183028] flex items-center justify-center text-[#64a70b]">
                        {blockTemplates.find(t => t.type === block.blockType)?.icon}
                      </div>
                      <span className="font-medium text-gray-700 flex-1">
                        {blockTemplates.find(t => t.type === block.blockType)?.label}
                      </span>
                      <button
                        onClick={() => toggleBlockExpanded(block.id)}
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                      >
                        {expandedBlocks.has(block.id) ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteBlock(block.id)}
                        className="p-1.5 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <AnimatePresence>
                      {expandedBlocks.has(block.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3">
                            <BlockEditor
                              block={block}
                              onChange={(content) => updateBlock(block.id, content)}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Post Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Post Settings</h3>

            <div className="space-y-4">
              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => updateFormField('slug', e.target.value)}
                  placeholder="post-url-slug"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => updateFormField('category', e.target.value as BlogCategory)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                >
                  {blogCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Author */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Author
                </label>
                <select
                  value={formData.authorId || ''}
                  onChange={(e) => updateFormField('authorId', e.target.value || undefined)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                >
                  <option value="">No author</option>
                  {authors.map(author => (
                    <option key={author.id} value={author.id}>{author.name}</option>
                  ))}
                </select>
              </div>

              {/* Read Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Read Time (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.readTime}
                  onChange={(e) => updateFormField('readTime', parseInt(e.target.value) || 5)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                />
              </div>

              {/* Featured */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => updateFormField('featured', e.target.checked)}
                  className="w-4 h-4 text-[#64a70b] border-gray-300 rounded focus:ring-[#64a70b]"
                />
                <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                  Featured post
                </label>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Tags</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
              />
              <button
                onClick={addTag}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 bg-[#64a70b]/10 text-[#64a70b] text-sm rounded-lg"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Featured Image</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="text"
                value={formData.featuredImage || ''}
                onChange={(e) => updateFormField('featuredImage', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
              />
              {formData.featuredImage && (
                <img
                  src={formData.featuredImage}
                  alt="Featured"
                  className="mt-3 w-full h-32 object-cover rounded-lg"
                />
              )}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon Name (fallback)
              </label>
              <input
                type="text"
                value={formData.iconName || ''}
                onChange={(e) => updateFormField('iconName', e.target.value)}
                placeholder="e.g., FileText, Palette"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Block Picker Modal */}
      <AnimatePresence>
        {showBlockPicker && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBlockPicker(false)}
          >
            <motion.div
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Add Content Block</h2>
                <button
                  onClick={() => setShowBlockPicker(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {blockTemplates.map((template) => (
                    <button
                      key={template.type}
                      onClick={() => addBlock(template.type)}
                      className="p-4 border-2 border-gray-200 rounded-xl hover:border-[#64a70b] hover:bg-[#64a70b]/5 transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#183028] flex items-center justify-center text-[#64a70b] mb-3 group-hover:scale-110 transition-transform">
                        {template.icon}
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">{template.label}</h4>
                      <p className="text-xs text-gray-500">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Block Editor Component - renders different editors based on block type
interface BlockEditorProps {
  block: ContentBlock;
  onChange: (content: string) => void;
}

const BlockEditor: React.FC<BlockEditorProps> = ({ block, onChange }) => {
  const parseContent = () => {
    try {
      return JSON.parse(block.content);
    } catch {
      return block.content;
    }
  };

  const updateJson = (updates: Record<string, unknown>) => {
    const current = parseContent();
    onChange(JSON.stringify({ ...current, ...updates }));
  };

  switch (block.blockType) {
    case 'text':
      return (
        <textarea
          value={block.content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter paragraph text..."
          rows={4}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none resize-none"
        />
      );

    case 'heading':
      const headingData = parseContent();
      return (
        <div className="space-y-3">
          <div className="flex gap-2">
            <select
              value={headingData.level || 2}
              onChange={(e) => updateJson({ level: parseInt(e.target.value) })}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
            >
              <option value={2}>H2</option>
              <option value={3}>H3</option>
              <option value={4}>H4</option>
            </select>
            <input
              type="text"
              value={headingData.text || ''}
              onChange={(e) => updateJson({ text: e.target.value })}
              placeholder="Heading text..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
            />
          </div>
        </div>
      );

    case 'quote':
      const quoteData = parseContent();
      return (
        <div className="space-y-3">
          <textarea
            value={quoteData.text || ''}
            onChange={(e) => updateJson({ text: e.target.value })}
            placeholder="Quote text..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={quoteData.author || ''}
              onChange={(e) => updateJson({ author: e.target.value })}
              placeholder="Author name"
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
            />
            <input
              type="text"
              value={quoteData.role || ''}
              onChange={(e) => updateJson({ role: e.target.value })}
              placeholder="Author role"
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
            />
          </div>
        </div>
      );

    case 'info-box':
      const infoData = parseContent();
      return (
        <div className="space-y-3">
          <input
            type="text"
            value={infoData.title || ''}
            onChange={(e) => updateJson({ title: e.target.value })}
            placeholder="Info box title..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
          />
          <textarea
            value={infoData.text || ''}
            onChange={(e) => updateJson({ text: e.target.value })}
            placeholder="Info box content..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none resize-none"
          />
        </div>
      );

    case 'image':
      const imageData = parseContent();
      return (
        <div className="space-y-3">
          <input
            type="text"
            value={imageData.src || ''}
            onChange={(e) => updateJson({ src: e.target.value })}
            placeholder="Image URL..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
          />
          <input
            type="text"
            value={imageData.alt || ''}
            onChange={(e) => updateJson({ alt: e.target.value })}
            placeholder="Alt text..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
          />
          <input
            type="text"
            value={imageData.caption || ''}
            onChange={(e) => updateJson({ caption: e.target.value })}
            placeholder="Caption (optional)..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
          />
          {imageData.src && (
            <img src={imageData.src} alt={imageData.alt || ''} className="w-full h-40 object-cover rounded-lg" />
          )}
        </div>
      );

    case 'list':
      const listData = parseContent();
      const items = listData.items || [''];
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={listData.ordered || false}
              onChange={(e) => updateJson({ ordered: e.target.checked })}
              className="w-4 h-4"
            />
            <label className="text-sm text-gray-600">Numbered list</label>
          </div>
          {items.map((item: string, index: number) => (
            <div key={index} className="flex gap-2">
              <span className="w-6 h-8 flex items-center justify-center text-gray-400 text-sm">
                {listData.ordered ? `${index + 1}.` : '•'}
              </span>
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[index] = e.target.value;
                  updateJson({ items: newItems });
                }}
                placeholder="List item..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
              />
              <button
                onClick={() => {
                  const newItems = items.filter((_: string, i: number) => i !== index);
                  updateJson({ items: newItems.length ? newItems : [''] });
                }}
                className="p-2 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => updateJson({ items: [...items, ''] })}
            className="flex items-center gap-1 text-sm text-[#64a70b] hover:text-[#578f09]"
          >
            <Plus className="w-4 h-4" />
            Add item
          </button>
        </div>
      );

    case 'two-column':
      const twoColData = parseContent();
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Left Column</label>
            <textarea
              value={twoColData.left || ''}
              onChange={(e) => updateJson({ left: e.target.value })}
              placeholder="Left column content..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Right Column</label>
            <textarea
              value={twoColData.right || ''}
              onChange={(e) => updateJson({ right: e.target.value })}
              placeholder="Right column content..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none resize-none"
            />
          </div>
        </div>
      );

    case 'cta':
      const ctaData = parseContent();
      return (
        <div className="space-y-3">
          <input
            type="text"
            value={ctaData.title || ''}
            onChange={(e) => updateJson({ title: e.target.value })}
            placeholder="CTA Title..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
          />
          <textarea
            value={ctaData.text || ''}
            onChange={(e) => updateJson({ text: e.target.value })}
            placeholder="CTA description..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={ctaData.buttonText || ''}
              onChange={(e) => updateJson({ buttonText: e.target.value })}
              placeholder="Button text"
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
            />
            <input
              type="text"
              value={ctaData.buttonLink || ''}
              onChange={(e) => updateJson({ buttonLink: e.target.value })}
              placeholder="Button link"
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
            />
          </div>
        </div>
      );

    case 'table':
      const tableData = parseContent();
      const headers = tableData.headers || ['Column 1', 'Column 2'];
      const rows = tableData.rows || [['', '']];

      return (
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-500 mb-1">Headers</div>
          <div className="flex gap-2">
            {headers.map((header: string, index: number) => (
              <input
                key={`header-${index}`}
                type="text"
                value={header}
                onChange={(e) => {
                  const newHeaders = [...headers];
                  newHeaders[index] = e.target.value;
                  updateJson({ headers: newHeaders });
                }}
                placeholder={`Column ${index + 1}`}
                className="flex-1 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
              />
            ))}
            <button
              onClick={() => updateJson({
                headers: [...headers, `Column ${headers.length + 1}`],
                rows: rows.map((row: string[]) => [...row, ''])
              })}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs font-medium text-gray-500 mb-1">Rows</div>
          {rows.map((row: string[], rowIndex: number) => (
            <div key={`row-${rowIndex}`} className="flex gap-2">
              {row.map((cell: string, cellIndex: number) => (
                <input
                  key={`cell-${rowIndex}-${cellIndex}`}
                  type="text"
                  value={cell}
                  onChange={(e) => {
                    const newRows = [...rows];
                    newRows[rowIndex][cellIndex] = e.target.value;
                    updateJson({ rows: newRows });
                  }}
                  placeholder="Cell"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                />
              ))}
              <button
                onClick={() => {
                  const newRows = rows.filter((_: string[], i: number) => i !== rowIndex);
                  updateJson({ rows: newRows.length ? newRows : [headers.map(() => '')] });
                }}
                className="p-2 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => updateJson({ rows: [...rows, headers.map(() => '')] })}
            className="flex items-center gap-1 text-sm text-[#64a70b] hover:text-[#578f09]"
          >
            <Plus className="w-4 h-4" />
            Add row
          </button>
        </div>
      );

    case 'gallery':
      const galleryData = parseContent();
      const images = galleryData.images || [];

      return (
        <div className="space-y-3">
          {images.map((img: { src: string; alt: string; label?: string }, index: number) => (
            <div key={index} className="flex gap-2 items-start p-2 bg-gray-100 rounded-lg">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={img.src || ''}
                  onChange={(e) => {
                    const newImages = [...images];
                    newImages[index] = { ...img, src: e.target.value };
                    updateJson({ images: newImages });
                  }}
                  placeholder="Image URL..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={img.alt || ''}
                    onChange={(e) => {
                      const newImages = [...images];
                      newImages[index] = { ...img, alt: e.target.value };
                      updateJson({ images: newImages });
                    }}
                    placeholder="Alt text"
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                  />
                  <input
                    type="text"
                    value={img.label || ''}
                    onChange={(e) => {
                      const newImages = [...images];
                      newImages[index] = { ...img, label: e.target.value };
                      updateJson({ images: newImages });
                    }}
                    placeholder="Label (optional)"
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  const newImages = images.filter((_: { src: string; alt: string; label?: string }, i: number) => i !== index);
                  updateJson({ images: newImages });
                }}
                className="p-2 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => updateJson({ images: [...images, { src: '', alt: '', label: '' }] })}
            className="flex items-center gap-1 text-sm text-[#64a70b] hover:text-[#578f09]"
          >
            <Plus className="w-4 h-4" />
            Add image
          </button>
        </div>
      );

    default:
      return (
        <textarea
          value={block.content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter content..."
          rows={4}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none resize-none"
        />
      );
  }
};

export default BlogPostEditor;
