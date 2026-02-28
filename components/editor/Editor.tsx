"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { memo, useEffect } from "react";

const Editor = ({ onChange, initialContent }: { onChange: (html: string) => void; initialContent?: string }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: initialContent || "",
    immediatelyRender: false,
    shouldRerenderOnTransaction: false, // ✅ မြန်မာစာအတွက် အသက်
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        // ✅ Medium Style: ဘောင်မရှိ၊ Shadow မရှိ၊ Font ရှင်းရှင်း
        class: "prose prose-lg focus:outline-none max-w-none text-xl leading-[2] font-serif min-h-[70vh] outline-none placeholder:text-gray-300",
      },
    },
  });

  // Cleanup
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Static Toolbar */}
      <div className="sticky top-[80px] z-20 flex flex-wrap gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl shadow-sm">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${editor.isActive('bold') ? 'bg-indigo-600 text-white shadow' : 'text-gray-700 hover:bg-gray-200'}`}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1.5 rounded-lg text-sm italic transition-colors ${editor.isActive('italic') ? 'bg-indigo-600 text-white shadow' : 'text-gray-700 hover:bg-gray-200'}`}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`px-3 py-1.5 rounded-lg text-sm underline transition-colors ${editor.isActive('underline') ? 'bg-indigo-600 text-white shadow' : 'text-gray-700 hover:bg-gray-200'}`}
        >
          Underline
        </button>
        <div className="w-px bg-gray-300 mx-1 my-1"></div>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-600 text-white shadow' : 'text-gray-700 hover:bg-gray-200'}`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-indigo-600 text-white shadow' : 'text-gray-700 hover:bg-gray-200'}`}
        >
          H3
        </button>
      </div>

      <div
        className="cursor-text bg-white rounded-xl p-6 min-h-[50vh] border border-gray-100 shadow-sm"
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default memo(Editor);