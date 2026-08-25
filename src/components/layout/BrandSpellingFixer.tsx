"use client";

import { useEffect } from "react";

const WRONG = /HygiaTrade/g;
const CORRECT = "HigiaTrade";

const fixNode = (root: ParentNode | Node) => {
  if (root.nodeType === Node.TEXT_NODE) {
    const textNode = root as Text;
    if (textNode.nodeValue?.includes("HygiaTrade")) textNode.nodeValue = textNode.nodeValue.replace(WRONG, CORRECT);
    return;
  }

  if (!(root instanceof Element || root instanceof Document)) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const textNode = node as Text;
    if (textNode.nodeValue?.includes("HygiaTrade")) textNode.nodeValue = textNode.nodeValue.replace(WRONG, CORRECT);
    node = walker.nextNode();
  }

  if (root instanceof Element) {
    for (const attr of ["title", "aria-label", "alt", "placeholder"]) {
      const value = root.getAttribute(attr);
      if (value?.includes("HygiaTrade")) root.setAttribute(attr, value.replace(WRONG, CORRECT));
    }
  }
};

const fixHead = () => {
  document.title = document.title.replace(WRONG, CORRECT);
  document.querySelectorAll("meta[content]").forEach((meta) => {
    const content = meta.getAttribute("content");
    if (content?.includes("HygiaTrade")) meta.setAttribute("content", content.replace(WRONG, CORRECT));
  });
};

const BrandSpellingFixer = () => {
  useEffect(() => {
    fixNode(document.body);
    fixHead();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => fixNode(node));
        if (mutation.type === "characterData") fixNode(mutation.target);
      }
      fixHead();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: false });
    return () => observer.disconnect();
  }, []);

  return null;
};

export default BrandSpellingFixer;
