import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

const CompareNavbarEnhancer = () => {
  const navigate = useNavigate();
  const compareCount = useSelector((state: RootState) => state.compare.items.length);

  useEffect(() => {
    const bind = () => {
      const button = document.querySelector<HTMLButtonElement>(
        'header button[title="Сравни"], header button[title="Compare"]'
      );

      if (!button) return;

      button.onclick = (event) => {
        event.preventDefault();
        navigate("/compare");
      };

      const badge = button.querySelector("span");
      if (badge) badge.textContent = String(compareCount);
    };

    bind();
    const observer = new MutationObserver(bind);
    observer.observe(document.querySelector("header") ?? document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      const button = document.querySelector<HTMLButtonElement>(
        'header button[title="Сравни"], header button[title="Compare"]'
      );
      if (button) button.onclick = null;
    };
  }, [compareCount, navigate]);

  return null;
};

export default CompareNavbarEnhancer;
