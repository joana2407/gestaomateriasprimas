import { SigaLayout } from "@/components/SigaLayout";
import { FactoryBadge } from "@/components/FactoryBadge";
import { AllergenGrid } from "@/components/AllergenGrid";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { type AlergenioId, ALERGENIOS_14 } from "../../../shared/allergens";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronDown, ChevronUp, FileText, Printer } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FichasProduto() {
  const [fabricaFilter, setFabricaFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data: fichas } = trpc.fichasTecnicas.list.useQuery();
  const { data: produtos } = trpc.produtos.list.useQuery({ fabricaId: fabricaFilter !== "all" ? parseInt(fabricaFilter) : undefined });
  const { data: fabricas } = trpc.fabricas.list.useQuery();
  const { data: ftps } = trpc.fichasTecnicas.list.useQuery();

  // Usar os produtos com FTP gerada
  const produtosComFTP = (produtos ?? []);

  return (
    <SigaLayout
      title="Fichas Técnicas de Produto"
      subtitle="Documentos gerados automaticamente com composição e alergénios"
    >
      <div className="space-y-5">
        <Select value={fabricaFilter} onValueChange={setFabricaFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Todas as fábricas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as fábricas</SelectItem>
            {fabricas?.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="space-y-2">
          {produtosComFTP.length === 0 && (
            <div className="card-elegant p-12 text-center">
              <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhuma FTP encontrada</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Vá a Produtos e clique em "FTP" para gerar fichas técnicas</p>
            </div>
          )}
          {produtosComFTP.map(produto => {
            const fab = fabricas?.find(f => f.id === produto.fabricaId);
            const isExpanded = expandedId === produto.id;
            return (
              <div key={produto.id} className="card-elegant overflow-hidden">
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : produto.id)}
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                    <FileText className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{produto.nome}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {fab && <FactoryBadge nome={fab.nome} codigo={fab.codigo} size="sm" />}
                      {produto.marca && <span className="text-xs text-muted-foreground">{produto.marca}</span>}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
                {isExpanded && <FTPDetalhe produtoId={produto.id} />}
              </div>
            );
          })}
        </div>
      </div>
    </SigaLayout>
  );
}

function FTPDetalhe({ produtoId }: { produtoId: number }) {
  const { data: produto } = trpc.produtos.byId.useQuery({ id: produtoId });
  if (!produto) return <div className="p-4 text-center text-xs text-muted-foreground">A carregar...</div>;
  const formulacao = (produto.perfil?.alergeniosFormulacao as string[] ?? []) as AlergenioId[];
  const contaminacao = (produto.perfil?.alergeniosContaminacao as string[] ?? []) as AlergenioId[];
  return (
    <div className="border-t border-border/60 p-6 bg-muted/10 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center border-b border-border/60 pb-4">
          <h3 className="text-lg font-bold text-foreground">FICHA TÉCNICA DE PRODUTO</h3>
          <p className="text-sm text-muted-foreground mt-1">{produto.nome}</p>
          <p className="text-xs text-muted-foreground">Gerado em {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: pt })}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-xs font-medium text-muted-foreground">Código:</span><p className="font-medium">{produto.codigo ?? "—"}</p></div>
          <div><span className="text-xs font-medium text-muted-foreground">Marca:</span><p className="font-medium">{produto.marca ?? "—"}</p></div>
          <div><span className="text-xs font-medium text-muted-foreground">Gama:</span><p className="font-medium">{produto.gama ?? "—"}</p></div>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Declaração de Alergénios</p>
          {formulacao.length > 0 && (
            <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs font-bold text-red-700 mb-1.5">CONTÉM:</p>
              <p className="text-sm text-red-700">{formulacao.map(a => ALERGENIOS_14.find(x => x.id === a)?.label).filter(Boolean).join(", ")}</p>
            </div>
          )}
          {contaminacao.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs font-bold text-amber-700 mb-1.5">PODE CONTER VESTÍGIOS DE:</p>
              <p className="text-sm text-amber-700">{contaminacao.map(a => ALERGENIOS_14.find(x => x.id === a)?.label).filter(Boolean).join(", ")}</p>
            </div>
          )}
          {formulacao.length === 0 && contaminacao.length === 0 && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-sm text-emerald-700 font-medium">Sem alergénios declarados</p>
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Grelha de Alergénios</p>
          <AllergenGrid formulacao={formulacao} contaminacao={contaminacao} readonly compact={false} />
        </div>
      </div>
    </div>
  );
}

