import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  GripVertical,
  X,
  Loader2,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  BarChart3,
  ListOrdered,
  Trophy,
  Image,
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';

// API configuration
const API_BASE = process.env.NODE_ENV === 'production'
  ? '/api/blog'
  : '/.netlify/functions/blog';

// Types
interface CaseStudyStat {
  id: string;
  value: string;
  label: string;
  sortOrder: number;
}

interface ProcessStep {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
}

interface CaseStudyResult {
  id: string;
  title: string;
  description: string;
  iconName?: string;
  sortOrder: number;
}

interface GalleryItem {
  id: string;
  iconName: string;
  label: string;
  imageUrl?: string;
  isLarge: boolean;
  sortOrder: number;
}

interface CaseStudyData {
  id?: string;
  slug: string;
  title: string;
  subtitle: string;
  clientName: string;
  clientLocation: string;
  industry: string;
  tags: string[];
  featuredImage?: string;
  iconName?: string;
  status: 'draft' | 'published';
  publishedAt?: string;
  challenge: string;
  solution: string;
  deliverables: string[];
  testimonialText?: string;
  testimonialAuthor?: string;
  testimonialRole?: string;
  stats: CaseStudyStat[];
  processSteps: ProcessStep[];
  results: CaseStudyResult[];
  gallery: GalleryItem[];
}

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Helper to generate unique ID
function generateId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface Props {
  caseStudyId?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

const CaseStudyEditor: React.FC<Props> = ({ caseStudyId, onSave, onCancel }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Collapsed sections state
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Form state
  const [formData, setFormData] = useState<CaseStudyData>({
    slug: '',
    title: '',
    subtitle: '',
    clientName: '',
    clientLocation: '',
    industry: '',
    tags: [],
    featuredImage: '',
    iconName: '',
    status: 'draft',
    challenge: '',
    solution: '',
    deliverables: [],
    testimonialText: '',
    testimonialAuthor: '',
    testimonialRole: '',
    stats: [],
    processSteps: [],
    results: [],
    gallery: [],
  });

  const [tagInput, setTagInput] = useState('');
  const [deliverableInput, setDeliverableInput] = useState('');

  // Fetch case study on mount if editing
  useEffect(() => {
    if (caseStudyId) {
      fetchCaseStudy(caseStudyId);
    }
  }, [caseStudyId]);

  const getAuthToken = () => {
    return localStorage.getItem('admin_token');
  };

  const fetchCaseStudy = async (id: string) => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/admin/case-studies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        const caseStudy = data.caseStudies.find((cs: { id: string }) => cs.id === id);
        if (caseStudy) {
          setFormData({
            id: caseStudy.id,
            slug: caseStudy.slug,
            title: caseStudy.title,
            subtitle: caseStudy.subtitle || '',
            clientName: caseStudy.clientName || '',
            clientLocation: caseStudy.clientLocation || '',
            industry: caseStudy.industry || '',
            tags: caseStudy.tags || [],
            featuredImage: caseStudy.featuredImage || '',
            iconName: caseStudy.iconName || '',
            status: caseStudy.status || 'draft',
            publishedAt: caseStudy.publishedAt,
            challenge: caseStudy.challenge || '',
            solution: caseStudy.solution || '',
            deliverables: caseStudy.deliverables || [],
            testimonialText: caseStudy.testimonialText || '',
            testimonialAuthor: caseStudy.testimonialAuthor || '',
            testimonialRole: caseStudy.testimonialRole || '',
            stats: caseStudy.stats?.map((s: CaseStudyStat, i: number) => ({
              id: s.id || generateId(),
              value: s.value,
              label: s.label,
              sortOrder: s.sortOrder ?? i,
            })) || [],
            processSteps: caseStudy.processSteps?.map((ps: ProcessStep, i: number) => ({
              id: ps.id || generateId(),
              title: ps.title,
              description: ps.description,
              sortOrder: ps.sortOrder ?? i,
            })) || [],
            results: caseStudy.results?.map((r: CaseStudyResult, i: number) => ({
              id: r.id || generateId(),
              title: r.title,
              description: r.description,
              iconName: r.iconName || '',
              sortOrder: r.sortOrder ?? i,
            })) || [],
            gallery: caseStudy.gallery?.map((g: GalleryItem, i: number) => ({
              id: g.id || generateId(),
              iconName: g.iconName || '',
              label: g.label || '',
              imageUrl: g.imageUrl || '',
              isLarge: g.isLarge || false,
              sortOrder: g.sortOrder ?? i,
            })) || [],
          });
        }
      }
    } catch (err) {
      setError('Failed to load case study');
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

      if (!formData.title.trim()) {
        setError('Title is required');
        return;
      }

      if (!formData.clientName.trim()) {
        setError('Client name is required');
        return;
      }

      const slug = formData.slug || generateSlug(formData.title);
      const payload = {
        ...formData,
        slug,
        status: publish ? 'published' : formData.status,
        publishedAt: publish && !formData.publishedAt ? new Date().toISOString() : formData.publishedAt,
        stats: formData.stats.map((s, i) => ({
          value: s.value,
          label: s.label,
          sortOrder: i,
        })),
        processSteps: formData.processSteps.map((ps, i) => ({
          title: ps.title,
          description: ps.description,
          sortOrder: i,
        })),
        results: formData.results.map((r, i) => ({
          title: r.title,
          description: r.description,
          iconName: r.iconName,
          sortOrder: i,
        })),
        gallery: formData.gallery.map((g, i) => ({
          iconName: g.iconName,
          label: g.label,
          imageUrl: g.imageUrl,
          isLarge: g.isLarge,
          sortOrder: i,
        })),
      };

      const url = caseStudyId
        ? `${API_BASE}/admin/case-studies/${caseStudyId}`
        : `${API_BASE}/admin/case-studies`;

      const method = caseStudyId ? 'PUT' : 'POST';

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
        setSuccess(caseStudyId ? 'Case study updated!' : 'Case study created!');
        if (onSave) {
          setTimeout(onSave, 1000);
        }
      } else {
        setError(data.error || 'Failed to save case study');
      }
    } catch (err) {
      setError('Failed to save case study');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const updateFormField = <K extends keyof CaseStudyData>(
    field: K,
    value: CaseStudyData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  // Tags management
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

  // Deliverables management
  const addDeliverable = () => {
    if (deliverableInput.trim() && !formData.deliverables.includes(deliverableInput.trim())) {
      setFormData(prev => ({
        ...prev,
        deliverables: [...prev.deliverables, deliverableInput.trim()],
      }));
      setDeliverableInput('');
    }
  };

  const removeDeliverable = (item: string) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter(d => d !== item),
    }));
  };

  // Stats management
  const addStat = () => {
    setFormData(prev => ({
      ...prev,
      stats: [...prev.stats, { id: generateId(), value: '', label: '', sortOrder: prev.stats.length }],
    }));
  };

  const updateStat = (id: string, field: 'value' | 'label', value: string) => {
    setFormData(prev => ({
      ...prev,
      stats: prev.stats.map(s => s.id === id ? { ...s, [field]: value } : s),
    }));
  };

  const removeStat = (id: string) => {
    setFormData(prev => ({
      ...prev,
      stats: prev.stats.filter(s => s.id !== id),
    }));
  };

  // Process steps management
  const addProcessStep = () => {
    setFormData(prev => ({
      ...prev,
      processSteps: [...prev.processSteps, { id: generateId(), title: '', description: '', sortOrder: prev.processSteps.length }],
    }));
  };

  const updateProcessStep = (id: string, field: 'title' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      processSteps: prev.processSteps.map(ps => ps.id === id ? { ...ps, [field]: value } : ps),
    }));
  };

  const removeProcessStep = (id: string) => {
    setFormData(prev => ({
      ...prev,
      processSteps: prev.processSteps.filter(ps => ps.id !== id),
    }));
  };

  // Results management
  const addResult = () => {
    setFormData(prev => ({
      ...prev,
      results: [...prev.results, { id: generateId(), title: '', description: '', iconName: '', sortOrder: prev.results.length }],
    }));
  };

  const updateResult = (id: string, field: 'title' | 'description' | 'iconName', value: string) => {
    setFormData(prev => ({
      ...prev,
      results: prev.results.map(r => r.id === id ? { ...r, [field]: value } : r),
    }));
  };

  const removeResult = (id: string) => {
    setFormData(prev => ({
      ...prev,
      results: prev.results.filter(r => r.id !== id),
    }));
  };

  // Gallery management
  const addGalleryItem = () => {
    setFormData(prev => ({
      ...prev,
      gallery: [...prev.gallery, { id: generateId(), iconName: '', label: '', imageUrl: '', isLarge: false, sortOrder: prev.gallery.length }],
    }));
  };

  const updateGalleryItem = (id: string, field: keyof GalleryItem, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.map(g => g.id === id ? { ...g, [field]: value } : g),
    }));
  };

  const removeGalleryItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter(g => g.id !== id),
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
              {caseStudyId ? 'Edit Case Study' : 'Create Case Study'}
            </h1>
            <p className="text-gray-500 text-sm">
              {formData.status === 'published' ? 'Published' : 'Draft'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {formData.slug && (
            <a
              href={`/case-study/${formData.slug}`}
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
          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Case study title..."
                  className="w-full px-4 py-3 text-lg font-semibold border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => updateFormField('subtitle', e.target.value)}
                  placeholder="Brief description..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => updateFormField('clientName', e.target.value)}
                    placeholder="Company name"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.clientLocation}
                    onChange={(e) => updateFormField('clientLocation', e.target.value)}
                    placeholder="City, Country"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => updateFormField('industry', e.target.value)}
                  placeholder="e.g., Hospitality, Retail, Events"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Challenge & Solution */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Challenge & Solution</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Challenge</label>
                <textarea
                  value={formData.challenge}
                  onChange={(e) => updateFormField('challenge', e.target.value)}
                  placeholder="Describe the client's challenge..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Solution</label>
                <textarea
                  value={formData.solution}
                  onChange={(e) => updateFormField('solution', e.target.value)}
                  placeholder="Describe the solution provided..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <CollapsibleSection
            title="Key Stats"
            icon={<BarChart3 className="w-5 h-5" />}
            isCollapsed={collapsedSections.has('stats')}
            onToggle={() => toggleSection('stats')}
            count={formData.stats.length}
          >
            <Reorder.Group
              axis="y"
              values={formData.stats}
              onReorder={(newStats) => updateFormField('stats', newStats)}
              className="space-y-3"
            >
              {formData.stats.map((stat) => (
                <Reorder.Item key={stat.id} value={stat} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => updateStat(stat.id, 'value', e.target.value)}
                      placeholder="Value (e.g., 500+)"
                      className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                    />
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => updateStat(stat.id, 'label', e.target.value)}
                      placeholder="Label (e.g., Items Produced)"
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                    />
                    <button
                      onClick={() => removeStat(stat.id)}
                      className="p-2 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            <button
              onClick={addStat}
              className="flex items-center gap-2 mt-3 text-sm text-[#64a70b] hover:text-[#578f09]"
            >
              <Plus className="w-4 h-4" />
              Add stat
            </button>
          </CollapsibleSection>

          {/* Process Steps Section */}
          <CollapsibleSection
            title="Process Steps"
            icon={<ListOrdered className="w-5 h-5" />}
            isCollapsed={collapsedSections.has('processSteps')}
            onToggle={() => toggleSection('processSteps')}
            count={formData.processSteps.length}
          >
            <Reorder.Group
              axis="y"
              values={formData.processSteps}
              onReorder={(newSteps) => updateFormField('processSteps', newSteps)}
              className="space-y-3"
            >
              {formData.processSteps.map((step, index) => (
                <Reorder.Item key={step.id} value={step} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 pt-2">
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      <span className="w-6 h-6 rounded-full bg-[#64a70b] text-white text-xs flex items-center justify-center font-semibold">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => updateProcessStep(step.id, 'title', e.target.value)}
                        placeholder="Step title"
                        className="w-full px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                      />
                      <textarea
                        value={step.description}
                        onChange={(e) => updateProcessStep(step.id, 'description', e.target.value)}
                        placeholder="Step description..."
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none resize-none"
                      />
                    </div>
                    <button
                      onClick={() => removeProcessStep(step.id)}
                      className="p-2 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded mt-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            <button
              onClick={addProcessStep}
              className="flex items-center gap-2 mt-3 text-sm text-[#64a70b] hover:text-[#578f09]"
            >
              <Plus className="w-4 h-4" />
              Add step
            </button>
          </CollapsibleSection>

          {/* Results Section */}
          <CollapsibleSection
            title="Results"
            icon={<Trophy className="w-5 h-5" />}
            isCollapsed={collapsedSections.has('results')}
            onToggle={() => toggleSection('results')}
            count={formData.results.length}
          >
            <Reorder.Group
              axis="y"
              values={formData.results}
              onReorder={(newResults) => updateFormField('results', newResults)}
              className="space-y-3"
            >
              {formData.results.map((result) => (
                <Reorder.Item key={result.id} value={result} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move mt-3" />
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={result.iconName || ''}
                          onChange={(e) => updateResult(result.id, 'iconName', e.target.value)}
                          placeholder="Icon name"
                          className="w-32 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                        />
                        <input
                          type="text"
                          value={result.title}
                          onChange={(e) => updateResult(result.id, 'title', e.target.value)}
                          placeholder="Result title"
                          className="flex-1 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                        />
                      </div>
                      <textarea
                        value={result.description}
                        onChange={(e) => updateResult(result.id, 'description', e.target.value)}
                        placeholder="Result description..."
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none resize-none"
                      />
                    </div>
                    <button
                      onClick={() => removeResult(result.id)}
                      className="p-2 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded mt-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            <button
              onClick={addResult}
              className="flex items-center gap-2 mt-3 text-sm text-[#64a70b] hover:text-[#578f09]"
            >
              <Plus className="w-4 h-4" />
              Add result
            </button>
          </CollapsibleSection>

          {/* Gallery Section */}
          <CollapsibleSection
            title="Gallery"
            icon={<Image className="w-5 h-5" />}
            isCollapsed={collapsedSections.has('gallery')}
            onToggle={() => toggleSection('gallery')}
            count={formData.gallery.length}
          >
            <Reorder.Group
              axis="y"
              values={formData.gallery}
              onReorder={(newGallery) => updateFormField('gallery', newGallery)}
              className="space-y-3"
            >
              {formData.gallery.map((item) => (
                <Reorder.Item key={item.id} value={item} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move mt-3" />
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={item.iconName || ''}
                          onChange={(e) => updateGalleryItem(item.id, 'iconName', e.target.value)}
                          placeholder="Icon name"
                          className="w-32 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                        />
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => updateGalleryItem(item.id, 'label', e.target.value)}
                          placeholder="Label"
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                        />
                        <label className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600">
                          <input
                            type="checkbox"
                            checked={item.isLarge}
                            onChange={(e) => updateGalleryItem(item.id, 'isLarge', e.target.checked)}
                            className="w-4 h-4 text-[#64a70b]"
                          />
                          Large
                        </label>
                      </div>
                      <input
                        type="text"
                        value={item.imageUrl || ''}
                        onChange={(e) => updateGalleryItem(item.id, 'imageUrl', e.target.value)}
                        placeholder="Image URL (optional)"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                      />
                    </div>
                    <button
                      onClick={() => removeGalleryItem(item.id)}
                      className="p-2 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded mt-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            <button
              onClick={addGalleryItem}
              className="flex items-center gap-2 mt-3 text-sm text-[#64a70b] hover:text-[#578f09]"
            >
              <Plus className="w-4 h-4" />
              Add gallery item
            </button>
          </CollapsibleSection>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Case Study Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => updateFormField('slug', e.target.value)}
                  placeholder="url-slug"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image URL</label>
                <input
                  type="text"
                  value={formData.featuredImage || ''}
                  onChange={(e) => updateFormField('featuredImage', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon Name (fallback)</label>
                <input
                  type="text"
                  value={formData.iconName || ''}
                  onChange={(e) => updateFormField('iconName', e.target.value)}
                  placeholder="e.g., Coffee, Building"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
                />
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
              <button onClick={addTag} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-[#64a70b]/10 text-[#64a70b] text-sm rounded-lg">
                  {tag}
                  <button onClick={() => removeTag(tag)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>

          {/* Deliverables */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Deliverables</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={deliverableInput}
                onChange={(e) => setDeliverableInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDeliverable())}
                placeholder="Add deliverable..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
              />
              <button onClick={addDeliverable} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {formData.deliverables.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="flex-1 text-sm">{item}</span>
                  <button onClick={() => removeDeliverable(item)} className="p-1 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Testimonial</h3>
            <div className="space-y-3">
              <textarea
                value={formData.testimonialText || ''}
                onChange={(e) => updateFormField('testimonialText', e.target.value)}
                placeholder="Client quote..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none resize-none"
              />
              <input
                type="text"
                value={formData.testimonialAuthor || ''}
                onChange={(e) => updateFormField('testimonialAuthor', e.target.value)}
                placeholder="Author name"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
              />
              <input
                type="text"
                value={formData.testimonialRole || ''}
                onChange={(e) => updateFormField('testimonialRole', e.target.value)}
                placeholder="Author role"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#64a70b]/20 focus:border-[#64a70b] outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  isCollapsed: boolean;
  onToggle: () => void;
  count: number;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  isCollapsed,
  onToggle,
  count,
  children,
}) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-[#183028] flex items-center justify-center text-[#64a70b]">
        {icon}
      </div>
      <span className="font-semibold text-gray-900 flex-1 text-left">{title}</span>
      {count > 0 && (
        <span className="px-2 py-1 bg-[#64a70b]/10 text-[#64a70b] text-xs font-medium rounded-full">
          {count}
        </span>
      )}
      {isCollapsed ? (
        <ChevronDown className="w-5 h-5 text-gray-400" />
      ) : (
        <ChevronUp className="w-5 h-5 text-gray-400" />
      )}
    </button>
    <AnimatePresence>
      {!isCollapsed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="p-4 pt-0 border-t border-gray-100">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default CaseStudyEditor;
