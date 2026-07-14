import { setupTests } from "@test-utils/setup.spec";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { storeMap } = vi.hoisted(() => {
  const storeMap = new Map<string, string>();
  const mockStorage = {
    getItem: (key: string) => storeMap.get(key) ?? null,
    setItem: (key: string, value: string) => storeMap.set(key, value),
    removeItem: (key: string) => storeMap.delete(key),
    clear: () => storeMap.clear(),
    get length() {
      return storeMap.size;
    },
    key: (index: number) => [...storeMap.keys()][index] ?? null,
  };
  vi.stubGlobal("localStorage", mockStorage);
  return { storeMap };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@components/ui/button", () => ({
  Button: ({ children, onClick, disabled, variant }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  ),
}));

vi.mock("@components/ui/field", () => ({
  Field: ({ children }: any) => <div>{children}</div>,
  FieldLabel: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
}));

vi.mock("@components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock("@config", () => ({
  FEATURE_SUBSCRIPTIONS: true,
}));

vi.mock("@components/ui/switch", () => ({
  Switch: ({ checked, onCheckedChange }: any) => (
    <button role="switch" aria-checked={checked} onClick={() => onCheckedChange?.(!checked)} />
  ),
}));

vi.mock("@lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

import { AiKeyForm } from "@components/ai-key-form";
import { useAiProviderStore } from "@stores/ai-provider-store";
import { toast } from "sonner";

setupTests();

function renderForm(props: Partial<React.ComponentProps<typeof AiKeyForm>> = {}) {
  return render(<AiKeyForm {...props} />);
}

describe("AiKeyForm", () => {
  beforeEach(() => {
    storeMap.clear();
    useAiProviderStore.setState({ apiKey: "" });
    vi.clearAllMocks();
  });

  it("renders the form with default label", () => {
    renderForm();
    expect(screen.getByText("API Key")).toBeDefined();
  });

  it("input type is password", () => {
    renderForm();
    const input = screen.getByLabelText("API Key");
    expect(input.getAttribute("type")).toBe("password");
  });

  it("input shows the current apiKey from the store", () => {
    useAiProviderStore.getState().setApiKey("sk-existing");
    renderForm();
    const input = screen.getByLabelText("API Key") as HTMLInputElement;
    expect(input.value).toBe("sk-existing");
  });

  it("Save button is disabled when input is empty", () => {
    renderForm();
    const saveButton = screen.getByText("Save");
    expect((saveButton as HTMLButtonElement).disabled).toBe(true);
  });

  it("Clear button is disabled when no key is stored", () => {
    renderForm();
    const clearButton = screen.getByText("Clear");
    expect((clearButton as HTMLButtonElement).disabled).toBe(true);
  });

  it("Save persists the key and shows a success toast", () => {
    renderForm();
    const input = screen.getByLabelText("API Key");
    fireEvent.change(input, { target: { value: "sk-new-key" } });

    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    expect(useAiProviderStore.getState().apiKey).toBe("sk-new-key");
    expect(toast.success).toHaveBeenCalledWith("API key saved");
  });

  it("Save calls onSaved callback with the key", () => {
    const onSaved = vi.fn();
    renderForm({ onSaved });
    const input = screen.getByLabelText("API Key");
    fireEvent.change(input, { target: { value: "sk-on-saved" } });
    fireEvent.click(screen.getByText("Save"));
    expect(onSaved).toHaveBeenCalledWith("sk-on-saved");
  });

  it("Clear removes the key and resets the input", () => {
    useAiProviderStore.getState().setApiKey("sk-to-clear");
    renderForm();

    const clearButton = screen.getByText("Clear");
    fireEvent.click(clearButton);

    expect(useAiProviderStore.getState().apiKey).toBe("");
    const input = screen.getByLabelText("API Key") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("shows Cancel button when onCancel is provided", () => {
    renderForm({ onCancel: vi.fn() });
    expect(screen.getByText("Cancel")).toBeDefined();
  });

  it("hides Cancel button when onCancel is not provided", () => {
    renderForm();
    expect(screen.queryByText("Cancel")).toBeNull();
  });

  it("Cancel calls onCancel", () => {
    const onCancel = vi.fn();
    renderForm({ onCancel });
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("shows platform key toggle when hasAiSub and apiKey are set", () => {
    useAiProviderStore.getState().setApiKey("sk-test");
    renderForm({ hasAiSub: true });
    expect(screen.getByText("Use my own API key")).toBeDefined();
  });

  it("hides platform key toggle when hasAiSub is not passed", () => {
    useAiProviderStore.getState().setApiKey("sk-test");
    renderForm();
    expect(screen.queryByText("Use my own API key")).toBeNull();
  });
});
