import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { type RootState } from "../../store";
import {
  COMPARE_STORAGE_KEY, hydrateCompare, readCompareItems, writeCompareItems,
} from "../../store/slices/compareSlice";

// Persist on changes (not inside reducers), hydrate only after mount and
// synchronize changes made in another browser tab.
const CompareStateSync = () => {
  const dispatch = useDispatch();
  const items = useSelector((state: RootState) => state.compare.items);
  const hydrated = useSelector((state: RootState) => state.compare.hydrated);

  useEffect(() => {
    dispatch(hydrateCompare(readCompareItems()));
    const syncOtherTab = (event: StorageEvent) => {
      if (event.key === COMPARE_STORAGE_KEY) {
        dispatch(hydrateCompare(readCompareItems()));
      }
    };
    window.addEventListener("storage", syncOtherTab);
    return () => window.removeEventListener("storage", syncOtherTab);
  }, [dispatch]);

  useEffect(() => {
    if (hydrated) writeCompareItems(items);
  }, [hydrated, items]);

  return null;
};

export default CompareStateSync;
