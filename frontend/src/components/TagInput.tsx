import React, { useState, useEffect, useRef, useCallback } from 'react';
import { tagsApi } from '../api/tags';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  suggestions?: string[];
}

export const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  placeholder = '添加标签...',
  maxTags = 10,
  suggestions: externalSuggestions
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPopularTags();
  }, []);

  const loadPopularTags = async () => {
    try {
      const popular = await tagsApi.getPopularTags(5);
      setPopularTags(popular.map(t => t.name));
    } catch (error) {
      console.error('Failed to load popular tags:', error);
    }
  };

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      const results = await tagsApi.suggestTags(query, 10);
      setSuggestions(results.filter(tag => !value.includes(tag)));
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (externalSuggestions) {
        setSuggestions(externalSuggestions.filter(tag => 
          tag.toLowerCase().includes(inputValue.toLowerCase()) && 
          !value.includes(tag)
        ));
      } else {
        fetchSuggestions(inputValue);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [inputValue, fetchSuggestions, externalSuggestions, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim().replace(/[,，;；]/g, '');
    if (trimmed && !value.includes(trimmed) && value.length < maxTags) {
      onChange([...value, trimmed]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag));
  };

  const handleSelectSuggestion = (tag: string) => {
    addTag(tag);
    inputRef.current?.focus();
  };

  const allSuggestions = [...new Set([
    ...suggestions,
    ...popularTags.filter(t => !value.includes(t))
  ])].slice(0, 8);

  return (
    <div className="tag-input-wrapper" ref={wrapperRef}>
      <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent bg-white">
        {value.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 font-medium"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-2 text-blue-400 hover:text-blue-600 focus:outline-none"
            >
              ✕
            </button>
          </span>
        ))}
        
        <div className="relative flex-1 min-w-[120px]">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={value.length === 0 ? placeholder : ''}
            className="w-full px-2 py-1 bg-transparent focus:outline-none"
            disabled={value.length >= maxTags}
          />
          
          {showSuggestions && allSuggestions.length > 0 && (
            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {loading && (
                <div className="px-4 py-2 text-sm text-gray-500">加载中...</div>
              )}
              {!loading && allSuggestions.map((tag, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectSuggestion(tag)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {value.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          已添加 {value.length}/{maxTags} 个标签
        </div>
      )}
    </div>
  );
};

export default TagInput;
