import {
  render,
  screen,
  fireEvent,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";

import App from "../App";
import { describe, it, expect, beforeEach, vi } from "vitest";
// TODO: improve tests - use findByText instead of getByText with waitFor and improve mocks

describe("Storage Master App", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("renders and shows empty state", () => {
    render(<App />);
    screen.getByText(/No items in localStorage/i);
  });

  it("can add a new item", async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Add/i));
    fireEvent.change(screen.getByPlaceholderText("Key"), {
      target: { value: "foo" },
    });
    fireEvent.change(screen.getByPlaceholderText("Value"), {
      target: { value: "bar" },
    });
    fireEvent.click(screen.getByText(/^Save$/i));
    await screen.findByText("foo");
    await screen.findByText("bar");
  });

  it("can edit an item", async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Add/i));
    fireEvent.change(screen.getByPlaceholderText("Key"), {
      target: { value: "foo" },
    });
    fireEvent.change(screen.getByPlaceholderText("Value"), {
      target: { value: "bar" },
    });
    fireEvent.click(screen.getByText(/^Save$/i));
    await screen.findByText("foo");

    fireEvent.click(screen.getByText(/Edit/i));

    fireEvent.change(screen.getByDisplayValue("bar"), {
      target: { value: "baz" },
    });
    fireEvent.click(screen.getByText(/^Save$/i));
    await screen.findByText("baz");
  });

  it("can delete an item", async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Add/i));
    fireEvent.change(screen.getByPlaceholderText("Key"), {
      target: { value: "foo" },
    });
    fireEvent.change(screen.getByPlaceholderText("Value"), {
      target: { value: "bar" },
    });
    fireEvent.click(screen.getByText(/^Save$/i));

    await screen.findByText("foo");
    fireEvent.click(screen.getByText(/Delete/i));

    await waitForElementToBeRemoved(() => screen.getByText("foo"));
  });

  it("shows error for duplicate key", () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Add/i));
    fireEvent.change(screen.getByPlaceholderText("Key"), {
      target: { value: "foo" },
    });
    fireEvent.change(screen.getByPlaceholderText("Value"), {
      target: { value: "bar" },
    });
    fireEvent.click(screen.getByText(/^Save$/i));
    fireEvent.click(screen.getByText(/Add/i));
    fireEvent.change(screen.getByPlaceholderText("Key"), {
      target: { value: "foo" },
    });
    fireEvent.click(screen.getByText(/^Save$/i));
    waitFor(() => screen.getByText(/Key already exists/i));
  });

  it("can switch between localStorage and sessionStorage tabs", async () => {
    render(<App />);
    // Add item to localStorage
    fireEvent.click(screen.getByText(/Add/i));
    fireEvent.change(screen.getByPlaceholderText("Key"), {
      target: { value: "foo" },
    });
    fireEvent.change(screen.getByPlaceholderText("Value"), {
      target: { value: "bar" },
    });
    fireEvent.click(screen.getByText(/^Save$/i));
    await screen.findByText("foo");
    // Switch to sessionStorage
    fireEvent.click(screen.getByText(/sessionStorage/i));
    await screen.findByText(/No items in sessionStorage/i);
    // Switch back
    fireEvent.click(screen.getByText(/localStorage/i));
    await screen.findByText("foo");
  });

  it("filters items by search", async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Add/i));
    fireEvent.change(screen.getByPlaceholderText("Key"), {
      target: { value: "alpha" },
    });
    fireEvent.change(screen.getByPlaceholderText("Value"), {
      target: { value: "one" },
    });
    fireEvent.click(screen.getByText(/^Save$/i));
    fireEvent.click(screen.getByText(/Add/i));
    fireEvent.change(screen.getByPlaceholderText("Key"), {
      target: { value: "beta" },
    });
    fireEvent.change(screen.getByPlaceholderText("Value"), {
      target: { value: "two" },
    });
    fireEvent.click(screen.getByText(/^Save$/i));
    await screen.findByText("alpha");
    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "beta" },
    });
    screen.getByText("beta");
    expect(screen.queryByText("alpha")).toBeNull();
  });

  it("clears storage when Clear storage is clicked", async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Add/i));
    fireEvent.change(screen.getByPlaceholderText("Key"), {
      target: { value: "foo" },
    });
    fireEvent.change(screen.getByPlaceholderText("Value"), {
      target: { value: "bar" },
    });
    fireEvent.click(screen.getByText(/^Save$/i));
    await screen.findByText("foo");
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByText(/Clear storage/i));
    await screen.findByText(/No items in localStorage/i);
    confirmSpy.mockRestore();
  });

  it("shows error on invalid JSON import", async () => {
    const { container } = render(<App />);
    const file = new File(["not json"], "bad.json", {
      type: "application/json",
    });
    const input = container.querySelector('input[type="file"]');
    // Mock alert
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    fireEvent.change(input!, { target: { files: [file] } });
    await waitFor(() =>
      alertSpy.mock.calls.some((call) => call[0] === "Invalid JSON file")
    );
    alertSpy.mockRestore();
  });

  it("imports valid JSON and displays items", async () => {
    const { container } = render(<App />);
    // Prepare valid JSON file
    const data = { foo: "bar", baz: "qux" };
    const file = new File([JSON.stringify(data)], "good.json", {
      type: "application/json",
    });
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input!, { target: { files: [file] } });
    // Wait for items to appear
    await screen.findByText("foo");
    await screen.findByText("bar");
    await screen.findByText("baz");
    await screen.findByText("qux");
  });

  it("import overwrites existing items", async () => {
    const { container } = render(<App />);
    // Add an item
    fireEvent.click(screen.getByText(/Add/i));
    fireEvent.change(screen.getByPlaceholderText("Key"), {
      target: { value: "foo" },
    });
    fireEvent.change(screen.getByPlaceholderText("Value"), {
      target: { value: "old" },
    });
    fireEvent.click(screen.getByText(/^Save$/i));
    await screen.findByText("foo");
    // Import JSON with same key but new value
    const data = { foo: "new" };
    const file = new File([JSON.stringify(data)], "overwrite.json", {
      type: "application/json",
    });
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input!, { target: { files: [file] } });
    // Wait for new value
    await screen.findByText("new");
    expect(screen.queryByText("old")).toBeNull();
  });

  it("triggers export (smoke test)", async () => {
    render(<App />);
    // Polyfill URL.createObjectURL if not present
    if (!("createObjectURL" in URL)) {
      // @ts-expect-error: Polyfilling createObjectURL for test environment
      URL.createObjectURL = vi.fn(() => "blob:url");
    }
    if (!("revokeObjectURL" in URL)) {
      // @ts-expect-error: Polyfilling revokeObjectURL for test environment
      URL.revokeObjectURL = vi.fn();
    }
    const urlSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:url");
    const revokeSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const createElemSpy = vi.spyOn(document, "createElement");
    fireEvent.click(screen.getByText(/Export/i));
    await waitFor(() => expect(urlSpy).toHaveBeenCalled());
    urlSpy.mockRestore();
    revokeSpy.mockRestore();
    createElemSpy.mockRestore();
  });

  it("can expand and collapse long JSON values", async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Add/i));
    fireEvent.change(screen.getByPlaceholderText("Key"), {
      target: { value: "json" },
    });
    const longJson = JSON.stringify({ a: Array(20).fill(1) });
    fireEvent.change(screen.getByPlaceholderText("Value"), {
      target: { value: longJson },
    });
    fireEvent.click(screen.getByText(/^Save$/i));
    await screen.findByText("json");
    // Should show 'Expand JSON' button
    screen.getByText(/Expand JSON/i);
    fireEvent.click(screen.getByText(/Expand JSON/i));
    screen.getByText(/Collapse JSON/i);
  });

  it("can cancel add and edit forms", async () => {
    render(<App />);
    // Add form cancel
    fireEvent.click(screen.getByText(/Add/i));
    fireEvent.click(screen.getByText(/Cancel/i));
    expect(screen.queryByPlaceholderText("Key")).toBeNull();
    // Edit form cancel
    fireEvent.click(screen.getByText(/Add/i));
    fireEvent.change(screen.getByPlaceholderText("Key"), {
      target: { value: "foo" },
    });
    fireEvent.click(screen.getByText(/^Save$/i));
    await screen.findByText("foo");
    fireEvent.click(screen.getByText(/Edit/i));
    fireEvent.click(screen.getByText(/Cancel/i));
    expect(screen.queryByDisplayValue("foo")).toBeNull();
  });

  it("shows error for invalid JSON in edit", async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Add/i));
    fireEvent.change(screen.getByPlaceholderText("Key"), {
      target: { value: "foo" },
    });
    fireEvent.change(screen.getByPlaceholderText("Value"), {
      target: { value: '{"a":1}' },
    });
    fireEvent.click(screen.getByText(/^Save$/i));
    await screen.findByText("foo");
    fireEvent.click(screen.getByText(/Edit/i));
    // Break the JSON
    const input = await screen.findByDisplayValue((value) =>
      value.includes('"a": 1')
    );

    fireEvent.change(input, {
      target: { value: "{" },
    });
    fireEvent.click(screen.getByText(/^Save$/i));
    await screen.findByText(/Invalid JSON/i);
  });
});
