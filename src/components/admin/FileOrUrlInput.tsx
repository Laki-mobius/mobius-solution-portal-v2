import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { uploadPortalFile } from "@/lib/storage";
import { toast } from "sonner";

interface Props {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  prefix?: string;
  placeholder?: string;
}

export const FileOrUrlInput = ({ value, onChange, accept, prefix, placeholder }: Props) => {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPortalFile(file, prefix);
      onChange(url);
      toast.success("File uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "https://… or upload a file"}
      />
      <div className="flex items-center gap-2">
        <label className="cursor-pointer">
          <input type="file" accept={accept} className="hidden" onChange={handleFile} />
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary">
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Upload file
          </span>
        </label>
        {value && (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground underline"
          >
            preview
          </a>
        )}
      </div>
    </div>
  );
};
