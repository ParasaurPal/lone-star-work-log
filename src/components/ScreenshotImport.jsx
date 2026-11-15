import { useState } from "react";
import { extractFromScreenshot } from "@/lib/ocr-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";

export default function ScreenshotImport({ open, onOpenChange, kind = "interview", onExtracted }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const close = (next) => {
    if (!next) {
      setText("");
      setError("");
    }
    onOpenChange(next);
  };

  const importText = async () => {
    setError("");
    try {
      const { fields } = await extractFromScreenshot({ data: { text, kind } });
      onExtracted(fields || {});
      close(false);
    } catch (err) {
      setError(err?.message || "Paste the text copied from your screenshot.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="display-title text-xl">Import screenshot text</DialogTitle>
        </DialogHeader>
        <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-3">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-[0.78rem] leading-relaxed text-muted-foreground">
            Offline text extraction is supported; automatic image OCR is not installed in this build. Open the screenshot in Google Photos or Lens, copy its text, then paste it below. Recognized labeled fields will be prefilled for you to review.
          </p>
        </div>
        <Textarea
          rows={8}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={"Company: Example Company\nPosition: Office Assistant\nLocation: Dallas, TX\nInterview date: November 20, 2026"}
          autoFocus
        />
        {error ? <p className="text-[0.78rem] font-medium text-destructive">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="h-9 rounded-full px-4 text-[0.8rem]" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button className="h-9 rounded-full px-4 text-[0.8rem]" onClick={importText} disabled={!text.trim()}>
            Prefill details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
