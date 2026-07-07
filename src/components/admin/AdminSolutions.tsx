import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Solution } from "@/hooks/useContent";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, KeyRound, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { FileOrUrlInput } from "./FileOrUrlInput";

type Form = {
  id?: string;
  title: string;
  description: string;
  icon_url: string;
  thumbnail_url: string;
  target_url: string;
  solution_type: "internal" | "external";
  practice: string;
  status: "live" | "upcoming" | "archived";
  upcoming_eta: string;
  default_username: string;
  default_password: string;
  credentials_note: string;
  has_password: boolean;
  clear_password: boolean;
};

const empty: Form = {
  title: "",
  description: "",
  icon_url: "",
  thumbnail_url: "",
  target_url: "",
  solution_type: "internal",
  practice: "",
  status: "live",
  upcoming_eta: "",
  default_username: "",
  default_password: "",
  credentials_note: "",
  has_password: false,
  clear_password: false,
};

type AdminRow = Solution & { default_password_encrypted?: string | null };

export const AdminSolutions = () => {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "solutions"],
    queryFn: () => api<AdminRow[]>("/api/solutions"),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);

  useEffect(() => {
    if (!open) setForm(empty);
  }, [open]);

  const save = async () => {
    if (!form.title.trim() || !form.target_url.trim()) {
      toast.error("Title and target URL are required");
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description ?? "",
      icon_url: form.icon_url || null,
      thumbnail_url: form.thumbnail_url || null,
      target_url: form.target_url.trim(),
      solution_type: form.solution_type,
      practice: form.practice.trim() || null,
      status: form.status,
      upcoming_eta: form.status === "upcoming" && form.upcoming_eta ? form.upcoming_eta : null,
      default_username: form.default_username.trim() || null,
      default_password: form.default_password || null,
      credentials_note: form.credentials_note.trim() || null,
      clear_password: form.clear_password,
    };

    try {
      if (form.id) {
        await api(`/api/solutions/${form.id}`, { method: "PUT", body: payload });
      } else {
        await api("/api/solutions", { method: "POST", body: payload });
      }
      toast.success(form.id ? "Solution updated" : "Solution created");
      qc.invalidateQueries({ queryKey: ["admin", "solutions"] });
      qc.invalidateQueries({ queryKey: ["solutions"] });
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const move = async (id: string, direction: "up" | "down") => {
    try {
      await api(`/api/solutions/${id}/move`, { method: "POST", body: { direction } });
      qc.invalidateQueries({ queryKey: ["admin", "solutions"] });
      qc.invalidateQueries({ queryKey: ["solutions"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reorder failed");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this solution?")) return;
    try {
      await api(`/api/solutions/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "solutions"] });
      qc.invalidateQueries({ queryKey: ["solutions"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const editRow = (s: AdminRow) => {
    setForm({
      id: s.id,
      title: s.title,
      description: s.description ?? "",
      icon_url: s.icon_url ?? "",
      thumbnail_url: s.thumbnail_url ?? "",
      target_url: s.target_url,
      solution_type: s.solution_type,
      practice: s.practice ?? "",
      status: (s.status as Form["status"]) ?? "live",
      upcoming_eta: s.upcoming_eta ?? "",
      default_username: s.default_username ?? "",
      default_password: "",
      credentials_note: s.credentials_note ?? "",
      has_password: !!s.default_password_encrypted || !!s.has_credentials,
      clear_password: false,
    });
    setOpen(true);
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
          <Plus className="mr-1.5 h-4 w-4" /> Add solution
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Creds</th>
              <th className="p-3 text-left">Target</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No solutions yet.
                </td>
              </tr>
            ) : (
              data.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="p-3 font-medium">{s.title}</td>
                  <td className="p-3 capitalize">{s.solution_type}</td>
                  <td className="p-3 capitalize">{s.status}</td>
                  <td className="p-3">
                    {s.has_credentials ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <KeyRound className="h-3 w-3" /> set
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="max-w-xs truncate p-3 text-muted-foreground">{s.target_url}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => move(s.id, "up")}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => move(s.id, "down")}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => editRow(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(s.id)}>
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
            <DialogTitle>{form.id ? "Edit solution" : "New solution"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Practice (optional)</Label>
              <Input
                value={form.practice}
                onChange={(e) => setForm({ ...form, practice: e.target.value })}
                placeholder="e.g. Data Services, Software Services"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.solution_type}
                  onValueChange={(v) =>
                    setForm({ ...form, solution_type: v as "internal" | "external" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as Form["status"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.status === "upcoming" && (
              <div className="space-y-2">
                <Label>Expected date (optional)</Label>
                <Input
                  type="date"
                  value={form.upcoming_eta}
                  onChange={(e) => setForm({ ...form, upcoming_eta: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Target URL</Label>
              <Input
                value={form.target_url}
                onChange={(e) => setForm({ ...form, target_url: e.target.value })}
                placeholder="https://…"
              />
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <KeyRound className="h-4 w-4" /> Default credentials (optional)
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={form.default_username}
                  onChange={(e) => setForm({ ...form, default_username: e.target.value })}
                  placeholder="demo@example.com"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Password{" "}
                  {form.has_password && !form.clear_password && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      •••••• (set — leave blank to keep, or type new to replace)
                    </span>
                  )}
                </Label>
                <Input
                  type="password"
                  value={form.default_password}
                  onChange={(e) =>
                    setForm({ ...form, default_password: e.target.value, clear_password: false })
                  }
                  placeholder={form.has_password ? "Type new password to replace" : "Password"}
                  autoComplete="new-password"
                />
                {form.has_password && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, clear_password: !form.clear_password, default_password: "" })
                    }
                    className="text-xs text-destructive underline"
                  >
                    {form.clear_password ? "Cancel removal" : "Remove saved password"}
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <Label>Note (optional)</Label>
                <Textarea
                  rows={2}
                  value={form.credentials_note}
                  onChange={(e) => setForm({ ...form, credentials_note: e.target.value })}
                  placeholder="e.g. Use SSO if your @company.com email is enrolled."
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Passwords are encrypted at rest and only revealed to logged-in users.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <FileOrUrlInput
                value={form.icon_url ?? ""}
                onChange={(url) => setForm({ ...form, icon_url: url })}
                accept="image/*"
                prefix="icons"
              />
            </div>
            <div className="space-y-2">
              <Label>Thumbnail (16:10 recommended)</Label>
              <FileOrUrlInput
                value={form.thumbnail_url ?? ""}
                onChange={(url) => setForm({ ...form, thumbnail_url: url })}
                accept="image/*"
                prefix="thumbnails"
              />
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
