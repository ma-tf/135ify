import { useFileInput } from "@hooks/use-file-input";
import { render, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";

const createFile = (name = "test.txt", content = "x") =>
  new File([content], name, { type: "text/plain" });

const changeEvent = (files: File[] | null) =>
  ({ target: { files } }) as unknown as React.ChangeEvent<HTMLInputElement>;

describe("useFileInput", () => {
  it("returns openFileDialog, getInputProps, and handleFileChange as functions", () => {
    const { result } = renderHook(() => useFileInput({ onFiles: vi.fn() }));

    expect(typeof result.current.openFileDialog).toBe("function");
    expect(typeof result.current.getInputProps).toBe("function");
    expect(typeof result.current.handleFileChange).toBe("function");
  });

  describe("handleFileChange", () => {
    it("calls onFiles with File array when files exist", () => {
      const onFiles = vi.fn();
      const { result } = renderHook(() => useFileInput({ onFiles }));

      const file1 = createFile("a.txt");
      const file2 = createFile("b.csv", "data");
      result.current.handleFileChange(changeEvent([file1, file2]));

      expect(onFiles).toHaveBeenCalledOnce();
      expect(onFiles).toHaveBeenCalledWith([file1, file2]);
    });

    it("does not call onFiles when files is null", () => {
      const onFiles = vi.fn();
      const { result } = renderHook(() => useFileInput({ onFiles }));

      result.current.handleFileChange(changeEvent(null));

      expect(onFiles).not.toHaveBeenCalled();
    });

    it("does not call onFiles when FileList is empty", () => {
      const onFiles = vi.fn();
      const { result } = renderHook(() => useFileInput({ onFiles }));

      result.current.handleFileChange(changeEvent([]));

      expect(onFiles).not.toHaveBeenCalled();
    });

    it("resets input value after processing files", () => {
      const onFiles = vi.fn();
      const { result } = renderHook(() => useFileInput({ onFiles }));

      const inputProps = result.current.getInputProps();
      const { container } = render(<input {...inputProps} />);
      const input = container.querySelector("input")!;

      Object.defineProperty(input, "value", {
        value: "C:\\fake\\path\\file.txt",
        writable: true,
      });
      result.current.handleFileChange(changeEvent([createFile()]));

      expect(input.value).toBe("");
    });

    it("does not throw when inputRef is null", () => {
      const { result } = renderHook(() => useFileInput({ onFiles: vi.fn() }));

      expect(() => {
        result.current.handleFileChange(changeEvent([createFile()]));
      }).not.toThrow();
    });
  });

  describe("openFileDialog", () => {
    it("triggers click on hidden input", () => {
      const { result } = renderHook(() => useFileInput({ onFiles: vi.fn() }));

      const inputProps = result.current.getInputProps();
      const { container } = render(<input {...inputProps} />);
      const input = container.querySelector("input")!;
      const clickSpy = vi.spyOn(input, "click");

      result.current.openFileDialog();

      expect(clickSpy).toHaveBeenCalledOnce();
    });

    it("does not throw when inputRef is null", () => {
      const { result } = renderHook(() => useFileInput({ onFiles: vi.fn() }));

      expect(() => {
        result.current.openFileDialog();
      }).not.toThrow();
    });
  });

  describe("getInputProps", () => {
    it("returns type file and default accept/multiple", () => {
      const { result } = renderHook(() => useFileInput({ onFiles: vi.fn() }));

      const props = result.current.getInputProps();

      expect(props.type).toBe("file");
      expect(props.accept).toBe("*");
      expect(props.multiple).toBe(true);
    });

    it("uses custom accept from caller props", () => {
      const { result } = renderHook(() => useFileInput({ accept: ".png", onFiles: vi.fn() }));

      const props = result.current.getInputProps({ accept: ".csv" });

      expect(props.accept).toBe(".csv");
    });

    it("falls back to option accept when caller props omit it", () => {
      const { result } = renderHook(() => useFileInput({ accept: ".png", onFiles: vi.fn() }));

      const props = result.current.getInputProps();

      expect(props.accept).toBe(".png");
    });

    it("uses custom multiple from caller props", () => {
      const { result } = renderHook(() => useFileInput({ multiple: false, onFiles: vi.fn() }));

      const props = result.current.getInputProps({ multiple: true });

      expect(props.multiple).toBe(true);
    });

    it("falls back to option multiple when caller props omit it", () => {
      const { result } = renderHook(() => useFileInput({ multiple: false, onFiles: vi.fn() }));

      const props = result.current.getInputProps();

      expect(props.multiple).toBe(false);
    });

    it("merges additional caller props without overwriting internals", () => {
      const { result } = renderHook(() => useFileInput({ onFiles: vi.fn() }));

      const props = result.current.getInputProps({
        className: "hidden-input",
        id: "file-upload",
      });

      expect(props.className).toBe("hidden-input");
      expect(props.id).toBe("file-upload");
      expect(props.type).toBe("file");
      expect(typeof props.onChange).toBe("function");
    });
  });

  describe("defaults", () => {
    it("accept defaults to * when not provided", () => {
      const { result } = renderHook(() => useFileInput({ onFiles: vi.fn() }));

      expect(result.current.getInputProps().accept).toBe("*");
    });

    it("multiple defaults to true when not provided", () => {
      const { result } = renderHook(() => useFileInput({ onFiles: vi.fn() }));

      expect(result.current.getInputProps().multiple).toBe(true);
    });
  });
});
