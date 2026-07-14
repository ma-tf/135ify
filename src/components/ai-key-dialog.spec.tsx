import { setupTests } from "@test-utils/setup.spec";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("@components/ai-key-form", () => ({
  AiKeyForm: ({ onCancel, onSaved, hasAiSub }: any) => (
    <div data-testid="ai-key-form">
      <span>API Key</span>
      <button onClick={() => onSaved?.("sk-from-dialog")}>Save</button>
      {onCancel && <button onClick={onCancel}>Cancel</button>}
      {hasAiSub && <span data-testid="has-ai-sub" />}
    </div>
  ),
}));

import { AiKeyDialog } from "@components/ai-key-dialog";

setupTests();

function renderDialog() {
  const onOpenChange = vi.fn();
  const result = render(<AiKeyDialog onOpenChange={onOpenChange} />);
  return { onOpenChange, ...result };
}

describe("AiKeyDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dialog", () => {
    renderDialog();
    expect(screen.getByText("OpenAI API Key")).toBeDefined();
    expect(screen.getByText(/Enter your OpenAI API key/)).toBeDefined();
  });

  it("renders AiKeyForm with inputLabel 'API Key'", () => {
    renderDialog();
    expect(screen.getByText("API Key")).toBeDefined();
  });

  it("Cancel closes the dialog", () => {
    const { onOpenChange } = renderDialog();
    fireEvent.click(screen.getByText("Cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("onSave is called when form is saved", () => {
    const onSave = vi.fn();
    render(<AiKeyDialog onOpenChange={vi.fn()} onSave={onSave} />);
    fireEvent.click(screen.getByText("Save"));
    expect(onSave).toHaveBeenCalledWith("sk-from-dialog");
  });

  it("closes the dialog when form is saved", () => {
    const onOpenChange = vi.fn();
    render(<AiKeyDialog onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByText("Save"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("passes hasAiSub to AiKeyForm", () => {
    render(<AiKeyDialog onOpenChange={vi.fn()} hasAiSub={true} />);
    expect(screen.getByTestId("has-ai-sub")).toBeDefined();
  });

  it("does not pass hasAiSub when not provided", () => {
    render(<AiKeyDialog onOpenChange={vi.fn()} />);
    expect(screen.queryByTestId("has-ai-sub")).toBeNull();
  });
});
