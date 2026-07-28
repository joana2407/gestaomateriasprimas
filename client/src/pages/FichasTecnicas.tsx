import { SigaLayout } from "@/components/SigaLayout";
import { ValidityBadge } from "@/components/ValidityBadge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { toast } from "sonner";
import { useState } from "react";
import { differenceInDays, format } from "date-fns";
import { pt } from "date-fns/locale";
import { AlertTriangle, FileText, Plus, Search, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FTForm {
  id?: number; materiaPrimaId: number; versao: string;
  dataEmissao: string; dataValidade: string; notas: string;
}
const EMPTY_FT: FTForm = { materiaPrimaId: 0, versao: "1.0", dataEmissao: "", dataValidade: "", notas: "" };

export default function FichasTecnicas() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FTForm>(EMPTY_FT);

  const { data: fichas, refetch } = trpc.fichasTecnicas.list.useQuery();
  const { data: mps } = trpc.materiasPrimas.list.useQuery();
  const upsert = trpc.fichasTecnicas.upsert.useMutation({
    onSuccess: () => { toast.success("Ficha técnica guardada"); setDialogOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const mpMap = new Map((mps ?? []).map(mp => [mp.id, mp]));

  const filtered = (fichas ?? []).filter(ft => {
    const mp = mpMap.get(ft.materiaPrimaId);
    const matchSearch = (mp?.nome ?? "").toLowerCase().includes(search.toLowerCase());
    const matchEstado = estadoFilter === "all" || ft.estado === estadoFilter;
    return matchSearch && matchEstado;
  });

  const handleSubmit = () => {
    if (!form.materiaPrimaId || !form.dataEmissao || !form.dataValidade) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    upsert.mutate({
      ...form,
      dataEmissao: new Date(form.dataEmissao),
      dataValidade: new Date(form.dataValidade),
    });
  };

  // Auto-calcular data de validade (12 meses após emissão)
  const handleDataEmissao = (val: string) => {
    const emissao = new Date(val);
    const validade = new Date(emissao);
    validade.setFullYear(validade.getFullYear() + 1);
    setForm(f => ({
      ...f,
      dataEmissao: val,
      dataValidade: validade.toISOString().split("T")[0],
    }));
  };

  const ESTADOS = [
    { value: "all", label: "Todos os estados" },
    { value: "valida", label: "Válida" },
    { value: "a_expirar_60", label: "A expirar (60 dias)" },
    { value: "a_expirar_30", label: "A expirar (30 dias)" },
    { value: "expirada", label: "Expirada" },
  ];

  return (
    <SigaLayout
      title="Fichas Técnicas de Fornecedor"
      subtitle="Controlo de validade e gestão de FT de matérias-primas"
      actions={
        isAuthenticated ? (
          <Button onClick={() => { setForm(EMPTY_FT); setDialogOpen(true); }} size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Nova FT
          </Button>
        ) : (
          <Button onClick={() => startLogin()} size="sm" variant="outline">Iniciar Sessão</Button>
        )
      }
    >
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Pesquisar por matéria-prima..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Resumo de alertas */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Expiradas", estado: "expirada", color: "red" },
            { label: "≤ 30 dias", estado: "a_expirar_30", color: "orange" },
            { label: "≤ 60 dias", estado: "a_expirar_60", color: "yellow" },
            { label: "Válidas", estado: "valida", color: "emerald" },
          ].map(({ label, estado, color }) => {
            const count = (fichas ?? []).filter(f => f.estado === estado).length;
            return (
              <button
                key={estado}
                onClick={() => setEstadoFilter(estadoFilter === estado ? "all" : estado)}
                className={cn(
                  "p-3 rounded-xl border text-center transition-all",
                  estadoFilter === estado ? "ring-2 ring-primary" : "",
                  color === "red" ? "bg-red-50 border-red-100" :
                  color === "orange" ? "bg-orange-50 border-orange-100" :
                  color === "yellow" ? "bg-yellow-50 border-yellow-100" :
                  "bg-emerald-50 border-emerald-100"
                )}
              >
                <div className={cn(
                  "text-xl font-bold",
                  color === "red" ? "text-red-600" :
                  color === "orange" ? "text-orange-600" :
                  color === "yellow" ? "text-yellow-600" :
                  "text-emerald-600"
                )}>{count}</div>
                <div className={cn(
                  "text-xs mt-0.5",
                  color === "red" ? "text-red-600" :
                  color === "orange" ? "text-orange-600" :
                  color === "yellow" ? "text-yellow-600" :
                  "text-emerald-600"
                )}>{label}</div>
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="card-elegant p-12 text-center">
              <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhuma ficha técnica encontrada</p>
            </div>
          )}
          {filtered.map(ft => {
            const mp = mpMap.get(ft.materiaPrimaId);
            const dias = differenceInDays(new Date(ft.dataValidade), new Date());
            const rowClass = ft.estado === "expirada" ? "alerta-expirada" :
              ft.estado === "a_expirar_30" ? "alerta-30" :
              ft.estado === "a_expirar_60" ? "alerta-60" : "alerta-valida";
            return (
              <div key={ft.id} className={cn("flex items-center gap-4 p-4 rounded-xl", rowClass)}>
                <FileText className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{mp?.nome ?? `MP #${ft.materiaPrimaId}`}</p>
                  <p className="text-xs opacity-80 mt-0.5">
                    Versão {ft.versao} · Emitida: {format(new Date(ft.dataEmissao), "dd/MM/yyyy", { locale: pt })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <ValidityBadge dataValidade={ft.dataValidade} />
                  {ft.estado !== "valida" && (
                    <p className="text-xs mt-1 opacity-80">
                      {dias < 0 ? `Expirou há ${Math.abs(dias)} dias` : `Expira em ${dias} dias`}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Ficha Técnica de Fornecedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Matéria-Prima *</label>
              <Select
                value={form.materiaPrimaId ? String(form.materiaPrimaId) : ""}
                onValueChange={v => setForm(f => ({ ...f, materiaPrimaId: parseInt(v) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar MP..." />
                </SelectTrigger>
                <SelectContent>
                  {mps?.map(mp => <SelectItem key={mp.id} value={String(mp.id)}>{mp.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Versão</label>
              <Input value={form.versao} onChange={e => setForm(f => ({ ...f, versao: e.target.value }))} placeholder="Ex: 1.0" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Data de Emissão *</label>
                <Input type="date" value={form.dataEmissao} onChange={e => handleDataEmissao(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Data de Validade *</label>
                <Input type="date" value={form.dataValidade} onChange={e => setForm(f => ({ ...f, dataValidade: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              A data de validade é calculada automaticamente como 12 meses após a emissão. Pode ajustar manualmente.
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Notas</label>
              <textarea
                value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={upsert.isPending}>
                {upsert.isPending ? "A guardar..." : "Guardar FT"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SigaLayout>
  );
}

