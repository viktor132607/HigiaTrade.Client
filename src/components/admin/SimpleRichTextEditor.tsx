import React, { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const allowedTags = new Set([
  "P",
  "DIV",
  "BR",
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "UL",
  "OL",
  "LI",
]);

const cleanHtml = (html: string) => {
  if (typeof window === "undefined") return html;

  const template = document.createElement("template");
  template.innerHTML = html;

  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType !== Node.ELEMENT_NODE) return;

      const element = child as HTMLElement;
      walk(element);

      if (!allowedTags.has(element.tagName)) {
        element.replaceWith(...Array.from(element.childNodes));
        return;
      }

      Array.from(element.attributes).forEach((attribute) =>
        element.removeAttribute(attribute.name)
      );
    });
  };

  walk(template.content);
  return template.innerHTML;
};

const SimpleRichTextEditor = ({ value, onChange, placeholder }: Props) => {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;

    const nextValue = value || "";
    if (editor.innerHTML !== nextValue) {
      editor.innerHTML = nextValue;
    }
  }, [value]);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;
    onChange(cleanHtml(editor.innerHTML));
  };

  const runCommand = (command: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false);
    emitChange();
  };

  const toolbarButton =
    "min-h-9 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-slate-50 active:bg-slate-100";

  return (
    <div className="mt-1 overflow-hidden rounded-md border border-slate-500 bg-white shadow-sm focus-within:border-[#18b99f] focus-within:ring-2 focus-within:ring-[#18b99f]/20">
      <div className="flex flex-wrap gap-1.5 border-b border-slate-300 bg-slate-50 p-2">
        <button
          type="button"
          className={`${toolbarButton} font-bold`}
          title="Удебелен"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand("bold")}
        >
          B
        </button>
        <button
          type="button"
          className={`${toolbarButton} italic`}
          title="Наклонен"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand("italic")}
        >
          I
        </button>
        <button
          type="button"
          className={`${toolbarButton} underline`}
          title="Подчертан"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand("underline")}
        >
          U
        </button>
        <button
          type="button"
          className={toolbarButton}
          title="Списък с точки"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand("insertUnorderedList")}
        >
          • Списък
        </button>
        <button
          type="button"
          className={toolbarButton}
          title="Номериран списък"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand("insertOrderedList")}
        >
          1. Списък
        </button>
        <button
          type="button"
          className={toolbarButton}
          title="Премахни форматирането"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand("removeFormat")}
        >
          Изчисти формат
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder || "Въведи описание..."}
        onInput={emitChange}
        onBlur={emitChange}
        className="min-h-44 w-full px-3 py-3 text-gray-900 outline-none empty:before:pointer-events-none empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)] [&_ol]:ml-6 [&_ol]:list-decimal [&_p]:my-2 [&_ul]:ml-6 [&_ul]:list-disc"
      />
    </div>
  );
};

export default SimpleRichTextEditor;
