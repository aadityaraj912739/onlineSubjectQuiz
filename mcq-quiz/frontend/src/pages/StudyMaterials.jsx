import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Loading from '../components/Loading.jsx';
import toast from 'react-hot-toast';

const StudyMaterials = () => {
  const { user, api } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterType, setFilterType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    type: 'notes',
    fileUrl: '',
    content: '',
    tags: ''
  });

  useEffect(() => {
    fetchMaterials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const endpoint = user.role === 'teacher' ? '/study-materials/teacher' : '/study-materials';
      const response = await api.get(endpoint);
      setMaterials(response.data);
      console.log('Fetched materials:', response.data); // Debug log
    } catch (error) {
      toast.error('Failed to fetch study materials');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      const formDataFile = new FormData();
      formDataFile.append('file', selectedFile);

      const response = await api.post('/study-materials/upload', formDataFile, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setFormData({ ...formData, fileUrl: response.data.fileUrl });
      toast.success('File uploaded successfully!');
      setSelectedFile(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // If file is selected but not uploaded yet, upload it first
      let finalFileUrl = formData.fileUrl;
      if (selectedFile && !uploading) {
        setUploading(true);
        const formDataFile = new FormData();
        formDataFile.append('file', selectedFile);

        const uploadResponse = await api.post('/study-materials/upload', formDataFile, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        finalFileUrl = uploadResponse.data.fileUrl;
        toast.success('File uploaded successfully!');
        setUploading(false);
      }

      const tagsArray = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];
      const payload = { ...formData, fileUrl: finalFileUrl, tags: tagsArray };

      if (editingId) {
        await api.put(`/study-materials/${editingId}`, payload);
        toast.success('Material updated successfully!');
      } else {
        await api.post('/study-materials', payload);
        toast.success('Material created successfully!');
      }

      resetForm();
      fetchMaterials();
      setSelectedFile(null);
    } catch (error) {
      setUploading(false);
      toast.error(error.response?.data?.message || 'Failed to save material');
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
      tags: material.tags?.join(', ') || ''
    });
    setEditingId(material._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;

    try {
      await api.delete(`/study-materials/${id}`);
      toast.success('Material deleted successfully!');
      fetchMaterials();
    } catch (error) {
      toast.error('Failed to delete material');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subject: '',
      type: 'notes',
      fileUrl: '',
      content: '',
      tags: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredMaterials = materials.filter(m => {
    const matchSubject = !filterSubject || m.subject.toLowerCase().includes(filterSubject.toLowerCase());
    const matchType = !filterType || m.type === filterType;
    return matchSubject && matchType;
  });

  const getTypeIcon = (type) => {
    switch(type) {
      case 'pdf': return '📄';
      case 'notes': return '📝';
      case 'suggestion_paper': return '📋';
      default: return '📚';
    }
  };

  const getTypeBadgeColor = (type) => {
    switch(type) {
      case 'pdf': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'notes': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'suggestion_paper': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getFileUrl = (fileUrl) => {
    // If it's an uploaded file (starts with /uploads/), prepend backend URL
    if (fileUrl && fileUrl.startsWith('/uploads/')) {
      return `https://onlinesubjectquiz.onrender.com${fileUrl}`;
    }
    // Otherwise, it's an external URL, return as is
    return fileUrl;
  };

  const handleDownload = async (material) => {
    try {
      const fileUrl = getFileUrl(material.fileUrl);
      
      // For uploaded files on our server
      if (material.fileUrl && material.fileUrl.startsWith('/uploads/')) {
        // Use fetch to download the file
        const response = await fetch(fileUrl);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('File not found on server. Please contact the teacher to re-upload.');
          }
          throw new Error(`Download failed with status: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = material.fileUrl.split('/').pop() || `${material.title}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast.success('File downloaded successfully!');
      } else {
        // For external URLs, open in new tab
        window.open(fileUrl, '_blank');
        toast.success('Opening file in new tab!');
      }
    } catch (error) {
      console.error('Download error:', error);
      
      if (error.message.includes('not found on server') || error.message.includes('File not found')) {
        toast.error('⚠️ File no longer available on server. Please contact the teacher to re-upload this file.', {
          duration: 6000,
          style: {
            background: '#FEF3C7',
            color: '#92400E',
            fontWeight: '500'
          }
        });
      } else {
        toast.error(error.message || 'Failed to download file');
      }
    }
  };

  const handleReadContent = (material) => {
    setSelectedMaterial(material);
    setShowContentModal(true);
  };

  const closeContentModal = () => {
    setShowContentModal(false);
    setSelectedMaterial(null);
  };

  if (loading) {
    return <Loading fullScreen text="Loading study materials..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                📚 Study Materials
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {user.role === 'teacher' ? 'Manage and share study resources with students' : 'Access learning resources shared by teachers'}
              </p>
            </div>
            {user.role === 'teacher' && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-md"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {showForm ? 'Cancel' : 'Add Material'}
              </button>
            )}
          </div>
        </div>

        {/* Create/Edit Form */}
        {showForm && user.role === 'teacher' && (
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingId ? 'Edit Material' : 'Create New Material'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="notes">Notes</option>
                    <option value="pdf">PDF</option>
                    <option value="suggestion_paper">Suggestion Paper</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* File Upload Section */}
              <div className="border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg p-4 bg-blue-50 dark:bg-dark-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📎 Upload File (So students can download) - Optional
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Upload PDF, Excel, Word, PPT or images for students to download
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.xlsx,.xls"
                      className="block w-full text-sm text-gray-500 dark:text-gray-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary-50 file:text-primary-700
                        hover:file:bg-primary-100 dark:file:bg-primary-900 dark:file:text-primary-200"
                    />
                    <button
                      type="button"
                      onClick={handleFileUpload}
                      disabled={!selectedFile || uploading}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {uploading ? 'Uploading...' : 'Upload Now'}
                    </button>
                  </div>
                  {selectedFile && !formData.fileUrl && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 bg-white dark:bg-dark-800 p-2 rounded">
                      📎 Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(2)} KB)
                      <br />
                      <span className="text-gray-600 dark:text-gray-400">
                        💡 Click "Upload Now" or directly click "Create" to upload
                      </span>
                    </p>
                  )}
                  {formData.fileUrl && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>File uploaded successfully!</span>
                      <a 
                        href={`https://onlinesubjectquiz.onrender.com${formData.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline"
                      >
                        View File
                      </a>
                    </div>
                  )}
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400">OR</div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Provide External File URL
                    </label>
                    <input
                      type="url"
                      value={formData.fileUrl}
                      onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                      placeholder="https://drive.google.com/..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content (for text notes)
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  placeholder="Enter your notes content here..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="important, revision, chapter1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full sm:w-auto px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : editingId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={uploading}
                  className="w-full sm:w-auto px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Subject
              </label>
              <input
                type="text"
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                placeholder="Enter subject name..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-900 text-gray-900 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="notes">Notes</option>
                <option value="pdf">PDF</option>
                <option value="suggestion_paper">Suggestion Paper</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Materials List */}
        {filteredMaterials.length === 0 ? (
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 dark:text-dark-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Materials Found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {user.role === 'teacher' ? 'Create your first study material to get started.' : 'No study materials available yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((material) => (
              <div key={material._id} className="bg-white dark:bg-dark-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{getTypeIcon(material.type)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(material.type)}`}>
                      {material.type.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {material.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {material.description || 'No description'}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span className="font-medium">{material.subject}</span>
                    <span>👁️ {material.viewCount}</span>
                  </div>

                  {material.tags && material.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {material.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <p>By: {material.teacher?.name}</p>
                    <p>{new Date(material.createdAt).toLocaleDateString()}</p>
                    {/* Debug info - remove later */}
                    {user.role === 'teacher' && (
                      <p className="text-red-600 text-xs">
                        FileUrl: {material.fileUrl ? '✅ Yes' : '❌ No'} | Content: {material.content ? '✅ Yes' : '❌ No'}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {material.fileUrl && material.fileUrl.trim() !== '' && (
                      <button
                        onClick={() => handleDownload(material)}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm text-center transition-colors min-w-[100px]"
                      >
                        📥 Download
                      </button>
                    )}
                    {material.content && material.content.trim() !== '' && (
                      <button
                        onClick={() => handleReadContent(material)}
                        className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors min-w-[100px]"
                      >
                        📖 Read
                      </button>
                    )}
                    {(!material.fileUrl || material.fileUrl.trim() === '') && (!material.content || material.content.trim() === '') && user.role === 'student' && (
                      <div className="flex-1 px-3 py-2 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm text-center">
                        No content available
                      </div>
                    )}
                    {user.role === 'teacher' && material.teacher._id === user._id && (
                      <>
                        <button
                          onClick={() => handleEdit(material)}
                          className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(material._id)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content Modal */}
        {showContentModal && selectedMaterial && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-dark-700 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedMaterial.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedMaterial.subject} • {selectedMaterial.type}
                  </p>
                </div>
                <button
                  onClick={closeContentModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {selectedMaterial.description && (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedMaterial.description}
                    </p>
                  </div>
                )}
                <div className="prose dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-gray-900 dark:text-white font-sans">
                    {selectedMaterial.content}
                  </pre>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>By: {selectedMaterial.teacher?.name}</p>
                    <p>{new Date(selectedMaterial.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={closeContentModal}
                    className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyMaterials;
