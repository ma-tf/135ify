import { CircleAlertIcon } from "lucide-react";

export function DropzoneError({ errors }: { errors: string[] }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-3 text-destructive">
      <CircleAlertIcon className="size-6" />
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold">File upload error(s)</h3>
        {errors.map((error, index) => (
          <p key={index} className="text-xs last:mb-0">
            {error}
          </p>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Click to try again</p>
    </div>
  );
}
