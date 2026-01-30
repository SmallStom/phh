import React, { useCallback } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { uploadApi } from '../api/upload';
import toast from 'react-hot-toast';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = '开始输入...',
  className = '',
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    try {
      const response = await uploadApi.uploadImage(file);
      if (response.data.success) {
        const { url } = response.data.data;
        editor.chain().focus().setImage({ src: url }).run();
        toast.success('图片上传成功');
      }
    } catch (error) {
      toast.error('图片上传失败');
      console.error('Image upload error:', error);
    }
  }, [editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('输入链接地址:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50 dark:bg-gray-800">
        {/* 文本样式 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
              editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''
            }`}
            title="粗体"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6V4zm0 8h9a4 4 0 014 4 4 4 0 01-4 4H6v-8z" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
              editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''
            }`}
            title="斜体"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
              editor.isActive('strike') ? 'bg-gray-200 dark:bg-gray-700' : ''
            }`}
            title="删除线"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        {/* 标题 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
              editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 dark:bg-gray-700' : ''
            }`}
            title="标题1"
          >
            <span className="font-bold text-sm">H1</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-gray-700' : ''
            }`}
            title="标题2"
          >
            <span className="font-bold text-sm">H2</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
              editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 dark:bg-gray-700' : ''
            }`}
            title="标题3"
          >
            <span className="font-bold text-sm">H3</span>
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        {/* 列表 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
              editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700' : ''
            }`}
            title="无序列表"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
              editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700' : ''
            }`}
            title="有序列表"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h12M7 12h12M7 17h12M3 7h.01M3 12h.01M3 17h.01" />
            </svg>
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        {/* 引用和代码 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
              editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-700' : ''
            }`}
            title="引用"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
              editor.isActive('codeBlock') ? 'bg-gray-200 dark:bg-gray-700' : ''
            }`}
            title="代码块"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        {/* 链接和图片 */}
        <div className="flex items-center gap-1">
          <button
            onClick={addLink}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
              editor.isActive('link') ? 'bg-gray-200 dark:bg-gray-700' : ''
            }`}
            title="插入链接"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          <label className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer" title="上传图片">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </label>
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        {/* 撤销/重做 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="撤销"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="重做"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* 编辑器内容 */}
      <EditorContent
        editor={editor}
        className="prose dark:prose-invert max-w-none p-4 min-h-[200px] focus:outline-none"
      />

      {/* 浮动菜单 */}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded shadow-lg border">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1 rounded ${editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            >
              <span className="font-bold text-xs">B</span>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1 rounded ${editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            >
              <span className="italic text-xs">I</span>
            </button>
            <button
              onClick={() => editor.chain().focus().unsetLink().run()}
              className={`p-1 rounded ${editor.isActive('link') ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </BubbleMenu>
      )}
    </div>
  );
};
