import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

const CompareNavbarEnhancer = () => {
  const navigate = useNavigate();
  const compareCount = useSelector((state: RootState) => state.compare.items.length);

  useEffect(() => {
    const bind = () => {
      const buttons = Array.from(
        document.querySelectorAll<HTMLButtonElement>('button[title="Сравни"], button[title="Compare"]')
      );

      buttons.forEach((button) => {
        button.onclick = (event) => {
          event.preventDefault();
          navigate("/compare");
        };

        const badge = button.querySelector("span");
        if (badge) badge.textContent = String(compareCount);
      });
    };

    bind();
    const observer = new MutationObserver(bind);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["title"] });
    return () => observer.disconnect();
  }, [compareCount, navigate]);

  return null;
};

export default CompareNavbarEnhancer;
