"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { memo, useEffect, useState } from "react";

const Editor = ({ onChange, initialContent }: { onChange: (html: string) => void; initialContent?: string }) => {
  const [isSelectionActive, setIsSelectionActive] = useState(false);

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
    onSelectionUpdate: ({ editor }) => {
      setIsSelectionActive(!editor.state.selection.empty);
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
    <div className="flex flex-col gap-6 relative">
      {/* Selection-Triggered Toolbar (Static position at top for stability) */}
      <div className={`sticky top-0 z-20 flex items-center justify-center transition-all duration-300 ${isSelectionActive ? 'opacity-100 translate-y-0 h-auto mb-4' : 'opacity-0 -translate-y-4 h-0 pointer-events-none overflow-hidden'}`}>
        <div className="flex items-center gap-1 p-1 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${editor.isActive('bold') ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
          >
            Bold
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-2 rounded-lg text-xs italic transition-all ${editor.isActive('italic') ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
          >
            Italic
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`px-3 py-2 rounded-lg text-xs underline transition-all ${editor.isActive('underline') ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
          >
            Underline
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1"></div>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${editor.isActive('heading', { level: 3 }) ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
          >
            H3
          </button>
        </div>
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