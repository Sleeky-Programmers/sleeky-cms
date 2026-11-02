"use client";

import { use, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { Placeholder } from "@tiptap/extensions";
import { richTextExtensions, type RichTextDoc } from "@/lib/insights/rich-text";
import { isSafeLink } from "@/lib/insights/sanitize";
import { ACCEPT_ATTRIBUTE, ImageAreaContext, uploadImage } from "./upload-image";

type RichTextEditorProps = {
    initialContent: RichTextDoc;
    onChange: (doc: RichTextDoc) => void;
    imagesEnabled: boolean;
    invalid?: boolean;
    describedBy?: string;
};

export function RichTextEditor({ initialContent, onChange, imagesEnabled, invalid, describedBy }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [...richTextExtensions, Placeholder.configure({ placeholder: "Start writing the article…" })],
        content: initialContent,
        // Rendered on the server first; create the editor in the browser only.
        immediatelyRender: false,
        // Round-trip through JSON: ProseMirror builds some attribute objects without a
        // normal prototype, which Server Actions refuse to send as plain data.
        onUpdate: ({ editor: current }) => onChange(JSON.parse(JSON.stringify(current.getJSON())) as RichTextDoc),
        editorProps: {
            attributes: {
                class: "rich-text min-h-[420px] px-6 py-5 focus:outline-none",
                role: "textbox",
                "aria-multiline": "true",
                "aria-label": "Article body",
                ...(describedBy ? { "aria-describedby": describedBy } : {}),
                ...(invalid ? { "aria-invalid": "true" } : {}),
            },
        },
    });

    return (
        <div className={`overflow-hidden rounded-[18px] border bg-surface ${invalid ? "border-danger" : "border-slate"} focus-within:border-green`}>
            {editor ? <Toolbar editor={editor} imagesEnabled={imagesEnabled} /> : <div className="h-[49px] border-b border-line" />}
            <EditorContent editor={editor} />
        </div>
    );
}

function Toolbar({ editor, imagesEnabled }: { editor: Editor; imagesEnabled: boolean }) {
    const fileInput = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const area = use(ImageAreaContext);

    const state = useEditorState({
        editor,
        selector: ({ editor: current }) => ({
            h2: current.isActive("heading", { level: 2 }),
            h3: current.isActive("heading", { level: 3 }),
            bold: current.isActive("bold"),
            italic: current.isActive("italic"),
            underline: current.isActive("underline"),
            strike: current.isActive("strike"),
            link: current.isActive("link"),
            bulletList: current.isActive("bulletList"),
            orderedList: current.isActive("orderedList"),
            blockquote: current.isActive("blockquote"),
            canUndo: current.can().undo(),
            canRedo: current.can().redo(),
        }),
    });

    const setLink = () => {
        const previous = (editor.getAttributes("link").href as string | undefined) ?? "";
        const value = window.prompt("Link address (leave empty to remove the link)", previous);
        if (value === null) return;
        const href = value.trim();
        if (!href) {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }
        const normalized = /^(https?:|mailto:|tel:|\/|#)/i.test(href) ? href : `https://${href}`;
        if (!isSafeLink(normalized)) {
            window.alert("Use a web address (https://…), an email (mailto:…) or a phone number (tel:…).");
            return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: normalized }).run();
    };

    const insertImage = async (file: File) => {
        setUploadError("");
        setUploading(true);
        try {
            const image = await uploadImage(file, area);
            const alt = window.prompt("Describe this image for people who can't see it:", "") ?? "";
            editor.chain().focus().setImage({ src: image.url, alt: alt.trim() }).run();
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : "Upload failed.");
        } finally {
            setUploading(false);
            if (fileInput.current) fileInput.current.value = "";
        }
    };

    const chain = () => editor.chain().focus();

    return (
        <div className="sticky top-0 z-10 border-b border-line bg-ink-raised">
            <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-1 px-2 py-2">
                <ToolButton label="Heading" active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>H2</ToolButton>
                <ToolButton label="Subheading" active={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>H3</ToolButton>
                <Divider />
                <ToolButton label="Bold (Ctrl+B)" active={state.bold} onClick={() => chain().toggleBold().run()}><b>B</b></ToolButton>
                <ToolButton label="Italic (Ctrl+I)" active={state.italic} onClick={() => chain().toggleItalic().run()}><i>I</i></ToolButton>
                <ToolButton label="Underline (Ctrl+U)" active={state.underline} onClick={() => chain().toggleUnderline().run()}><u>U</u></ToolButton>
                <ToolButton label="Strikethrough" active={state.strike} onClick={() => chain().toggleStrike().run()}><s>S</s></ToolButton>
                <ToolButton label="Link" active={state.link} onClick={setLink}>Link</ToolButton>
                <Divider />
                <ToolButton label="Bulleted list" active={state.bulletList} onClick={() => chain().toggleBulletList().run()}>• List</ToolButton>
                <ToolButton label="Numbered list" active={state.orderedList} onClick={() => chain().toggleOrderedList().run()}>1. List</ToolButton>
                <ToolButton label="Quote" active={state.blockquote} onClick={() => chain().toggleBlockquote().run()}>Quote</ToolButton>
                <ToolButton label="Divider" onClick={() => chain().setHorizontalRule().run()}>―</ToolButton>
                {imagesEnabled && (
                    <>
                        <ToolButton label="Insert image" onClick={() => fileInput.current?.click()} disabled={uploading}>
                            {uploading ? "Uploading…" : "Image"}
                        </ToolButton>
                        <input
                            ref={fileInput}
                            type="file"
                            accept={ACCEPT_ATTRIBUTE}
                            className="sr-only"
                            tabIndex={-1}
                            aria-hidden="true"
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) void insertImage(file);
                            }}
                        />
                    </>
                )}
                <Divider />
                <ToolButton label="Undo (Ctrl+Z)" onClick={() => chain().undo().run()} disabled={!state.canUndo}>Undo</ToolButton>
                <ToolButton label="Redo (Ctrl+Shift+Z)" onClick={() => chain().redo().run()} disabled={!state.canRedo}>Redo</ToolButton>
            </div>
            {uploadError && <p role="alert" className="border-t border-line px-4 py-2 text-sm text-danger">{uploadError}</p>}
        </div>
    );
}

function ToolButton({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active ?? undefined}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
            className="min-w-9 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-soft transition-colors hover:bg-surface hover:text-white disabled:cursor-not-allowed disabled:opacity-40 aria-pressed:bg-green-deep aria-pressed:text-green"
        >
            {children}
        </button>
    );
}

const Divider = () => <span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />;
