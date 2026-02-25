import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useTagFilterState } from "../../hooks/useTagFilterState";

describe("useTagFilterState", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("restores applied tags from storage", async () => {
    window.localStorage.setItem("study_applied_tags", JSON.stringify(["travel", "work"]));

    const { result } = renderHook(() => useTagFilterState("study"));

    await waitFor(() => {
      expect(result.current.appliedTags).toEqual(["travel", "work"]);
      expect(result.current.selectedTags).toEqual(["travel", "work"]);
    });
  });

  it("applies toggled tags and persists them", async () => {
    const { result } = renderHook(() => useTagFilterState("examples"));

    await waitFor(() => {
      expect(result.current.appliedTags).toBeUndefined();
    });

    act(() => {
      result.current.handleToggleTagSelection("exam");
    });
    act(() => {
      result.current.handleToggleTagSelection("review");
    });
    act(() => {
      result.current.applyFilter();
    });

    await waitFor(() => {
      expect(result.current.appliedTags).toEqual(["exam", "review"]);
    });

    expect(window.localStorage.getItem("examples_applied_tags")).toBe(
      JSON.stringify(["exam", "review"]),
    );
  });

  it("clears filter and removes storage key", async () => {
    window.localStorage.setItem("examples_applied_tags", JSON.stringify(["exam"]));

    const { result } = renderHook(() => useTagFilterState("examples"));

    await waitFor(() => {
      expect(result.current.appliedTags).toEqual(["exam"]);
    });

    act(() => {
      result.current.clearFilter();
    });

    await waitFor(() => {
      expect(result.current.appliedTags).toBeUndefined();
    });

    expect(window.localStorage.getItem("examples_applied_tags")).toBeNull();
  });
});
