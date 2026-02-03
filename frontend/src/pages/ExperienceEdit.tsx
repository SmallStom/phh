import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { experiencesApi } from '../api/experiences';
import { useAuthStore } from '../store/authStore';
import type { ExperienceCreate } from '../types/experience';
import { TagInput } from '../components/TagInput';
import { useExperienceDraft } from '../hooks/useDraftSave';

export const ExperienceEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const [category, setCategory] = useState<ExperienceCreate['category'] | undefined>('project');
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [dateError, setDateError] = useState('');
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const isEditMode = !!id;

  const draft = useExperienceDraft(id);
  const [title, setTitle] = useState(draft.data.title);
  const [description, setDescription] = useState(draft.data.description);
  const [startDate, setStartDate] = useState(draft.data.start_date);
  const [endDate, setEndDate] = useState(draft.data.end_date || '');
  const [isCurrent, setIsCurrent] = useState(draft.data.is_current || false);
  const [tags, setTags] = useState<string[]>(draft.data.tags || []);

  useEffect(() => {
    initializeAuth();
    setAuthChecked(true);
  }, []);

  const prevDraftData = useRef(draft.data);
  useEffect(() => {
    if (draft.hasDraft && prevDraftData.current !== draft.data) {
      setShowDraftBanner(true);
      prevDraftData.current = draft.data;
    }
  }, [draft.hasDraft, draft.data]);

  useEffect(() => {
    const timer = setTimeout(() => {
      draft.save({ title, description, start_date: startDate, end_date: endDate || undefined, is_current: isCurrent, category, tags });
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, description, startDate, endDate, isCurrent, category, tags]);

  useEffect(() => {
    if (id && isAuthenticated) {
      loadExperience();
    }
  }, [id, isAuthenticated]);

  const loadExperience = async () => {
    if (!id) return;
    try {
      const response = await experiencesApi.getExperience(id);
      setTitle(response.title);
      setDescription(response.description || '');
      setStartDate(response.start_date);
      setEndDate(response.end_date || '');
      setIsCurrent(response.is_current);
      setCategory(response.category || 'project');
      setTags(response.tags || []);
    } catch (error) {
      console.error('Failed to load experience:', error);
    }
  };

  const validateDates = () => {
    if (!startDate) return '';
    if (!endDate && !isCurrent) return '请选择结束日期或勾选"至今"';
    if (isCurrent) return '';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
      return '结束日期不能早于开始日期';
    }
    
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateDates();
    if (error) {
      setDateError(error);
      return;
    }
    
    setDateError('');
    setLoading(true);
    try {
      const data: ExperienceCreate = {
        title,
        description,
        start_date: startDate,
        end_date: endDate || undefined,
        is_current: isCurrent,
        category,
        tags: tags,
      };
      
      if (isEditMode) {
        await experiencesApi.updateExperience(id!, data);
      } else {
        await experiencesApi.createExperience(data);
      }
      draft.clear();
      navigate('/experiences');
    } catch (error) {
      console.error('Failed to save experience:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreDraft = () => {
    setTitle(draft.data.title);
    setDescription(draft.data.description);
    setStartDate(draft.data.start_date);
    setEndDate(draft.data.end_date || '');
    setIsCurrent(draft.data.is_current || false);
    setCategory(draft.data.category || 'project');
    setTags(draft.data.tags || []);
    setShowDraftBanner(false);
  };

  const handleDiscardDraft = () => {
    draft.clear();
    setShowDraftBanner(false);
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setIsCurrent(false);
    setTags([]);
  };

  if (!authChecked || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/experiences')}
          className="text-gray-600 hover:text-gray-900"
        >
          ← 返回往日风采
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? '编辑往日风采' : '添加往日风采'}</h1>
      </div>

      {showDraftBanner && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-yellow-600 mr-2">📝</span>
              <span className="text-yellow-700">
                发现未保存的草稿
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRestoreDraft}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm"
              >
                恢复草稿
              </button>
              <button
                onClick={handleDiscardDraft}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
              >
                丢弃草稿
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            标题
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            描述
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="描述这段经历..."
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              开始日期
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDateError('');
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${dateError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              结束日期
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDateError('');
              }}
              disabled={isCurrent}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${dateError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} ${isCurrent ? 'disabled:bg-gray-100' : ''}`}
            />
          </div>
        </div>
        
        {dateError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md">
            {dateError}
          </div>
        )}
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isCurrent"
            checked={isCurrent}
            onChange={(e) => {
              setIsCurrent(e.target.checked);
              if (e.target.checked) {
                setEndDate('');
              }
              setDateError('');
            }}
            className="mr-2"
          />
          <label htmlFor="isCurrent" className="text-sm text-gray-700">
            至今
          </label>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            分类
          </label>
          <select
            value={category || ''}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">选择分类</option>
            <option value="work">工作</option>
            <option value="project">项目</option>
            <option value="education">教育</option>
            <option value="milestone">里程碑</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            标签
          </label>
          <TagInput
            value={tags}
            onChange={setTags}
            placeholder="输入标签，按回车添加..."
            maxTags={10}
          />
        </div>
        
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '保存中...' : '保存'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/experiences')}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
};
