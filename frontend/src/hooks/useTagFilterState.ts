import { useCallback, useEffect, useMemo, useState } from "react";
import { TagFilterStorageService } from "../core/tagFilter/tagFilterStorageService";
import {
  initializeSelection,
  toAppliedTags,
  toggleTagSelection,
} from "../core/tagFilter/tagFilterSelectionPolicy";

export type UseTagFilterStateResult = {
  selectedTags: string[];
  appliedTags: string[] | undefined;
  isFilterExpanded: boolean;
  setFilterExpanded(next: boolean): void;
  handleToggleTagSelection(tag: string): void;
  applyFilter(): void;
  clearFilter(): void;
};

export function useTagFilterState(scope: string): UseTagFilterStateResult {
  const tagFilterStorage = useMemo(() => new TagFilterStorageService(scope), [scope]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [appliedTags, setAppliedTags] = useState<string[] | undefined>();
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const restored = await tagFilterStorage.restore();
        setAppliedTags(restored);
      } finally {
        setHydrated(true);
      }
    })();
  }, [tagFilterStorage]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    void tagFilterStorage.save(appliedTags);
  }, [appliedTags, hydrated, tagFilterStorage]);

  useEffect(() => {
    setSelectedTags(initializeSelection(appliedTags));
  }, [appliedTags]);

  const handleToggleTagSelection = useCallback((tag: string) => {
    setSelectedTags((prev) => toggleTagSelection(prev, tag));
  }, []);

  const applyFilter = useCallback(() => {
    setAppliedTags(toAppliedTags(selectedTags));
    setIsFilterExpanded(false);
  }, [selectedTags]);

  const clearFilter = useCallback(() => {
    setSelectedTags([]);
    setAppliedTags(undefined);
    setIsFilterExpanded(false);
  }, []);

  return {
    selectedTags,
    appliedTags,
    isFilterExpanded,
    setFilterExpanded: setIsFilterExpanded,
    handleToggleTagSelection,
    applyFilter,
    clearFilter,
  };
}
