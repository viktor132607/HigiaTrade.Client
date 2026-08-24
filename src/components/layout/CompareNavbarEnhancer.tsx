import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

const CompareNavbarEnhancer = () => {
  const navigate = useNavigate();
  const compareCount = useSelector((state: RootState) => state.compare.items.length);

  useEffect(() => {
    const button = document.querySelector<HTMLButtonElement>(
      'header button[title="Сравни"], header button[title="Compare"]'
    );

    if (!button) return;

    const handleClick = (event: MouseEvent) => {
      event.preventDefault();
      navigate("/compare");
    };

    button.addEventListener("click", handleClick);
    const badge = button.querySelector("span");
    if (badge) badge.textContent = String(compareCount);

    return () => {
      button.removeEventListener("click", handleClick);
    };
  }, [compareCount, navigate]);

  return null;
};

export default CompareNavbarEnhancer;
