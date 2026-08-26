import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const setSelectValue = (select: HTMLSelectElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value")?.set;
  setter?.call(select, value);
  select.dispatchEvent(new Event("change", { bubbles: true }));
};

const ProductAvailabilitySortEnhancer = () => {
  const [mount, setMount] = useState<HTMLDivElement | null>(null);
  const [sortBySelect, setSortBySelect] = useState<HTMLSelectElement | null>(null);
  const [sortOrderSelect, setSortOrderSelect] = useState<HTMLSelectElement | null>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    let activeMount: HTMLDivElement | null = null;

    const attach = () => {
      const sortBy = document.querySelector<HTMLSelectElement>("#sortBy");
      const sortOrder = document.querySelector<HTMLSelectElement>("#sortOrder");
      if (!sortBy || !sortOrder) return;

      if (!Array.from(sortBy.options).some((option) => option.value === "quantity")) {
        const option = document.createElement("option");
        option.value = "quantity";
        option.textContent = "Наличност";
        sortBy.appendChild(option);
      }

      if (activeMount && document.body.contains(activeMount)) return;

      activeMount?.remove();
      activeMount = document.createElement("div");
      activeMount.dataset.availabilitySortEnhancer = "true";
      sortOrder.parentElement?.insertAdjacentElement("afterend", activeMount);

      setMount(activeMount);
      setSortBySelect(sortBy);
      setSortOrderSelect(sortOrder);

      const sync = () => {
        setValue(sortBy.value === "quantity" ? sortOrder.value : "");
      };
      sync();
      sortBy.addEventListener("change", sync);
      sortOrder.addEventListener("change", sync);

      activeMount.dataset.cleanupReady = "true";
      (activeMount as any).__cleanup = () => {
        sortBy.removeEventListener("change", sync);
        sortOrder.removeEventListener("change", sync);
      };
    };

    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (activeMount) {
        (activeMount as any).__cleanup?.();
        activeMount.remove();
      }
    };
  }, []);

  if (!mount || !sortBySelect || !sortOrderSelect) return null;

  const changeAvailabilitySort = (nextValue: string) => {
    setValue(nextValue);
    if (!nextValue) return;
    setSelectValue(sortBySelect, "quantity");
    setSelectValue(sortOrderSelect, nextValue);
  };

  return createPortal(
    <div className="flex items-center gap-2">
      <label htmlFor="availabilitySort" className="text-sm text-gray-700">По наличност:</label>
      <select
        id="availabilitySort"
        value={value}
        onChange={(event) => changeAvailabilitySort(event.target.value)}
        className="block w-44 rounded-md border-gray-300 shadow-sm sm:text-sm"
      >
        <option value="">Избери</option>
        <option value="desc">Най-много първо</option>
        <option value="asc">Най-малко първо</option>
      </select>
    </div>,
    mount
  );
};

export default ProductAvailabilitySortEnhancer;
