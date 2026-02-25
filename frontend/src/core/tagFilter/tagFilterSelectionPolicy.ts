export function toggleTagSelection(selectedTags: readonly string[], targetTag: string): string[] {
  return selectedTags.includes(targetTag)
    ? selectedTags.filter((tag) => tag !== targetTag)
    : [...selectedTags, targetTag];
}

export function toAppliedTags(selectedTags: readonly string[]): string[] | undefined {
  return selectedTags.length > 0 ? [...selectedTags] : undefined;
}

export function initializeSelection(appliedTags: readonly string[] | undefined): string[] {
  return appliedTags && appliedTags.length > 0 ? [...appliedTags] : [];
}
