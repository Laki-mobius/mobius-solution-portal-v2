import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldOff, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { ResetPasswordDialog } from "./ResetPasswordDialog";

type UserRow = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
};

export const AdminUsers = () => {
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();
  const [resetTarget, setResetTarget] = useState<{ id: string; email: string } | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => api<UserRow[]>("/api/users"),
  });

  const toggleRole = async (u: UserRow) => {
    const newRole = u.role === "admin" ? "user" : "admin";
    try {
      await api(`/api/users/${u.id}/role`, { method: "PUT", body: { role: newRole } });
      toast.success(`${u.email} is now ${newRole}`);
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update role");
    }
  };

  const remove = async (u: UserRow) => {
    if (!confirm(`Delete user ${u.email}? This cannot be undone.`)) return;
    try {
      await api(`/api/users/${u.id}`, { method: "DELETE" });
      toast.success("User deleted");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        {data.length} registered {data.length === 1 ? "user" : "users"}.
      </p>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Joined</th>
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
                  No users yet.
                </td>
              </tr>
            ) : (
              data.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="border-t border-border">
                    <td className="p-3 font-medium">
                      {u.email}
                      {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                    </td>
                    <td className="p-3 capitalize">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          u.role === "admin"
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setResetTarget({ id: u.id, email: u.email })}
                        title="Reset password"
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleRole(u)} disabled={isSelf}>
                        {u.role === "admin" ? (
                          <ShieldOff className="h-4 w-4" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(u)}
                        disabled={isSelf}
                        title={isSelf ? "You cannot delete your own account" : "Delete user"}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ResetPasswordDialog
        userId={resetTarget?.id ?? null}
        userEmail={resetTarget?.email ?? null}
        open={!!resetTarget}
        onOpenChange={(open) => !open && setResetTarget(null)}
      />
    </div>
  );
};