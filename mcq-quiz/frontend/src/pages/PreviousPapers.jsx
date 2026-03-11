import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Loading from '../components/Loading.jsx';
import toast from 'react-hot-toast';
import { FaSearch, FaTimes, FaFilter, FaDownload, FaTrash, FaUpload, FaFileAlt, FaCalendar, FaBook, FaGraduationCap } from 'react-icons/fa';
import { usePerformanceMonitor, useDebounce } from '../components/PerformanceOptimizer.jsx';
import { BACKEND_URL } from '../config/api.js';

const PreviousPapers = memo(() => {
  usePerformanceMonitor('PreviousPapers');

  const { user, api } = useAuth();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 20;

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const [filters, setFilters] = useState({
    country: user?.role === 'student' ? (user?.country || '') : '',
    state: user?.role === 'student' ? (user?.state || '') : '',
    college: user?.role === 'student' ? (user?.college || '') : '',
    branch: user?.role === 'student' ? (user?.branch || '') : '',
    semester: user?.role === 'student' ? (user?.semester || '') : '',
    subject: '',
    year: '',
    sortBy: 'recent' // recent, oldest, title, downloads
  });

  const [filterOptions, setFilterOptions] = useState({
    countries: [],
    states: [],
    colleges: [],
    branches: [],
    semesters: [],
    subjects: [],
    years: []
  });

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    year: new Date().getFullYear().toString(),
    country: user?.country || '',
    state: user?.state || '',
    college: user?.college || '',
    branch: user?.branch || '',
    semester: user?.semester || ''
  });

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const cachedOptions = localStorage.getItem('paper_filter_options');
      if (cachedOptions) {
        setFilterOptions(JSON.parse(cachedOptions));
      }

      const response = await api.get('/previous-papers/filters');
      setFilterOptions(response.data);
      localStorage.setItem('paper_filter_options', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  }, [api]);

  // Fetch papers with pagination and filters
  const fetchPapers = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      // Add pagination
      queryParams.append('page', page);
      queryParams.append('limit', ITEMS_PER_PAGE);
      
      // Add filters
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });
      
      // Add search
      if (debouncedSearch) {
        queryParams.append('search', debouncedSearch);
      }

      const response = await api.get(`/previous-papers?${queryParams}`);
      setPapers(response.data.papers || response.data);
      setTotalPages(response.data.totalPages || 1);
      setTotalItems(response.data.totalItems || papers.length);
    } catch (error) {
      toast.error('Failed to fetch papers');
      console.error(error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, page, filters, debouncedSearch]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchPapers();
  }, [fetchPapers]);

  // Handle file upload
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error('File size must be less than 50MB');
        return;
      }
      if (!file.type.includes('pdf')) {
        toast.error('Only PDF files are allowed');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Please select a PDF file');
      return;
    }

    try {
      setUploading(true);
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      formDataToSend.append('file', selectedFile);

      await api.post('/previous-papers', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Paper uploaded successfully!');
      setShowUploadForm(false);
      setSelectedFile(null);
      setFormData({
        title: '',
        subject: '',
        year: new Date().getFullYear().toString(),
        country: user?.country || '',
        state: user?.state || '',
        college: user?.college || '',
        branch: user?.branch || '',
        semester: user?.semester || ''
      });
      fetchPapers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload paper');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (paperId) => {
    if (!window.confirm('Are you sure you want to delete this paper?')) return;

    try {
      await api.delete(`/previous-papers/${paperId}`);
      toast.success('Paper deleted successfully');
      fetchPapers();
    } catch (error) {
      toast.error('Failed to delete paper');
    }
  };

  const handleDownload = async (paper) => {
    try {
      toast.loading('Preparing download...');
      
      // Backend now proxies the file and streams it directly
      const token = localStorage.getItem('token');
      const downloadUrl = `${BACKEND_URL}/api/previous-papers/download/${paper._id}`;
      
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
      let fileName = 'paper.pdf';
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
      const errorMessage = error.message || 'Download failed';
      
      // Check for file not available errors
      if (errorMessage.includes('not found on server') || 
          errorMessage.includes('File not found') ||
          errorMessage.includes('fileNotAvailable')) {
        toast.error('⚠️ File no longer available on server. Please contact the teacher to re-upload this file.', {
          duration: 6000,
          style: {
            background: '#FEF3C7',
            color: '#92400E',
            fontWeight: '500'
          }
        });
      } else if (error.message.includes('Previous paper not found')) {
        toast.error('This paper has been deleted or is no longer available.');
      } else {
        toast.error(errorMessage || 'Failed to download file. Please try again.');
      }
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      country: user?.role === 'student' ? (user?.country || '') : '',
      state: user?.role === 'student' ? (user?.state || '') : '',
      college: user?.role === 'student' ? (user?.college || '') : '',
      branch: user?.role === 'student' ? (user?.branch || '') : '',
      semester: user?.role === 'student' ? (user?.semester || '') : '',
      subject: '',
      year: '',
      sortBy: 'recent'
    });
    setSearchQuery('');
    setPage(1);
  };

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    Object.keys(filters).forEach(key => {
      if (key !== 'sortBy' && filters[key] && filters[key] !== '') count++;
    });
    if (searchQuery) count++;
    return count;
  }, [filters, searchQuery]);

  // Filtered and sorted papers
  const displayedPapers = useMemo(() => papers, [papers]);

  if (loading && page === 1) {
    return <Loading text="Loading papers..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <div className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                📄 Previous Papers
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {totalItems.toLocaleString()} papers available
              </p>
            </div>
            {user?.role === 'teacher' && (
              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors font-semibold text-sm"
              >
                <FaUpload className="text-sm" />
                <span className="hidden sm:inline">Upload Paper</span>
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
                placeholder="Search papers..."
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
              <option value="downloads">Most Downloaded</option>
            </select>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-lg">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <select
                  value={filters.subject}
                  onChange={(e) => {
                    setFilters({ ...filters, subject: e.target.value });
                    setPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-gray-50 dark:bg-dark-800 text-sm"
                >
                  <option value="">All Subjects</option>
                  {filterOptions.subjects?.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  value={filters.year}
                  onChange={(e) => {
                    setFilters({ ...filters, year: e.target.value });
                    setPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-gray-50 dark:bg-dark-800 text-sm"
                >
                  <option value="">All Years</option>
                  {filterOptions.years?.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                <select
                  value={filters.semester}
                  onChange={(e) => {
                    setFilters({ ...filters, semester: e.target.value });
                    setPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-gray-50 dark:bg-dark-800 text-sm"
                >
                  <option value="">All Semesters</option>
                  {filterOptions.semesters?.map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>

                <select
                  value={filters.branch}
                  onChange={(e) => {
                    setFilters({ ...filters, branch: e.target.value });
                    setPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-gray-50 dark:bg-dark-800 text-sm"
                >
                  <option value="">All Branches</option>
                  {filterOptions.branches?.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>

                <select
                  value={filters.college}
                  onChange={(e) => {
                    setFilters({ ...filters, college: e.target.value });
                    setPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-gray-50 dark:bg-dark-800 text-sm"
                >
                  <option value="">All Colleges</option>
                  {filterOptions.colleges?.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={filters.state}
                  onChange={(e) => {
                    setFilters({ ...filters, state: e.target.value });
                    setPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-gray-50 dark:bg-dark-800 text-sm"
                >
                  <option value="">All States</option>
                  {filterOptions.states?.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  value={filters.country}
                  onChange={(e) => {
                    setFilters({ ...filters, country: e.target.value });
                    setPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-gray-50 dark:bg-dark-800 text-sm"
                >
                  <option value="">All Countries</option>
                  {filterOptions.countries?.map(c => (
                    <option key={c} value={c}>{c}</option>
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

        {/* Upload Form */}
        {showUploadForm && (
          <div className="mb-6 p-4 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-lg">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Upload New Paper</h3>
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
                <input
                  type="text"
                  placeholder="Year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Semester"
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-lg bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-700 rounded-full hover:bg-gray-100 dark:hover:bg-dark-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-4 py-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:opacity-50 font-semibold transition-colors"
                >
                  {uploading ? 'Uploading...' : 'Upload Paper'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Papers Grid - Compact Layout */}
        {displayedPapers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {displayedPapers.map((paper) => (
                <div
                  key={paper._id}
                  className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl p-3 hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors cursor-pointer"
                >
                  {/* Header */}
                  <div className="flex items-start gap-2 mb-2">
                    <FaFileAlt className="text-red-500 text-xl flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 leading-tight">
                        {paper.title}
                      </h3>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <FaBook className="text-[10px]" />
                      <span className="truncate">{paper.subject}</span>
                    </div>
                    {paper.year && (
                      <div className="flex items-center gap-1">
                        <FaCalendar className="text-[10px]" />
                        <span>{paper.year}</span>
                        {paper.semester && <span>• Sem {paper.semester}</span>}
                      </div>
                    )}
                    {paper.college && (
                      <div className="flex items-center gap-1">
                        <FaGraduationCap className="text-[10px]" />
                        <span className="truncate">{paper.college}</span>
                      </div>
                    )}
                    {(paper.downloads > 0) && (
                      <div className="flex items-center gap-1">
                        <FaDownload className="text-[10px]" />
                        <span>{paper.downloads || 0} downloads</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(paper)}
                      className="flex-1 px-3 py-1.5 bg-primary-500 text-white text-xs font-semibold rounded-full hover:bg-primary-600 transition-colors"
                    >
                      Download
                    </button>
                    {user?.role === 'teacher' && paper.uploadedBy?._id === user?._id && (
                      <button
                        onClick={() => handleDelete(paper._id)}
                        className="px-2 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                      >
                        <FaTrash className="text-xs" />
                      </button>
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
            <FaFileAlt className="text-6xl text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No papers found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || activeFiltersCount > 0
                ? 'Try adjusting your search or filters'
                : 'Be the first to upload a paper!'}
            </p>
          </div>
        )}

        {loading && page > 1 && (
          <div className="mt-4 text-center">
            <Loading text="Loading more papers..." />
          </div>
        )}
      </div>
    </div>
  );
});

PreviousPapers.displayName = 'PreviousPapers';

export default PreviousPapers;
