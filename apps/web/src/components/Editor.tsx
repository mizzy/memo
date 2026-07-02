import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

type Props = {
  memoId: string;
  content: string;
  onChange: (content: string) => void;
};

export function Editor({ memoId, content, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "書きはじめる…" }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // メモ切り替え時のみ内容を差し替える (入力中のカーソル飛びを防ぐ)
  useEffect(() => {
    if (editor) {
      editor.commands.setContent(content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoId, editor]);

  return <EditorContent editor={editor} />;
}
