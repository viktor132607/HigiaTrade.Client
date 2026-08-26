import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import SimpleRichTextEditor from "./SimpleRichTextEditor";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

type EditorTarget = {
  textarea: HTMLTextAreaElement;
  mount: HTMLDivElement;
};

const ProductDescriptionEnhancer = () => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [target, setTarget] = useState<EditorTarget | null>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    let activeTarget: EditorTarget | null = null;

    const detach = () => {
      if (!activeTarget) return;
      activeTarget.textarea.style.display = "";
      activeTarget.textarea.removeAttribute("data-rich-description-source");
      activeTarget.mount.remove();
      activeTarget = null;
      setTarget(null);
    };

    const attach = () => {
      if (activeTarget && document.body.contains(activeTarget.textarea) && document.body.contains(activeTarget.mount)) return;
      if (activeTarget) detach();

      const textarea = Array.from(document.querySelectorAll("textarea")).find((item) => {
        const label = item.parentElement?.querySelector("label")?.textContent?.trim() ?? "";
        return label === "Описание" || label === "Description";
      });
      if (!textarea || textarea.dataset.richDescriptionSource === "true") return;

      const mount = document.createElement("div");
      mount.dataset.richDescriptionEditor = "true";
      textarea.dataset.richDescriptionSource = "true";
      textarea.style.display = "none";
      textarea.insertAdjacentElement("afterend", mount);
      activeTarget = { textarea, mount };
      setValue(textarea.value || "");
      setTarget(activeTarget);
    };

    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => { observer.disconnect(); detach(); };
  }, [language]);

  if (!target) return null;

  const updateDescription = (html: string) => {
    const plainText = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
    const normalized = plainText ? html : "";
    setValue(normalized);
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
    setter?.call(target.textarea, normalized);
    target.textarea.dispatchEvent(new Event("input", { bubbles: true }));
    target.textarea.dispatchEvent(new Event("change", { bubbles: true }));
  };

  return createPortal(
    <SimpleRichTextEditor value={value} onChange={updateDescription} placeholder={isBg ? "Въведи описание на продукта..." : "Enter product description..."} />,
    target.mount
  );
};

export default ProductDescriptionEnhancer;
