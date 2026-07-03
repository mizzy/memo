import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor as TiptapEditor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { resizeImage } from "../images.js";

type Props = {
  memoId: string;
  content: string;
  onChange: (content: string) => void;
  onUploadError: () => void;
};

function getImageFiles(fileList: FileList | null | undefined) {
  return Array.from(fileList ?? []).filter((file) =>
    file.type.startsWith("image/")
  );
}

export function Editor({ memoId, content, onChange, onUploadError }: Props) {
  const editorRef = useRef<TiptapEditor | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const insertImageFiles = useCallback(
    async (files: File[], position?: number) => {
      if (files.length === 0) return;

      setUploading(true);
      try {
        let nextPosition = position;
        for (const file of files) {
          const blob = await resizeImage(file);
          const { key } = await api.images.upload(blob);
          const currentEditor = editorRef.current;
          if (!currentEditor) continue;

          let chain = currentEditor.chain().focus();
          if (nextPosition !== undefined) {
            chain = chain.setTextSelection(nextPosition);
            nextPosition = undefined;
          }
          chain.setImage({ src: `/api/images/${key}` }).run();
        }
      } catch {
        onUploadError();
      } finally {
        setUploading(false);
      }
    },
    [onUploadError]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Placeholder.configure({ placeholder: "書きはじめる…" }),
    ],
    content,
    editorProps: {
      handlePaste: (_view, event) => {
        const files = getImageFiles(event.clipboardData?.files);
        if (files.length === 0) return false;

        event.preventDefault();
        void insertImageFiles(files);
        return true;
      },
      handleDrop: (view, event) => {
        const files = getImageFiles(event.dataTransfer?.files);
        if (files.length === 0) return false;

        const position = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        })?.pos;
        event.preventDefault();
        void insertImageFiles(files, position);
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    editorRef.current = editor;
    return () => {
      if (editorRef.current === editor) editorRef.current = null;
    };
  }, [editor]);

  // メモ切り替え時のみ内容を差し替える (入力中のカーソル飛びを防ぐ)
  useEffect(() => {
    if (editor) {
      editor.commands.setContent(content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoId, editor]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = getImageFiles(event.currentTarget.files);
    event.currentTarget.value = "";
    void insertImageFiles(files);
  };

  return (
    <div>
      <EditorContent editor={editor} />
      <div className="mt-6 flex">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-[9px] border border-hair-strong px-3.5 py-2 text-xs text-fg-dim transition-colors hover:border-lamp/50 hover:text-fg disabled:cursor-not-allowed disabled:opacity-45"
        >
          <svg
            aria-hidden="true"
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="9" cy="9" r="1.6" />
            <path
              d="M21 15l-5-5L5 21"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          画像を追加
        </button>
      </div>
    </div>
  );
}
