import { SigaLayout } from "@/components/SigaLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { toast } from "sonner";
import { useState, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import {
  AlertTriangle, Building2, ChevronRight, Edit2, ExternalLink,
  FileText, Globe, Mail, Phone, Plus, Search, Shield, Trash2,
  Upload, User, X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

// ── Tipos ────────────────────────────────────────────────────────────────────
interface FornecedorForm {
  id?: number;
  nome: string; codigo: string;
  contactoComercialNome: string; contactoComercialEmail: string; contactoComercialTelemovel: string;
  contactoQualidadeNome: string; contactoQualidadeEmail: string; contactoQualidadeTelemovel: string;
}
const EMPTY_FORN: FornecedorForm = {
  nome: "", codigo: "",
  contactoComercialNome: "", contactoComercialEmail: "", contactoComercialTelemovel: "",
  contactoQualidadeNome: "", contactoQualidadeEmail: "", contactoQualidadeTelemovel: "",
};

interface DocForm {
  id?: number;
  fornecedorId: number;
  tipo: string; nome: string; descricao: string;
  dataEmissao: string; dataValidade: string;
  ficheiroUrl?: string; ficheiroKey?: string; nomeOriginal?: string;
}
const EMPTY_DOC = (fornId: number): DocForm => ({
  fornecedorId: fornId, tipo: "outro", nome: "", descricao: "",
  dataEmissao: "", dataValidade: "",
});

const TIPOS_LABEL: Record<string, string> = {
  certificacao_iso: "Certificação ISO",
  certificacao_fssc: "Certificação FSSC 22000",
  certificacao_ifs: "Certificação IFS",
  certificacao_brc: "Certificação BRC",
  declaracao_alergenios: "Declaração de Alergénios",
  declaracao_ogm: "Declaração OGM",
  declaracao_halal: "Certificação Halal",
  declaracao_kosher: "Certificação Kosher",
  analise_laboratorial: "Análise Laboratorial",
  auditoria_fornecedor: "Auditoria ao Fornecedor",
  outro: "Outro Documento",
};

// ── Componente de estado de validade ─────────────────────────────────────────
function EstadoBadge({ estado, dias }: { estado: string; dias: number }) {
  if (estado === "expirado") return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Expirado</span>
  );
  if (estado === "a_expirar_30") return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">{dias}d</span>
  );
  if (estado === "a_expirar_60") return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">{dias}d</span>
  );
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Válido</span>
  );
}

// ── Painel de detalhe do fornecedor ──────────────────────────────────────────
function FornecedorDetalhe({
  fornecedorId, onClose, isAuthenticated, onEdit,
}: {
  fornecedorId: number;
  onClose: () => void;
  isAuthenticated: boolean;
  onEdit: (f: any) => void;
}) {
  const { data: forn, refetch } = trpc.fornecedores.byId.useQuery({ id: fornecedorId });
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [docForm, setDocForm] = useState<DocForm>(EMPTY_DOC(fornecedorId));
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; key: string; nome: string } | null>(null);
  const [estadoFilter, setEstadoFilter] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upsertDoc = trpc.fornecedores.documentos.upsert.useMutation({
    onSuccess: () => { toast.success("Documento guardado"); setDocDialogOpen(false); setUploadedFile(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteDoc = trpc.fornecedores.documentos.delete.useMutation({
    onSuccess: () => { toast.success("Documento eliminado"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const uploadFicheiro = trpc.fornecedores.documentos.uploadFicheiro.useMutation({
    onSuccess: (data) => {
      setUploadedFile({ url: data.url, key: data.key, nome: data.nomeOriginal });
      setDocForm(f => ({ ...f, ficheiroUrl: data.url, ficheiroKey: data.key, nomeOriginal: data.nomeOriginal }));
      toast.success("Ficheiro carregado");
      setUploading(false);
    },
    onError: (e) => { toast.error("Erro: " + e.message); setUploading(false); },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadFicheiro.mutate({ ficheiroBase64: base64, nomeOriginal: file.name, mimeType: file.type || "application/pdf", fornecedorId });
    };
    reader.readAsDataURL(file);
  };

  const handleDataEmissao = (val: string) => {
    const emissao = new Date(val);
    const validade = new Date(emissao);
    validade.setFullYear(validade.getFullYear() + 1);
    setDocForm(f => ({ ...f, dataEmissao: val, dataValidade: validade.toISOString().split("T")[0] }));
  };

  const handleSubmitDoc = () => {
    if (!docForm.nome || !docForm.dataEmissao || !docForm.dataValidade) {
      toast.error("Preencha nome e datas"); return;
    }
    upsertDoc.mutate({
      ...docForm,
      tipo: docForm.tipo as any,
      dataEmissao: new Date(docForm.dataEmissao),
      dataValidade: new Date(docForm.dataValidade),
    });
  };

  const documentos = (forn?.documentos ?? []) as any[];
  const filteredDocs = estadoFilter === "all" ? documentos : documentos.filter(d => d.estado === estadoFilter);

  const docStats = useMemo(() => ({
    expirado: documentos.filter(d => d.estado === "expirado").length,
    a_expirar_30: documentos.filter(d => d.estado === "a_expirar_30").length,
    a_expirar_60: documentos.filter(d => d.estado === "a_expirar_60").length,
    valido: documentos.filter(d => d.estado === "valido").length,
  }), [documentos]);

  if (!forn) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between p-6 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">{forn.nome}</h2>
            {forn.codigo && <p className="text-xs font-mono text-muted-foreground">{forn.codigo}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isAuthenticated && (
            <button
              onClick={() => onEdit(forn)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" /> Editar
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Conteúdo com tabs */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="contactos" className="h-full">
          <TabsList className="w-full rounded-none border-b border-border/60 bg-transparent h-10 px-6 justify-start gap-1">
            <TabsTrigger value="contactos" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Contactos
            </TabsTrigger>
            <TabsTrigger value="documentos" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Documentos
              {(docStats.expirado + docStats.a_expirar_30) > 0 && (
                <span className="ml-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {docStats.expirado + docStats.a_expirar_30}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab Contactos */}
          <TabsContent value="contactos" className="p-6 space-y-6 mt-0">
            {/* Contacto Comercial */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Contacto Comercial</p>
              </div>
              {(forn.contactoComercialNome || forn.contactoComercialEmail || forn.contactoComercialTelemovel) ? (
                <div className="space-y-2 pl-8">
                  {forn.contactoComercialNome && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>{forn.contactoComercialNome}</span>
                    </div>
                  )}
                  {forn.contactoComercialEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <a href={`mailto:${forn.contactoComercialEmail}`} className="text-primary hover:underline">
                        {forn.contactoComercialEmail}
                      </a>
                    </div>
                  )}
                  {forn.contactoComercialTelemovel && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <a href={`tel:${forn.contactoComercialTelemovel}`} className="hover:underline">
                        {forn.contactoComercialTelemovel}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic pl-8">Sem contacto comercial registado</p>
              )}
            </div>

            {/* Contacto Qualidade */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Contacto de Qualidade</p>
              </div>
              {(forn.contactoQualidadeNome || forn.contactoQualidadeEmail || forn.contactoQualidadeTelemovel) ? (
                <div className="space-y-2 pl-8">
                  {forn.contactoQualidadeNome && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>{forn.contactoQualidadeNome}</span>
                    </div>
                  )}
                  {forn.contactoQualidadeEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <a href={`mailto:${forn.contactoQualidadeEmail}`} className="text-primary hover:underline">
                        {forn.contactoQualidadeEmail}
                      </a>
                    </div>
                  )}
                  {forn.contactoQualidadeTelemovel && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <a href={`tel:${forn.contactoQualidadeTelemovel}`} className="hover:underline">
                        {forn.contactoQualidadeTelemovel}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic pl-8">Sem contacto de qualidade registado</p>
              )}
            </div>
          </TabsContent>

          {/* Tab Documentos */}
          <TabsContent value="documentos" className="mt-0">
            <div className="p-6 space-y-4">
              {/* Resumo de estados */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Expirados", estado: "expirado", count: docStats.expirado, color: "red" },
                  { label: "≤ 30 dias", estado: "a_expirar_30", count: docStats.a_expirar_30, color: "orange" },
                  { label: "≤ 60 dias", estado: "a_expirar_60", count: docStats.a_expirar_60, color: "yellow" },
                  { label: "Válidos", estado: "valido", count: docStats.valido, color: "emerald" },
                ].map(({ label, estado, count, color }) => (
                  <button
                    key={estado}
                    onClick={() => setEstadoFilter(estadoFilter === estado ? "all" : estado)}
                    className={cn(
                      "p-2 rounded-lg border text-center transition-all",
                      estadoFilter === estado ? "ring-2 ring-primary" : "",
                      color === "red" ? "bg-red-50 border-red-100" :
                      color === "orange" ? "bg-orange-50 border-orange-100" :
                      color === "yellow" ? "bg-yellow-50 border-yellow-100" :
                      "bg-emerald-50 border-emerald-100"
                    )}
                  >
                    <div className={cn("text-lg font-bold",
                      color === "red" ? "text-red-600" : color === "orange" ? "text-orange-600" :
                      color === "yellow" ? "text-yellow-600" : "text-emerald-600"
                    )}>{count}</div>
                    <div className={cn("text-[10px]",
                      color === "red" ? "text-red-600" : color === "orange" ? "text-orange-600" :
                      color === "yellow" ? "text-yellow-600" : "text-emerald-600"
                    )}>{label}</div>
                  </button>
                ))}
              </div>

              {/* Botão novo documento */}
              {isAuthenticated && (
                <Button
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={() => { setDocForm(EMPTY_DOC(fornecedorId)); setUploadedFile(null); setDocDialogOpen(true); }}
                >
                  <Plus className="w-3.5 h-3.5" /> Novo Documento
                </Button>
              )}

              {/* Lista de documentos */}
              <div className="space-y-2">
                {filteredDocs.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">Nenhum documento encontrado</p>
                  </div>
                )}
                {filteredDocs.map((doc: any) => {
                  const dias = differenceInDays(new Date(doc.dataValidade), new Date());
                  return (
                    <div key={doc.id} className={cn(
                      "p-3 rounded-xl border",
                      doc.estado === "expirado" ? "bg-red-50 border-red-200" :
                      doc.estado === "a_expirar_30" ? "bg-orange-50 border-orange-200" :
                      doc.estado === "a_expirar_60" ? "bg-yellow-50 border-yellow-200" :
                      "bg-card border-border/60"
                    )}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-semibold text-foreground truncate">{doc.nome}</p>
                            <EstadoBadge estado={doc.estado} dias={dias} />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {TIPOS_LABEL[doc.tipo] ?? doc.tipo}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Válido até {format(new Date(doc.dataValidade), "dd/MM/yyyy", { locale: pt })}
                          </p>
                          {doc.descricao && (
                            <p className="text-[10px] text-muted-foreground italic mt-0.5">{doc.descricao}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {doc.ficheiroUrl && (
                            <a
                              href={doc.ficheiroUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-white/80 hover:bg-white border border-current/20 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" /> PDF
                            </a>
                          )}
                          {isAuthenticated && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button className="p-1.5 rounded-md hover:bg-red-100 hover:text-red-600 transition-colors opacity-60 hover:opacity-100">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Eliminar Documento</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Eliminar <strong>{doc.nome}</strong>? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteDoc.mutate({ id: doc.id })} className="bg-red-500 hover:bg-red-600">
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de novo documento */}
      <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Documento de Qualidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tipo de Documento *</label>
              <Select value={docForm.tipo} onValueChange={v => setDocForm(f => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPOS_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nome / Referência *</label>
              <Input value={docForm.nome} onChange={e => setDocForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: ISO 22000:2018 — Cert. nº 12345" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Descrição (opcional)</label>
              <textarea
                value={docForm.descricao}
                onChange={e => setDocForm(f => ({ ...f, descricao: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Data de Emissão *</label>
                <Input type="date" value={docForm.dataEmissao} onChange={e => handleDataEmissao(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Data de Validade *</label>
                <Input type="date" value={docForm.dataValidade} onChange={e => setDocForm(f => ({ ...f, dataValidade: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              A validade é calculada automaticamente como 1 ano após a emissão (máximo regulamentar).
            </div>
            {/* Upload */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Ficheiro (PDF, imagem)</label>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
              {uploadedFile ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-emerald-700 truncate">{uploadedFile.nome}</p>
                    <p className="text-[10px] text-emerald-600">Carregado com sucesso</p>
                  </div>
                  <a href={uploadedFile.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-emerald-100">
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                  </a>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className={cn(
                    "w-full flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-dashed transition-all",
                    uploading ? "border-primary/30 bg-primary/5 cursor-wait" : "border-border hover:border-primary/40 hover:bg-accent/30 cursor-pointer"
                  )}
                >
                  <Upload className={cn("w-5 h-5", uploading ? "text-primary animate-pulse" : "text-muted-foreground")} />
                  <p className="text-xs font-medium">{uploading ? "A carregar..." : "Clique para anexar documento"}</p>
                  <p className="text-[10px] text-muted-foreground">PDF, JPG ou PNG · máx. 10MB</p>
                </button>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDocDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmitDoc} disabled={upsertDoc.isPending}>
                {upsertDoc.isPending ? "A guardar..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Fornecedores() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [estadoDocFilter, setEstadoDocFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FornecedorForm>(EMPTY_FORN);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: fornecedores, refetch } = trpc.fornecedores.list.useQuery();
  const { data: alertasDoc } = trpc.fornecedores.documentos.alertas.useQuery();

  const upsert = trpc.fornecedores.upsert.useMutation({
    onSuccess: () => { toast.success(form.id ? "Fornecedor atualizado" : "Fornecedor criado"); setDialogOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteForn = trpc.fornecedores.delete.useMutation({
    onSuccess: () => { toast.success("Fornecedor removido"); setSelectedId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  // Mapa fornecedor → pior estado de documento
  const fornDocEstado = useMemo(() => {
    const map = new Map<number, string>();
    (alertasDoc ?? []).forEach((doc: any) => {
      const atual = map.get(doc.fornecedorId);
      const prioridade = ["expirado", "a_expirar_30", "a_expirar_60"];
      if (!atual || prioridade.indexOf(doc.estado) < prioridade.indexOf(atual)) {
        map.set(doc.fornecedorId, doc.estado);
      }
    });
    return map;
  }, [alertasDoc]);

  const filtered = useMemo(() => {
    return (fornecedores ?? []).filter(f => {
      const matchSearch = f.nome.toLowerCase().includes(search.toLowerCase()) ||
        (f.codigo ?? "").toLowerCase().includes(search.toLowerCase());
      const matchEstado = estadoDocFilter === "all" ||
        (estadoDocFilter === "com_alerta" ? fornDocEstado.has(f.id) :
         fornDocEstado.get(f.id) === estadoDocFilter);
      return matchSearch && matchEstado;
    });
  }, [fornecedores, search, estadoDocFilter, fornDocEstado]);

  const openCreate = () => { setForm(EMPTY_FORN); setDialogOpen(true); };
  const openEdit = (f: any) => {
    setForm({
      id: f.id, nome: f.nome, codigo: f.codigo ?? "",
      contactoComercialNome: f.contactoComercialNome ?? "",
      contactoComercialEmail: f.contactoComercialEmail ?? "",
      contactoComercialTelemovel: f.contactoComercialTelemovel ?? "",
      contactoQualidadeNome: f.contactoQualidadeNome ?? "",
      contactoQualidadeEmail: f.contactoQualidadeEmail ?? "",
      contactoQualidadeTelemovel: f.contactoQualidadeTelemovel ?? "",
    });
    setDialogOpen(true);
  };

  const alertasCount = (alertasDoc ?? []).length;

  return (
    <SigaLayout
      title="Fornecedores"
      subtitle={`${(fornecedores ?? []).length} fornecedores ativos`}
      actions={
        isAuthenticated ? (
          <Button onClick={openCreate} size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Novo Fornecedor
          </Button>
        ) : (
          <Button onClick={() => startLogin()} size="sm" variant="outline">Iniciar Sessão</Button>
        )
      }
    >
      <div className={cn("flex gap-5 h-full", selectedId ? "overflow-hidden" : "")}>
        {/* Coluna esquerda: lista */}
        <div className={cn("flex flex-col gap-4", selectedId ? "w-80 shrink-0" : "flex-1")}>
          {/* Alerta global de documentos */}
          {alertasCount > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-200">
              <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
              <p className="text-xs text-orange-700 font-medium">
                {alertasCount} documento{alertasCount !== 1 ? "s" : ""} com validade a expirar ou expirado{alertasCount !== 1 ? "s" : ""}
              </p>
            </div>
          )}

          {/* Filtros */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar fornecedores..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={estadoDocFilter} onValueChange={setEstadoDocFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos os estados de documentação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os fornecedores</SelectItem>
                <SelectItem value="com_alerta">Com alertas de documentação</SelectItem>
                <SelectItem value="expirado">Documentação expirada</SelectItem>
                <SelectItem value="a_expirar_30">Documentação a expirar (≤ 30 dias)</SelectItem>
                <SelectItem value="a_expirar_60">Documentação a expirar (≤ 60 dias)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de fornecedores */}
          <div className="space-y-2">
            {filtered.length === 0 && (
              <div className="card-elegant p-10 text-center">
                <Building2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Nenhum fornecedor encontrado</p>
              </div>
            )}
            {filtered.map(f => {
              const piorEstado = fornDocEstado.get(f.id);
              const isSelected = selectedId === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedId(isSelected ? null : f.id)}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border/60 bg-card hover:border-primary/30 hover:bg-accent/20"
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{f.nome}</p>
                    {f.codigo && <p className="text-[10px] font-mono text-muted-foreground">{f.codigo}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {piorEstado && (
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        piorEstado === "expirado" ? "bg-red-500" :
                        piorEstado === "a_expirar_30" ? "bg-orange-500" :
                        "bg-yellow-400"
                      )} title={`Documentação: ${piorEstado}`} />
                    )}
                    <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", isSelected && "rotate-90")} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Painel de detalhe lateral */}
        {selectedId && (
          <div className="flex-1 rounded-2xl border border-border/60 bg-card overflow-hidden">
            <FornecedorDetalhe
              fornecedorId={selectedId}
              onClose={() => setSelectedId(null)}
              isAuthenticated={isAuthenticated}
              onEdit={(f) => { openEdit(f); }}
            />
          </div>
        )}
      </div>

      {/* Dialog de criação/edição de fornecedor */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            {/* Info básica */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Nome *</label>
                <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do fornecedor" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Código</label>
                <Input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} placeholder="Ex: FORN-001" />
              </div>
            </div>

            {/* Contacto Comercial */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center">
                  <User className="w-3 h-3 text-blue-600" />
                </div>
                <p className="text-xs font-semibold text-foreground">Contacto Comercial</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pl-7">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Nome</label>
                  <Input value={form.contactoComercialNome} onChange={e => setForm(f => ({ ...f, contactoComercialNome: e.target.value }))} placeholder="Nome completo" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <Input type="email" value={form.contactoComercialEmail} onChange={e => setForm(f => ({ ...f, contactoComercialEmail: e.target.value }))} placeholder="email@..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Telemóvel</label>
                  <Input value={form.contactoComercialTelemovel} onChange={e => setForm(f => ({ ...f, contactoComercialTelemovel: e.target.value }))} placeholder="+351 9xx xxx xxx" />
                </div>
              </div>
            </div>

            {/* Contacto Qualidade */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-emerald-50 flex items-center justify-center">
                  <Shield className="w-3 h-3 text-emerald-600" />
                </div>
                <p className="text-xs font-semibold text-foreground">Contacto de Qualidade</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pl-7">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Nome</label>
                  <Input value={form.contactoQualidadeNome} onChange={e => setForm(f => ({ ...f, contactoQualidadeNome: e.target.value }))} placeholder="Nome completo" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <Input type="email" value={form.contactoQualidadeEmail} onChange={e => setForm(f => ({ ...f, contactoQualidadeEmail: e.target.value }))} placeholder="email@..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Telemóvel</label>
                  <Input value={form.contactoQualidadeTelemovel} onChange={e => setForm(f => ({ ...f, contactoQualidadeTelemovel: e.target.value }))} placeholder="+351 9xx xxx xxx" />
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              {form.id && isAuthenticated && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar Fornecedor</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem a certeza que pretende eliminar <strong>{form.nome}</strong>? Os dados históricos serão preservados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => { deleteForn.mutate({ id: form.id! }); setDialogOpen(false); }} className="bg-red-500 hover:bg-red-600">
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <div className="flex gap-3 ml-auto">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={() => upsert.mutate(form)} disabled={!form.nome || upsert.isPending}>
                  {upsert.isPending ? "A guardar..." : form.id ? "Guardar" : "Criar"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SigaLayout>
  );
}
