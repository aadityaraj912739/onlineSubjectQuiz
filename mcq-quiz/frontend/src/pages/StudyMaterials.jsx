import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Loading from '../components/Loading.jsx';
import toast from 'react-hot-toast';
import { FaSearch, FaTimes, FaFilter, FaDownload, FaTrash, FaUpload, FaBook, FaFileAlt, FaVideo, FaLink, FaTag, FaEye, FaEdit } from 'react-icons/fa';
import { usePerformanceMonitor, useDebounce } from '../components/PerformanceOptimizer.jsx';
import { BACKEND_URL } from '../config/api.js';

const StudyMaterials = memo(() => {
  usePerformanceMonitor('StudyMaterials');

  const { user, api } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 24;

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const [filters, setFilters] = useState({
    subject: '',
    type: '', // notes, video, book, link, slides
    tags: '',
    sortBy: 'recent' // recent, oldest, title, popular
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    type: 'notes',
    fileUrl: '',
    content: '',
    tags: ''
  });

  const typeIcons = {
    notes: <FaFileAlt className="text-blue-500" />,
    video: <FaVideo className="text-red-500" />,
    book: <FaBook className="text-green-500" />,
    link: <FaLink className="text-purple-500" />,
    slides: <FaFileAlt className="text-orange-500" />
  };

  const typeColors = {
    notes: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    video: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    book: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    link: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    slides: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
  };

  // Fetch materials with pagination
  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      queryParams.append('page', page);
      queryParams.append('limit', ITEMS_PER_PAGE);
      
      // Add filters
      if (filters.subject) queryParams.append('subject', filters.subject);
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.tags) queryParams.append('tags', filters.tags);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      
      // Add search
      if (debouncedSearch) queryParams.append('search', debouncedSearch);

      const endpoint = user.role === 'teacher' 
        ? `/study-materials/teacher?${queryParams}` 
        : `/study-materials?${queryParams}`;
      
      const response = await api.get(endpoint);
      setMaterials(response.data.materials || response.data);
      setTotalPages(response.data.totalPages || 1);
      setTotalItems(response.data.totalItems || materials.length);
    } catch (error) {
      toast.error('Failed to fetch study materials');
      console.error(error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, user.role, page, filters, debouncedSearch]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error('File size must be less than 50MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let finalFileUrl = formData.fileUrl;
      
      if (selectedFile && !uploading) {
        setUploading(true);
        const formDataFile = new FormData();
        formDataFile.append('file', selectedFile);

        const uploadResponse = await api.post('/study-materials/upload', formDataFile, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        finalFileUrl = uploadResponse.data.fileUrl;
        setUploading(false);
      }

      const dataToSend = {
        ...formData,
        fileUrl: finalFileUrl,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      if (editingId) {
        await api.put(`/study-materials/${editingId}`, dataToSend);
        toast.success('Material updated successfully!');
      } else {
        await api.post('/study-materials', dataToSend);
        toast.success('Material created successfully!');
      }

      setShowForm(false);
      setEditingId(null);
      setSelectedFile(null);
      setFormData({
        title: '',
        description: '',
        subject: '',
        type: 'notes',
        fileUrl: '',
        content: '',
        tags: ''
      });
      fetchMaterials();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save material');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (material) => {
    setFormData({
      title: material.title,
      description: material.description || '',
      subject: material.subject,
      type: material.type,
      fileUrl: material.fileUrl || '',
      content: material.content || '',
      tags: Array.isArray(material.tags) ? material.tags.join(', ') : ''
    });
    setEditingId(material._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;

    try {
      await api.delete(`/study-materials/${id}`);
      toast.success('Material deleted successfully');
      fetchMaterials();
    } catch (error) {
      toast.error('Failed to delete material');
    }
  };

  const handleView = (material) => {
    setSelectedMaterial(material);
    setShowContentModal(true);
  };

  const handleDownload = async (material) => {
    try {
      toast.loading('Preparing download...');
      
      // Backend now proxies the file and streams it directly
      const token = localStorage.getItem('token');
      const downloadUrl = `${BACKEND_URL}/api/study-materials/download/${material._id}`;
      
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Check if response is JSON (error) or file stream (success)
      const contentType = response.headers.get('content-type');
      
      if (!response.ok || contentType?.includes('application/json')) {
        const errorData = await response.json().catch(() => ({ message: 'Download failed' }));
        toast.dismiss();
        
        // Handle specific error cases
        if (errorData.fileNotAvailable) {
          if (errorData.requiresReupload) {
            toast.error('⚠️ This file was uploaded before cloud storage migration and is no longer available. Please ask the teacher to re-upload it.', {
              duration: 7000,
              style: {
                background: '#FEF3C7',
                color: '#92400E',
                fontWeight: '500'
              }
            });
          } else {
            toast.error('⚠️ File no longer available on server. Please contact the teacher to re-upload this file.', {
              duration: 6000,
              style: {
                background: '#FEF3C7',
                color: '#92400E',
                fontWeight: '500'
              }
            });
          }
        } else {
          toast.error(errorData.message || 'Download failed');
        }
        return;
      }

      toast.dismiss();
      toast.loading('Downloading file...');
      
      // Get the file as blob
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Extract filename from Content-Disposition header or use default
      const disposition = response.headers.get('Content-Disposition');
      let fileName = `${material.title}.pdf`;
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) fileName = match[1];
      }
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
      
      toast.dismiss();
      toast.success('Download completed! Check your downloads folder.');
    } catch (error) {
      console.error('Download error:', error);
      toast.dismiss();
      toast.error(error.message || 'Failed to download file. Please try again.');
    }
  };

// Clear filters
  const clearFilters = () => {
    setFilters({
      subject: '',
      type: '',
      tags: '',
      sortBy: 'recent'
    });
    setSearchQuery('');
    setPage(1);
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.subject) count++;
    if (filters.type) count++;
    if (filters.tags) count++;
    if (searchQuery) count++;
    return count;
  }, [filters, searchQuery]);

  // Get unique subjects and tags
  const uniqueSubjects = useMemo(() => {
    return [...new Set(materials.map(m => m.subject).filter(Boolean))];
  }, [materials]);

  const uniqueTags = useMemo(() => {
    return [...new Set(materials.flatMap(m => m.tags || []))];
  }, [materials]);

  if (loading && page === 1) {
    return <Loading text="Loading materials..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <div className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                📚 Study Materials
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {totalItems.toLocaleString()} materials available
              </p>
            </div>
            {user?.role === 'teacher' && (
              <button
                onClick={() => {
                  setShowForm(!showForm);
                  setEditingId(null);
                  setFormData({
                    title: '',
                    description: '',
                    subject: '',
                    type: 'notes',
                    fileUrl: '',
                    content: '',
                    tags: ''
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors font-semibold text-sm"
              >
                <FaUpload className="text-sm" />
                <span className="hidden sm:inline">Add Material</span>
              </button>
            )}
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-900 text-gray-900 dark:text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors font-medium text-sm relative"
            >
              <FaFilter className="text-sm" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort */}
            <select
              value={filters.sortBy}
              onChange={(e) => {
                setFilters({ ...filters, sortBy: e.target.value });
                setPage(1);
              }}
              className="px-4 py-2.5 border border-gray-300 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title (A-Z)</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-lg">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <select
                  value={filters.type}
                  onChange={(e) => {
                    setFilters({ ...filters, type: e.target.value });
                    setPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-gray-50 dark:bg-dark-800 text-sm"
                >
                  <option value="">All Types</option>
                  <option value="notes">Notes</option>
                  <option value="video">Video</option>
                  <option value="book">Book</option>
                  <option value="link">Link</option>
                  <option value="slides">Slides</option>
                </select>

                <select
                  value={filters.subject}
                  onChange={(e) => {
                    setFilters({ ...filters, subject: e.target.value });
                    setPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-gray-50 dark:bg-dark-800 text-sm"
                >
                  <option value="">All Subjects</option>
                  {uniqueSubjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>

                <select
                  value={filters.tags}
                  onChange={(e) => {
                    setFilters({ ...filters, tags: e.target.value });
                    setPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-gray-50 dark:bg-dark-800 text-sm"
                >
                  <option value="">All Tags</option>
                  {uniqueTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-sm font-medium transition-all"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        {showForm && user?.role === 'teacher' && (
          <div className="mb-6 p-4 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-lg">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {editingId ? 'Edit Material' : 'Add New Material'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Title *"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Subject *"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white"
                  required
                />
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white"
                >
                  <option value="notes">Notes</option>
                  <option value="video">Video</option>
                  <option value="book">Book</option>
                  <option value="link">Link</option>
                  <option value="slides">Slides</option>
                </select>
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white"
                />
              </div>

              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white"
                rows="2"
              />

              {formData.type === 'link' ? (
                <input
                  type="url"
                  placeholder="Enter URL *"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white"
                  required
                />
              ) : (
                <div>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  {selectedFile && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-full hover:bg-gray-100 dark:hover:bg-dark-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:opacity-50 font-semibold transition-colors"
                >
                  {uploading ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Materials Grid - Compact Layout */}
        {materials.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {materials.map((material) => (
                <div
                  key={material._id}
                  className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl p-3 hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors cursor-pointer"
                >
                  {/* Header */}
                  <div className="flex items-start gap-2 mb-2">
                    <div className="text-2xl flex-shrink-0 mt-1">
                      {typeIcons[material.type] || typeIcons.notes}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 leading-tight">
                        {material.title}
                      </h3>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded ${typeColors[material.type] || typeColors.notes}`}>
                        {material.type}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-3">
                    {material.subject && (
                      <div className="flex items-center gap-1">
                        <FaBook className="text-[10px]" />
                        <span className="truncate">{material.subject}</span>
                      </div>
                    )}
                    {material.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {material.description}
                      </p>
                    )}
                    {material.tags && material.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mt-1">
                        <FaTag className="text-[10px]" />
                        {material.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="text-[10px] bg-gray-100 dark:bg-dark-800 px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                        {material.tags.length > 2 && (
                          <span className="text-[10px]">+{material.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {(material.fileUrl || material.type === 'link') && (
                      <button
                        onClick={() => handleDownload(material)}
                        className="flex-1 px-3 py-1.5 bg-primary-500 text-white text-xs font-semibold rounded-full hover:bg-primary-600 transition-colors flex items-center justify-center gap-1"
                      >
                        <FaDownload className="text-[10px]" />
                        <span>{material.type === 'link' ? 'Open' : 'Download'}</span>
                      </button>
                    )}
                    {material.content && material.type !== 'link' && (
                      <button
                        onClick={() => handleView(material)}
                        className="flex-1 px-3 py-1.5 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-full hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <FaEye className="text-[10px]" />
                        <span>View</span>
                      </button>
                    )}
                    {user?.role === 'teacher' && material.uploadedBy?._id === user?._id && (
                      <>
                        <button
                          onClick={() => handleEdit(material)}
                          className="px-2 py-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                        >
                          <FaEdit className="text-xs" />
                        </button>
                        <button
                          onClick={() => handleDelete(material._id)}
                          className="px-2 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-dark-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-full font-semibold transition-colors ${
                          page === pageNum
                            ? 'bg-primary-500 text-white'
                            : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-dark-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-dark-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <FaBook className="text-6xl text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No materials found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || activeFiltersCount > 0
                ? 'Try adjusting your search or filters'
                : 'Be the first to add study materials!'}
            </p>
          </div>
        )}

        {loading && page > 1 && (
          <div className="mt-4 text-center">
            <Loading text="Loading more materials..." />
          </div>
        )}
      </div>

      {/* Content Modal */}
      {showContentModal && selectedMaterial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-dark-800 flex items-center justify-between sticky top-0 bg-white dark:bg-dark-900">
              <h3 className="text-lg font-bold">{selectedMaterial.title}</h3>
              <button
                onClick={() => setShowContentModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6">
              <div className="prose dark:prose-invert max-w-none">
                {selectedMaterial.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

StudyMaterials.displayName = 'StudyMaterials';

export default StudyMaterials;
