import { describe, expect, it } from "vitest";
import {
  initializeSelection,
  toAppliedTags,
  toggleTagSelection,
} from "../../core/tagFilter/tagFilterSelectionPolicy";

describe("tagFilterSelectionPolicy", () => {
  it("adds a new tag when not selected", () => {
    expect(toggleTagSelection(["travel"], "work")).toEqual(["travel", "work"]);
  });

  it("removes a tag when already selected", () => {
    expect(toggleTagSelection(["travel", "work"], "travel")).toEqual(["work"]);
  });

  it("returns undefined when selection is empty", () => {
    expect(toAppliedTags([])).toBeUndefined();
  });

  it("returns copied selection for applied tags", () => {
    const selected = ["travel", "work"];
    const applied = toAppliedTags(selected);
    expect(applied).toEqual(selected);
    expect(applied).not.toBe(selected);
  });

  it("initializes selected tags from applied tags", () => {
    expect(initializeSelection(["exam"]))
      .toEqual(["exam"]);
    expect(initializeSelection(undefined)).toEqual([]);
  });
});
