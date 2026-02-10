import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { ShareModal } from './ShareModal';

interface ShareButtonProps {
  contentType: 'record' | 'experience' | 'collection';
  contentId: string;
  title?: string;
  description?: string;
  image?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  contentType,
  contentId,
  title,
  description,
  image,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const variantClasses = {
    default: 'bg-[var(--accent-color)] text-white hover:opacity-90',
    ghost: 'hover:bg-[var(--bg-secondary)]',
    outline: 'border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]'
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`rounded-lg transition-colors flex items-center gap-1.5 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        style={variant === 'ghost' || variant === 'outline' ? { color: 'var(--text-secondary)' } : {}}
        title="分享"
      >
        <Share2 className={iconSizes[size]} />
        <span className="text-sm hidden sm:inline">分享</span>
      </button>

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contentType={contentType}
        contentId={contentId}
        title={title}
        description={description}
        image={image}
      />
    </>
  );
};
