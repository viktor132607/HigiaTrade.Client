"use client";

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const WRONG = /HygiaTrade/g;
const CORRECT = "HigiaTrade";

const fixText = (value: string | null) =>
  value?.includes("HygiaTrade") ? value.replace(WRONG, CORRECT) : value;

const fixDocument = () => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    const textNode = node as Text;
    const next = fixText(textNode.nodeValue);
    if (next !== textNode.nodeValue && next != null) textNode.nodeValue = next;
    node = walker.nextNode();
  }

  document.querySelectorAll("[title], [aria-label], [alt], [placeholder]").forEach((element) => {
    for (const attr of ["title", "aria-label", "alt", "placeholder"]) {
      const current = element.getAttribute(attr);
      const next = fixText(current);
      if (next !== current && next != null) element.setAttribute(attr, next);
    }
  });

  const nextTitle = fixText(document.title);
  if (nextTitle && nextTitle !== document.title) document.title = nextTitle;

  document.querySelectorAll("meta[content]").forEach((meta) => {
    const current = meta.getAttribute("content");
    const next = fixText(current);
    if (next !== current && next != null) meta.setAttribute("content", next);
  });
};

const BrandSpellingFixer = () => {
  const location = useLocation();

  useEffect(() => {
    // Do a few bounded passes after route rendering. A permanent MutationObserver here
    // caused feedback with the existing global UI observer and could lock the page.
    fixDocument();
    const frame = requestAnimationFrame(fixDocument);
    const timer = window.setTimeout(fixDocument, 150);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [location.pathname, location.search]);

  return null;
};

export default BrandSpellingFixer;
