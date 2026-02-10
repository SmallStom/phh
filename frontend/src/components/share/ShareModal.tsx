import React, { useState, useEffect } from 'react';
import { X, Link2, MessageCircle, Twitter, Facebook, Check, Copy } from 'lucide-react';
import { shareApi, ShareUrlResponse } from '../../api/share';
import toast from 'react-hot-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'record' | 'experience' | 'collection';
  contentId: string;
  title?: string;
  description?: string;
  image?: string;
}

interface ShareOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  contentType,
  contentId
}) => {
  const [shareData, setShareData] = useState<ShareUrlResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadShareData();
    }
  }, [isOpen]);

  const loadShareData = async () => {
    try {
      setLoading(true);
      const data = await shareApi.getShareUrl(contentType, contentId);
      setShareData(data);
    } catch (error) {
      console.error('Failed to load share data:', error);
      toast.error('加载分享信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareData?.url) return;

    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      
      // 记录分享
      await shareApi.recordShare({
        content_type: contentType,
        content_id: contentId,
        platform: 'copy'
      });
      
      toast.success('链接已复制到剪贴板');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('复制失败');
    }
  };

  const handleShareToWeChat = async () => {
    try {
      await shareApi.recordShare({
        content_type: contentType,
        content_id: contentId,
        platform: 'wechat'
      });
      
      // 显示二维码或提示
      toast.success('请使用微信扫描二维码分享');
    } catch (error) {
      console.error('Failed to record share:', error);
    }
  };

  const handleShareToWeibo = async () => {
    if (!shareData) return;

    const shareText = `${shareData.title} - ${shareData.description || ''}`;
    const weiboUrl = `https://service.weibo.com/share/share.php?title=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareData.url)}`;
    
    window.open(weiboUrl, '_blank', 'width=600,height=400');
    
    try {
      await shareApi.recordShare({
        content_type: contentType,
        content_id: contentId,
        platform: 'weibo'
      });
    } catch (error) {
      console.error('Failed to record share:', error);
    }
  };

  const handleShareToTwitter = async () => {
    if (!shareData) return;

    const shareText = `${shareData.title}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareData.url)}`;
    
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    
    try {
      await shareApi.recordShare({
        content_type: contentType,
        content_id: contentId,
        platform: 'twitter'
      });
    } catch (error) {
      console.error('Failed to record share:', error);
    }
  };

  const handleShareToFacebook = async () => {
    if (!shareData) return;

    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`;
    
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    
    try {
      await shareApi.recordShare({
        content_type: contentType,
        content_id: contentId,
        platform: 'facebook'
      });
    } catch (error) {
      console.error('Failed to record share:', error);
    }
  };

  const shareOptions: ShareOption[] = [
    {
      id: 'copy',
      name: '复制链接',
      icon: copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />,
      color: 'bg-gray-100 hover:bg-gray-200',
      action: handleCopyLink
    },
    {
      id: 'wechat',
      name: '微信',
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'bg-green-100 hover:bg-green-200 text-green-600',
      action: handleShareToWeChat
    },
    {
      id: 'weibo',
      name: '微博',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.737 5.439l-.002.004zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.18.573h.014zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149zm7.563-1.224c-.346-.105-.579-.18-.405-.649.389-1.061.428-1.979.012-2.636-.786-1.218-2.938-1.146-5.419-.034 0 0-.777.34-.578-.275.381-1.205.324-2.213-.271-2.8-1.349-1.33-4.937.045-8.013 3.073-2.299 2.262-3.637 4.66-3.637 6.729 0 3.958 5.063 6.37 10.024 6.37 6.496 0 10.817-3.779 10.817-6.783 0-1.815-1.529-2.844-2.54-2.995zm.554-5.445c-.869-.978-2.159-1.435-3.449-1.278-.45.053-.765.448-.711.896.053.45.447.766.896.712.754-.09 1.507.166 2.02.744.515.579.712 1.349.545 2.168-.104.507.223 1.001.729 1.105.507.104 1.001-.223 1.105-.729.285-1.383-.015-2.793-.857-3.838l-.278-.78z"/>
      </svg>,
      color: 'bg-red-100 hover:bg-red-200 text-red-600',
      action: handleShareToWeibo
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: <Twitter className="w-5 h-5" />,
      color: 'bg-blue-100 hover:bg-blue-200 text-blue-500',
      action: handleShareToTwitter
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <Facebook className="w-5 h-5" />,
      color: 'bg-blue-100 hover:bg-blue-200 text-blue-700',
      action: handleShareToFacebook
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div 
        className="relative w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        {/* 头部 */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <h3 
            className="text-lg font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            分享
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容预览 */}
        {shareData && (
          <div className="p-4">
            <div 
              className="flex gap-3 p-3 rounded-lg border"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)'
              }}
            >
              {shareData.image ? (
                <img 
                  src={shareData.image} 
                  alt={shareData.title}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                />
              ) : (
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--bg-card)' }}
                >
                  <Link2 className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 
                  className="font-medium truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {shareData.title}
                </h4>
                {shareData.description && (
                  <p 
                    className="text-sm mt-1 line-clamp-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {shareData.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 分享选项 */}
        <div className="px-4 pb-4">
          <p 
            className="text-sm mb-3"
            style={{ color: 'var(--text-secondary)' }}
          >
            选择分享方式
          </p>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div 
                className="w-8 h-8 border-4 rounded-full animate-spin"
                style={{
                  borderColor: 'var(--border-color)',
                  borderTopColor: 'var(--accent-color)'
                }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
              {shareOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={option.action}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${option.color}`}
                >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    {option.icon}
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {option.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 链接输入框 */}
        {shareData && (
          <div 
            className="px-4 pb-4"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="pt-4">
              <label 
                className="text-sm block mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                分享链接
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareData.url}
                  readOnly
                  className="flex-1 px-3 py-2 rounded-lg border text-sm"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--accent-color)',
                    color: 'white'
                  }}
                >
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
