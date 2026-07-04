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

vi.mock("@components/ui/dialog", () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
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

import { AiKeyDialog } from "@components/ai-key-dialog";
import { useAiProviderStore } from "@stores/ai-provider-store";
import { toast } from "sonner";

setupTests();

function renderDialog() {
  const onOpenChange = vi.fn();
  const result = render(<AiKeyDialog onOpenChange={onOpenChange} />);
  return { onOpenChange, ...result };
}

describe("AiKeyDialog", () => {
  beforeEach(() => {
    storeMap.clear();
    useAiProviderStore.setState({ apiKey: "" });
    vi.clearAllMocks();
  });

  it("renders the dialog", () => {
    renderDialog();
    expect(screen.getByText("OpenAI API Key")).toBeDefined();
    expect(screen.getByText(/Enter your OpenAI API key/)).toBeDefined();
  });

  it("input type is password", () => {
    renderDialog();
    const input = screen.getByLabelText("API Key");
    expect(input.getAttribute("type")).toBe("password");
  });

  it("input shows the current apiKey from the store", () => {
    useAiProviderStore.getState().setApiKey("sk-existing");
    renderDialog();
    const input = screen.getByLabelText("API Key") as HTMLInputElement;
    expect(input.value).toBe("sk-existing");
  });

  it("Save button is disabled when input is empty", () => {
    renderDialog();
    const saveButton = screen.getByText("Save");
    expect((saveButton as HTMLButtonElement).disabled).toBe(true);
  });

  it("Clear button is disabled when no key is stored", () => {
    renderDialog();
    const clearButton = screen.getByText("Clear");
    expect((clearButton as HTMLButtonElement).disabled).toBe(true);
  });

  it("Save persists the key and shows a success toast", () => {
    const { onOpenChange } = renderDialog();
    const input = screen.getByLabelText("API Key");
    fireEvent.change(input, { target: { value: "sk-new-key" } });

    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    expect(useAiProviderStore.getState().apiKey).toBe("sk-new-key");
    expect(toast.success).toHaveBeenCalledWith("API key saved");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("Clear removes the key and shows a success toast", () => {
    useAiProviderStore.getState().setApiKey("sk-to-clear");
    const { onOpenChange } = renderDialog();

    const clearButton = screen.getByText("Clear");
    fireEvent.click(clearButton);

    expect(useAiProviderStore.getState().apiKey).toBe("");
    expect(toast.success).toHaveBeenCalledWith("API key removed");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("Cancel closes the dialog without making changes", () => {
    useAiProviderStore.getState().setApiKey("sk-original");
    const { onOpenChange } = renderDialog();

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(useAiProviderStore.getState().apiKey).toBe("sk-original");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
