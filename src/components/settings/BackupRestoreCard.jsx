import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createLocalBackup, downloadLocalBackup, readBackupFile, restoreLocalBackup } from "@/lib/localBackup";
import { toast } from "sonner";
import { Download, Upload, ShieldCheck, LockKeyhole } from "lucide-react";

export default function BackupRestoreCard() {
  const fileRef = useRef(null);
  const [mode, setMode] = useState("merge");
  const [password, setPassword] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [exporting, setExporting] = useState(false);

  const restore = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setRestoring(true);
    try {
      const backup = await readBackupFile(file, password);
      const count = restoreLocalBackup(backup, mode);
      toast.success(`Restored ${count} data collections. Reloading…`);
      window.setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      toast.error(error?.message || "Couldn't restore that backup.");
    } finally {
      setRestoring(false);
      event.target.value = "";
    }
  };

  const exportBackup = async () => {
    if (password.length < 12) {
      toast.error("Choose a backup password with at least 12 characters.");
      return;
    }
    setExporting(true);
    try {
      await downloadLocalBackup(password);
      toast.success("Encrypted backup exported.");
    } catch (error) {
      toast.error(error?.message || "Couldn't create the backup.");
    } finally {
      setExporting(false);
    }
  };

  const recordCount = Object.values(createLocalBackup().collections).reduce(
    (total, items) => total + (Array.isArray(items) ? items.length : 0),
    0,
  );

  return (
    <section className="paper-panel space-y-4 p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-[0.95rem] font-semibold tracking-tight">Local data & encrypted backups</h2>
          <p className="mt-1 text-[0.75rem] leading-relaxed text-muted-foreground">
            Your records remain on this device and work offline. Backups are encrypted before they leave the app; cloud storage is not required.
          </p>
        </div>
      </div>
      <p className="text-[0.75rem] text-muted-foreground">{recordCount} saved records across your local collections.</p>
      <div className="space-y-1.5">
        <Label htmlFor="backup-password" className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Backup password
        </Label>
        <Input
          id="backup-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 12 characters"
        />
        <p className="text-[0.68rem] text-muted-foreground">
          This password encrypts and decrypts the backup using AES-256-GCM. It is never saved by the app. If you lose it, the backup cannot be recovered.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button className="h-9 gap-2 rounded-full px-4 text-[0.8rem]" onClick={exportBackup} disabled={exporting || restoring}>
          <LockKeyhole className="h-3.5 w-3.5" /> {exporting ? "Encrypting…" : "Export encrypted backup"}
        </Button>
        <Button variant="outline" className="h-9 gap-2 rounded-full px-4 text-[0.8rem]" onClick={() => fileRef.current?.click()} disabled={restoring || exporting}>
          <Upload className="h-3.5 w-3.5" /> {restoring ? "Restoring…" : "Restore backup"}
        </Button>
      </div>
      <div className="max-w-sm space-y-1.5">
        <Label className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Restore behavior</Label>
        <Select value={mode} onValueChange={setMode}>
          <SelectTrigger className="h-9 text-[0.8rem]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="merge">Merge with current records</SelectItem>
            <SelectItem value="replace">Replace matching collections</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={restore} />
      <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
        Older unencrypted LoneStar backup files can still be restored. New backups are encrypted. Store the backup file and its password separately in a secure place.
      </p>
    </section>
  );
}
