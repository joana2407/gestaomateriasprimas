import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, BarChart3, Bell, BookOpen, ChevronRight,
  ClipboardCheck, ClipboardList, Factory, FileText, FlaskConical,
  Home, LogOut, Menu, Package, Settings, ShieldCheck, Upload, Users, X
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { PERFIL_ACESSO_LABEL, type PerfilAcesso } from "../../../shared/perfis-acesso";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Dashboard", group: "principal" },
  { href: "/fabricas", icon: Factory, label: "Fábricas", group: "principal" },
  { href: "/materias-primas", icon: Package, label: "Matérias-Primas", group: "gestao" },
  { href: "/fornecedores", icon: Users, label: "Fornecedores", group: "gestao" },
  { href: "/fichas-tecnicas", icon: Upload, label: "Fichas Técnicas", group: "gestao" },
  { href: "/rececoes", icon: ClipboardCheck, label: "Receções", group: "gestao" },
  { href: "/receitas", icon: BookOpen, label: "Receitas", group: "producao" },
  { href: "/produtos", icon: FlaskConical, label: "Produtos", group: "producao" },
  { href: "/sequenciamento", icon: ClipboardList, label: "Sequenciamento", group: "producao" },
  { href: "/fichas-produto", icon: FileText, label: "FT de Produto", group: "documentos" },
  { href: "/historico", icon: BarChart3, label: "Histórico", group: "documentos" },
  { href: "/notificacoes", icon: Bell, label: "Notificações", group: "documentos" },
  { href: "/importacao", icon: Settings, label: "Importação", group: "config" },
  { href: "/configuracoes", icon: ShieldCheck, label: "Configurações", group: "config" },
];

const GROUPS = [
  { key: "principal", label: "Principal" },
  { key: "gestao", label: "Gestão" },
  { key: "producao", label: "Produção" },
  { key: "documentos", label: "Documentos" },
  { key: "config", label: "Configuração" },
];

interface SigaLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function SigaLayout({ children, title, subtitle, actions }: SigaLayoutProps) {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isLogistica = user?.role === "logistica";
  const navItemsVisiveis = isLogistica ? NAV_ITEMS.filter(item => item.href === "/rececoes") : NAV_ITEMS;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <ShieldCheck className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground tracking-tight">Gestão Matérias Primas A&S</div>
            <div className="text-[10px] text-muted-foreground leading-tight"></div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        {GROUPS.map(group => {
          const items = navItemsVisiveis.filter(i => i.group === group.key);
          if (items.length === 0) return null;
          return (
            <div key={group.key}>
              <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {items.map(item => {
                  const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 cursor-pointer",
                          isActive
                            ? "bg-primary text-primary-foreground font-medium shadow-sm"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                        {isActive && <ChevronRight className="w-3 h-3 ml-auto shrink-0 opacity-70" />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-border/60">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
              {(user.name ?? user.email ?? "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{user.name ?? user.email}</div>
              <div className="text-[10px] text-muted-foreground">{PERFIL_ACESSO_LABEL[user.role as PerfilAcesso] ?? user.role}</div>
            </div>
            <button
              onClick={() => logout()}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Terminar sessão"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => startLogin()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Iniciar Sessão
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-card border-r border-border/60 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card shadow-xl flex flex-col">
            <div className="flex items-center justify-end px-4 pt-4">
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 shrink-0 flex items-center gap-4 px-6 bg-card border-b border-border/60 shadow-xs">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            {title && <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>}
            {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
          </div>
          {isAuthenticated && user && (
            <button
              onClick={() => logout()}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title="Terminar sessão e trocar de utilizador"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trocar utilizador</span>
            </button>
          )}
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            {isLogistica && (
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-3 text-xs text-sky-800">
                <span><strong>Perfil Logística:</strong> este acesso está autorizado apenas para o módulo de Receções.</span>
                <button onClick={() => logout()} className="font-semibold text-sky-900 underline underline-offset-2 text-left sm:text-right">Trocar para utilizador de Qualidade</button>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
