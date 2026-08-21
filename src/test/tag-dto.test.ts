import { describe, expect, it } from "vitest";

import type { AssignTagResult, CreateTagResult, RemoveTagResult, TagDto } from "@/types/tag";

describe("tag DTO contracts", () => {
  it("keeps tag and action results plain and serializable", () => {
    const tag = { id: "tag-1", name: "Housing" } satisfies TagDto;
    const created: CreateTagResult = { success: true, data: tag };
    const assigned: AssignTagResult = { success: true, data: [tag] };
    const removed: RemoveTagResult = { success: true, data: [] };

    expect(JSON.stringify({ created, assigned, removed })).toBe(
      JSON.stringify({
        created: { success: true, data: { id: "tag-1", name: "Housing" } },
        assigned: { success: true, data: [{ id: "tag-1", name: "Housing" }] },
        removed: { success: true, data: [] },
      }),
    );
  });
});
