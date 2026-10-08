// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AiMarkdown } from "./AiMarkdown.js";

afterEach(cleanup);

describe("AiMarkdown", () => {
  it("renders the server's markdown structure with headings nested under the drawer title", () => {
    const { container } = render(
      <AiMarkdown>{"## Overall Summary\n\nTwo **Libra Suns**.\n\n- one\n- two\n\n1. first\n\n> quoted\n\n### Detail"}</AiMarkdown>,
    );
    expect(screen.getByRole("heading", { level: 3, name: "Overall Summary" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 4, name: "Detail" })).toBeTruthy();
    expect(container.querySelector("strong")?.textContent).toBe("Libra Suns");
    expect(container.querySelectorAll("ul > li")).toHaveLength(2);
    expect(container.querySelectorAll("ol > li")).toHaveLength(1);
    expect(container.querySelector("blockquote")?.textContent?.trim()).toBe("quoted");
  });

  it("unwraps links, images, code, and raw HTML to inert text", () => {
    const { container } = render(
      <AiMarkdown>{"See [this](https://evil.example) ![x](https://evil.example/x.png) `code` <img src=x onerror=alert(1)>\n\n```\nblock\n```"}</AiMarkdown>,
    );
    expect(container.querySelector("a, img, code, pre, script")).toBeNull();
    expect(container.textContent).toContain("this");
  });
});
