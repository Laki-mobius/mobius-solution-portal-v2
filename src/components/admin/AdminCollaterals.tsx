import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Collateral, Solution } from "@/hooks/useContent";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { FileOrUrlInput } from "./FileOrUrlInput";

type Form = {
  id?: string;
  title: string;
  type: "video" | "deck" | "document";
  file_url: string;
  linked_solution_id: string | null;
};

const empty: Form = {
  title: "",
  type: "deck",
  file_url: "",
  linked_solution_id: null,
};

export const AdminCollaterals = () => {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "collaterals"],
    queryFn: () => api<Collateral[]>("/api/collaterals"),
  });
  const { data: solutions = [] } = useQuery({
    queryKey: ["admin", "solutions-min"],
    queryFn: () => api<Pick<Solution, "id" | "title">[]>("/api/solutions"),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  useEffect(() => {
    if (!open) setForm(empty);
  }, [open]);

  const save = async () => {
    if (!form.title.trim() || !form.file_url.trim()) {
      toast.error("Title and file URL are required");
      return;
    }
    const payload = {
      title: form.title.trim(),
      type: form.type,
      file_url: form.file_url.trim(),
      linked_solution_id: form.linked_solution_id || null,
    };
    try {
      if (form.id) {
        await api(`/api/collaterals/${form.id}`, { method: "PUT", body: payload });
      } else {
        await api("/api/collaterals", { method: "POST", body: payload });
      }
      toast.success(form.id ? "Updated" : "Created");
      qc.invalidateQueries({ queryKey: ["admin", "collaterals"] });
      qc.invalidateQueries({ queryKey: ["collaterals"] });
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const move = async (id: string, direction: "up" | "down") => {
    try {
      await api(`/api/collaterals/${id}/move`, { method: "POST", body: { direction } });
      qc.invalidateQueries({ queryKey: ["admin", "collaterals"] });
      qc.invalidateQueries({ queryKey: ["collaterals"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reorder failed");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this collateral?")) return;
    try {
      await api(`/api/collaterals/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "collaterals"] });
      qc.invalidateQueries({ queryKey: ["collaterals"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const acceptForType: Record<Form["type"], string> = {
    video: "video/*",
    deck: ".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint",
    document: ".pdf,.doc,.docx,application/pdf",
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            setForm(empty);
            setOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add collateral
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Linked solution</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                  No collaterals yet.
                </td>
              </tr>
            ) : (
              data.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-3 font-medium">{c.title}</td>
                  <td className="p-3 capitalize">{c.type}</td>
                  <td className="p-3 text-muted-foreground">
                    {solutions.find((s) => s.id === c.linked_solution_id)?.title ?? "—"}
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => move(c.id, "up")}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => move(c.id, "down")}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setForm({
                          id: c.id,
                          title: c.title,
                          type: c.type,
                          file_url: c.file_url,
                          linked_solution_id: c.linked_solution_id,
                        });
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit collateral" : "New collateral"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as Form["type"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="deck">Deck</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>File</Label>
              <FileOrUrlInput
                value={form.file_url}
                onChange={(url) => setForm({ ...form, file_url: url })}
                accept={acceptForType[form.type]}
                prefix={`${form.type}s`}
              />
            </div>
            <div className="space-y-2">
              <Label>Linked solution (optional)</Label>
              <Select
                value={form.linked_solution_id ?? "none"}
                onValueChange={(v) =>
                  setForm({ ...form, linked_solution_id: v === "none" ? null : v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {solutions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
