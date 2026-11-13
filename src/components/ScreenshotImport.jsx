import { useRef, useState } from "react";
import { localStore } from "@/api/localStore";
import { extractFromScreenshot } from "@/lib/ocr-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Image } from "@/components/ui/image";
import { ImagePlus, Loader2, Upload } from "lucide-react";

export default function ScreenshotImport({ open, onOpenChange, kind = "interview", onExtracted }) {
  const inputRef = useRef(null);
  const [stage, setStage] = useState("idle");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

  const reset = () => {
    setStage("idle");
    setError("");
    setPreview("");
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a PNG or JPG screenshot.");
      return;
    }
    setError("");
    setPreview(URL.createObjectURL(file));
    setStage("reading");
    try {
      const uploaded = await localStore.integrations.Core.UploadPrivateFile({ file });
      const { fields } = await extractFromScreenshot({
        data: { file_uri: uploaded.file_uri, kind },
      });
      onExtracted(fields || {});
      setStage("idle");
      onOpenChange(false);
      reset();
    } catch (err) {
      setStage("idle");
      setError(
        err?.message?.includes("Unauthorized")
          ? "Your session expired. Please sign in again."
          : "We couldn't read that screenshot. You can type the details in instead.",
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="display-title text-xl">Read a screenshot</DialogTitle>
        </DialogHeader>

        <p className="text-[0.8rem] leading-relaxed text-muted-foreground">
          Upload the email, invite, or offer. We'll pull out the company, position, location and
          interview time so you can review them before saving.
        </p>

        {stage === "reading" ? (
          <div className="space-y-3 rounded-xl border border-border bg-secondary/40 p-4">
            <div className="flex items-center gap-2 text-[0.78rem] font-medium text-primary">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Reading your screenshot…
            </div>
            {preview ? (
              <Image
                src={preview}
                alt="Uploaded screenshot"
                className="h-32 w-full rounded-lg opacity-70"
              />
            ) : null}
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-secondary/30 px-6 py-9 text-center transition-colors hover:border-primary/60 hover:bg-secondary/60"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
              <ImagePlus className="h-5 w-5" />
            </span>
            <span className="text-[0.85rem] font-medium">Choose a screenshot</span>
            <span className="text-[0.72rem] text-muted-foreground">PNG or JPG · stored privately</span>
          </button>
        )}

        {error ? <p className="text-[0.78rem] font-medium text-destructive">{error}</p> : null}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />

        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="h-9 rounded-full px-4 text-[0.8rem]" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="h-9 rounded-full px-4 text-[0.8rem]"
            onClick={() => inputRef.current?.click()}
            disabled={stage === "reading"}
          >
            <Upload className="h-3.5 w-3.5" />
            Select file
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}