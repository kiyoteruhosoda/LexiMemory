import { describe, it, expect, beforeEach, vi } from "vitest";
import { TagFilterStorageService } from "../../core/tagFilter/tagFilterStorageService";

describe("TagFilterStorageService", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("saves and restores tags", async () => {
    const service = new TagFilterStorageService("study");
    await service.save(["tag-a", "tag-b"]);

    await expect(service.restore()).resolves.toEqual(["tag-a", "tag-b"]);
  });

  it("removes key when tags are undefined", async () => {
    const service = new TagFilterStorageService("examples");
    window.localStorage.setItem("examples_applied_tags", JSON.stringify(["x"]));

    await service.save(undefined);

    expect(window.localStorage.getItem("examples_applied_tags")).toBeNull();
  });
});
