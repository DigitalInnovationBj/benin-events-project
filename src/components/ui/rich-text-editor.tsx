"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Heading2,
    Heading3,
    Undo,
    Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    content?: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
}

export function RichTextEditor({ content = "", onChange, placeholder, className }: Props) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: placeholder ?? "Décrivez votre évènement en détail…",
            }),
        ],
        content,
        onUpdate({ editor }) {
            const html = editor.getHTML();
            // Considérer l'éditeur vide si le seul contenu est un <p></p>
            onChange(html === "<p></p>" ? "" : html);
        },
        editorProps: {
            attributes: {
                class: "prose dark:prose-invert max-w-none focus:outline-none min-h-48 px-4 py-3 text-sm leading-relaxed",
            },
        },
        immediatelyRender: false,
    });

    if (!editor) return null;

    return (
        <div className={cn("border rounded-xl overflow-hidden bg-background", className)}>
            {/* ── Barre d'outils ── */}
            <div className="flex items-center gap-0.5 border-b bg-muted/40 px-2 py-1.5 flex-wrap">
                <ToolBtn
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive("bold")}
                    title="Gras (Ctrl+B)"
                >
                    <Bold className="w-4 h-4" />
                </ToolBtn>
                <ToolBtn
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive("italic")}
                    title="Italique (Ctrl+I)"
                >
                    <Italic className="w-4 h-4" />
                </ToolBtn>

                <Sep />

                <ToolBtn
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    active={editor.isActive("heading", { level: 2 })}
                    title="Titre H2"
                >
                    <Heading2 className="w-4 h-4" />
                </ToolBtn>
                <ToolBtn
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    active={editor.isActive("heading", { level: 3 })}
                    title="Titre H3"
                >
                    <Heading3 className="w-4 h-4" />
                </ToolBtn>

                <Sep />

                <ToolBtn
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive("bulletList")}
                    title="Liste à puces"
                >
                    <List className="w-4 h-4" />
                </ToolBtn>
                <ToolBtn
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive("orderedList")}
                    title="Liste numérotée"
                >
                    <ListOrdered className="w-4 h-4" />
                </ToolBtn>

                <div className="ml-auto flex items-center gap-0.5">
                    <ToolBtn
                        onClick={() => editor.chain().focus().undo().run()}
                        active={false}
                        disabled={!editor.can().undo()}
                        title="Annuler (Ctrl+Z)"
                    >
                        <Undo className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        onClick={() => editor.chain().focus().redo().run()}
                        active={false}
                        disabled={!editor.can().redo()}
                        title="Rétablir (Ctrl+Shift+Z)"
                    >
                        <Redo className="w-4 h-4" />
                    </ToolBtn>
                </div>
            </div>

            {/* ── Zone d'édition ── */}
            <EditorContent editor={editor} />
        </div>
    );
}

function ToolBtn({
    onClick,
    active,
    disabled,
    title,
    children,
}: {
    onClick: () => void;
    active: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={cn(
                "p-1.5 rounded transition-colors",
                active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                disabled && "opacity-30 pointer-events-none",
            )}
        >
            {children}
        </button>
    );
}

function Sep() {
    return <div className="w-px h-5 bg-border mx-1 shrink-0" />;
}
