import { LogOut, User, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AccountMenuProps {
  email: string | undefined;
  onLogout: () => void;
}

export function AccountMenu({ email, onLogout }: AccountMenuProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
          <User size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Minha Conta</div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground truncate">
            <Mail size={12} className="shrink-0 text-muted-foreground" />
            {email ?? "Visitante"}
          </div>
        </div>
      </div>
      
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
      >
        <LogOut size={16} />
        Sair da conta
      </button>
    </div>
  );
}
