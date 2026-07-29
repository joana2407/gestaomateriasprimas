import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb, upsertFornecedor, upsertMateriaPrima, upsertProduto, getFabricas, setMpFornecedores } from "../db";
import { fornecedores, materiasPrimas, produtos } from "../../drizzle/schema";

// Dados pré-carregados das matrizes Excel das 3 fábricas
const DADOS_FAB1 = {
  fornecedores: [
    "Cerealis/Ceres","Ceres","Cerealis","Moagem do Lordelo","Cergold","Vatel","Prodipani",
    "Prodite","AB Mauri","Martinpan","A&S","Puratos","Credin","Ireks","Nordmann",
    "A. Costa e Silva","BreAd"
  ],
  materiasPrimas: [
    { nome: "Farinha de Trigo 65", fornecedor: "Cerealis/Ceres", formulacao: ["gluten"], contaminacao: ["soja"] },
    { nome: "Farinha de trigo 150", fornecedor: "Cerealis/Ceres", formulacao: ["gluten"], contaminacao: ["soja"] },
    { nome: "Farinha Trigo T80", fornecedor: "Cerealis/Ceres", formulacao: ["gluten"], contaminacao: ["soja"] },
    { nome: "Farinha Trigo Alentejo", fornecedor: "Cerealis", formulacao: ["gluten"], contaminacao: ["soja"] },
    { nome: "Farinha de Centeio 130", fornecedor: "Cerealis/Ceres", formulacao: ["gluten"], contaminacao: ["soja","tremoco"] },
    { nome: "Farinha de Centeio 70", fornecedor: "Cerealis", formulacao: ["gluten"], contaminacao: ["soja","tremoco"] },
    { nome: "Farinha de Centeio Nacional", fornecedor: "Moagem do Lordelo", formulacao: [], contaminacao: [] },
    { nome: "Farinha de milho amarelo T175", fornecedor: "Moagem do Lordelo", formulacao: [], contaminacao: ["gluten","soja"] },
    { nome: "Farinha de milho amarelo T70", fornecedor: "Ceres", formulacao: [], contaminacao: ["gluten","soja"] },
    { nome: "Mix pão são - Vegetal", fornecedor: "Prodite", formulacao: ["gluten","soja"], contaminacao: ["ovos","leite","frutos_casca_rija","sesamo"] },
    { nome: "Mix aveia", fornecedor: "Credin", formulacao: ["gluten","sesamo"], contaminacao: ["ovos","soja","leite","frutos_casca_rija"] },
    { nome: "Softyplus", fornecedor: "Ireks", formulacao: ["gluten"], contaminacao: ["ovos","leite"] },
    { nome: "Propionato de calcio", fornecedor: "AB Mauri", formulacao: [], contaminacao: [] },
    { nome: "Ácido sorbico", fornecedor: "Nordmann", formulacao: [], contaminacao: [] },
    { nome: "Sorbato de Potássio", fornecedor: "Credin", formulacao: [], contaminacao: [] },
    { nome: "Farinha de malte de Cevada", fornecedor: "Prodite", formulacao: ["gluten"], contaminacao: [] },
    { nome: "Sementes de Girassol", fornecedor: "Nordmann", formulacao: [], contaminacao: [] },
    { nome: "Sementes de Linhaça", fornecedor: "Nordmann", formulacao: [], contaminacao: [] },
    { nome: "Sal", fornecedor: "Vatel", formulacao: [], contaminacao: [] },
    { nome: "Gluten de trigo", fornecedor: "AB Mauri", formulacao: ["gluten"], contaminacao: [] },
    { nome: "Levedura", fornecedor: "Prodipani", formulacao: [], contaminacao: [] },
    { nome: "Flocos de Aveia", fornecedor: "Nordmann", formulacao: ["gluten"], contaminacao: [] },
    { nome: "Isco seco (amor rye)", fornecedor: "Prodite", formulacao: ["gluten"], contaminacao: ["ovos","soja","leite","frutos_casca_rija","sesamo"] },
    { nome: "massa mãe centeio (amore rye)", fornecedor: "Prodite", formulacao: ["gluten"], contaminacao: ["ovos","soja","leite","frutos_casca_rija","sesamo"] },
    { nome: "Decoração Shape", fornecedor: "Prodite", formulacao: ["gluten","sesamo"], contaminacao: ["ovos","soja","leite","frutos_casca_rija"] },
    { nome: "Melhorante Soft Bread", fornecedor: "AB Mauri", formulacao: ["gluten"], contaminacao: ["soja","mostarda"] },
    { nome: "Conservante Natural - Mauri Natur", fornecedor: "AB Mauri", formulacao: ["gluten"], contaminacao: ["soja","mostarda"] },
    { nome: "Massa Mãe O-tentic Origin", fornecedor: "Puratos", formulacao: ["gluten"], contaminacao: [] },
    { nome: "Massa Mãe - Aromaferm 155", fornecedor: "AB Mauri", formulacao: ["gluten"], contaminacao: [] },
    { nome: "Panilac", fornecedor: "Credin", formulacao: ["gluten","leite"], contaminacao: ["ovos","soja","frutos_casca_rija","sesamo"] },
    { nome: "Gormax", fornecedor: "Credin", formulacao: [], contaminacao: ["gluten","ovos","soja","leite"] },
    { nome: "Canela em Pó", fornecedor: "Martinpan", formulacao: [], contaminacao: [] },
    { nome: "Açúcar", fornecedor: "Martinpan", formulacao: [], contaminacao: [] },
    { nome: "Hostia Comestível", fornecedor: "BreAd", formulacao: [], contaminacao: [] },
    { nome: "GB Fresh", fornecedor: "AB Mauri", formulacao: ["gluten"], contaminacao: ["soja","mostarda"] },
    { nome: "Hydrapan", fornecedor: "AB Mauri", formulacao: ["gluten"], contaminacao: ["soja","mostarda"] },
  ],
};

const DADOS_FAB2 = {
  fornecedores: ["Cerealis/Ceres","Ceres","Moagem do Lordelo","Cergold","Vatel","Prodipani","Prodite","AB Mauri","Martinpan","A&S"],
  materiasPrimas: [
    { nome: "Farinha de Trigo 65", fornecedor: "Cerealis/Ceres", formulacao: ["gluten"], contaminacao: ["soja","mostarda"] },
    { nome: "Farinha Trigo T80", fornecedor: "Cerealis/Ceres", formulacao: ["gluten"], contaminacao: ["soja","mostarda"] },
    { nome: "Farinha de Centeio 130", fornecedor: "Cerealis/Ceres", formulacao: ["gluten"], contaminacao: ["soja","mostarda","tremoco"] },
    { nome: "Farinha de Centeio 70", fornecedor: "Cerealis", formulacao: ["gluten"], contaminacao: ["soja","mostarda","tremoco"] },
    { nome: "Farinha de milho amarelo T175", fornecedor: "Moagem do Lordelo", formulacao: [], contaminacao: ["gluten","soja"] },
    { nome: "Farinha de milho amarelo T70", fornecedor: "Ceres", formulacao: [], contaminacao: ["gluten","soja"] },
    { nome: "Sal", fornecedor: "Vatel", formulacao: [], contaminacao: [] },
    { nome: "Levedura", fornecedor: "Prodipani", formulacao: [], contaminacao: [] },
    { nome: "massa mãe centeio (amore rye)", fornecedor: "Prodite", formulacao: ["gluten"], contaminacao: ["ovos","soja","leite","frutos_casca_rija","sesamo"] },
    { nome: "Melhorante Soft Bread", fornecedor: "AB Mauri", formulacao: ["gluten"], contaminacao: ["soja","mostarda"] },
    { nome: "Massa Mãe - Aromaferm 155", fornecedor: "AB Mauri", formulacao: ["gluten"], contaminacao: [] },
    { nome: "Massa Mãe - Aromaferm 120", fornecedor: "AB Mauri", formulacao: ["gluten"], contaminacao: [] },
    { nome: "Açúcar", fornecedor: "Martinpan", formulacao: [], contaminacao: [] },
    { nome: "GB Fresh", fornecedor: "AB Mauri", formulacao: ["gluten"], contaminacao: ["soja","mostarda"] },
    { nome: "Hydrapan", fornecedor: "AB Mauri", formulacao: ["gluten"], contaminacao: ["soja","mostarda"] },
    { nome: "Ferment Souer", fornecedor: "AB Mauri", formulacao: ["gluten"], contaminacao: ["ovos","soja","leite"] },
    { nome: "Massa Mãe fresca ISCO", fornecedor: "A&S", formulacao: ["gluten"], contaminacao: ["soja","mostarda"] },
    { nome: "farinha Malte de Cevada", fornecedor: "AB Mauri", formulacao: ["gluten"], contaminacao: [] },
  ],
};

const DADOS_FAB3 = {
  fornecedores: ["Credin","Germen","Ireks","Martinpan","A.Costa&Silva","Lactogal","Prodipani","Prodite"],
  materiasPrimas: [
    { nome: "Mix Baguette SG", fornecedor: "Credin", formulacao: [], contaminacao: [] },
    { nome: "Mix Kernel SG", fornecedor: "Credin", formulacao: [], contaminacao: [] },
    { nome: "Mix Muffin SG", fornecedor: "Credin", formulacao: ["ovos","leite"], contaminacao: [] },
    { nome: "Mix Brownie SG", fornecedor: "Credin", formulacao: ["ovos","leite"], contaminacao: [] },
    { nome: "Mix Pão Forma Branco SG", fornecedor: "Germen", formulacao: ["ovos"], contaminacao: ["sesamo"] },
    { nome: "Mix Universal Neutro SG", fornecedor: "Germen", formulacao: [], contaminacao: ["ovos","sesamo"] },
    { nome: "Mix 5 sementes SG", fornecedor: "Germen", formulacao: ["sesamo"], contaminacao: ["ovos"] },
    { nome: "Mix Decor SG", fornecedor: "Germen", formulacao: ["sesamo"], contaminacao: [] },
    { nome: "Mix Baguete artesanal SG", fornecedor: "Germen", formulacao: [], contaminacao: ["ovos","sesamo"] },
    { nome: "Mix Muffin Limão SG", fornecedor: "Germen", formulacao: ["ovos"], contaminacao: ["sesamo"] },
    { nome: "Mix Muffin Chocolate SG", fornecedor: "Germen", formulacao: ["ovos"], contaminacao: ["sesamo"] },
    { nome: "Mix Brioche Vegan SG", fornecedor: "Germen", formulacao: [], contaminacao: ["sesamo"] },
    { nome: "Mix Muffin Ireks SG", fornecedor: "Ireks", formulacao: [], contaminacao: ["ovos","leite"] },
    { nome: "Oleo Girassol", fornecedor: "Martinpan", formulacao: [], contaminacao: [] },
    { nome: "Açúcar SG", fornecedor: "Martinpan", formulacao: [], contaminacao: [] },
    { nome: "Sementes de Linhaça Castanha SG", fornecedor: "A.Costa&Silva", formulacao: [], contaminacao: [] },
    { nome: "Sementes de Girassol SG", fornecedor: "A.Costa&Silva", formulacao: [], contaminacao: [] },
    { nome: "Sementes de Sésamo SG", fornecedor: "A.Costa&Silva", formulacao: ["sesamo"], contaminacao: [] },
    { nome: "Leite Sem Lactose", fornecedor: "Lactogal", formulacao: ["leite"], contaminacao: [] },
    { nome: "Farinha de Arroz SG", fornecedor: "Germen", formulacao: [], contaminacao: [] },
    { nome: "Levedura SG", fornecedor: "Prodipani", formulacao: [], contaminacao: [] },
  ],
};

export const importacaoRouter = router({
  importarDadosExcel: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB not available");
    const fabricasList = await getFabricas();
    if (fabricasList.length === 0) throw new Error("Execute primeiro o seed das fábricas");
    const fab1 = fabricasList.find(f => f.codigo === "FAB1");
    const fab2 = fabricasList.find(f => f.codigo === "FAB2");
    const fab3 = fabricasList.find(f => f.codigo === "FAB3");
    if (!fab1 || !fab2 || !fab3) throw new Error("Fábricas não encontradas");

    // Criar fornecedores únicos
    const todosFornecedores = Array.from(new Set([
      ...DADOS_FAB1.fornecedores, ...DADOS_FAB2.fornecedores, ...DADOS_FAB3.fornecedores
    ]));
    const fornecedorMap = new Map<string, number>();
    for (const nome of todosFornecedores) {
      const id = await upsertFornecedor({ nome });
      fornecedorMap.set(nome, id);
    }

    // Criar MP da Fábrica I
    for (const mp of DADOS_FAB1.materiasPrimas) {
      const fornId = fornecedorMap.get(mp.fornecedor);
      const mpId = await upsertMateriaPrima({
        nome: mp.nome,
        fabricasIds: [fab1.id],
        alergeniosFormulacao: mp.formulacao,
        alergeniosContaminacao: mp.contaminacao,
      });
      if (fornId) await setMpFornecedores(mpId, [{ fornecedorId: fornId, preferencial: true }]);
    }

    // Criar MP da Fábrica II (verificar duplicados)
    for (const mp of DADOS_FAB2.materiasPrimas) {
      const fornId = fornecedorMap.get(mp.fornecedor);
      const mpId = await upsertMateriaPrima({
        nome: mp.nome + " (FAB2)",
        fabricasIds: [fab2.id],
        alergeniosFormulacao: mp.formulacao,
        alergeniosContaminacao: mp.contaminacao,
      });
      if (fornId) await setMpFornecedores(mpId, [{ fornecedorId: fornId, preferencial: true }]);
    }

    // Criar MP da Fábrica III
    for (const mp of DADOS_FAB3.materiasPrimas) {
      const fornId = fornecedorMap.get(mp.fornecedor);
      const mpId = await upsertMateriaPrima({
        nome: mp.nome,
        fabricasIds: [fab3.id],
        alergeniosFormulacao: mp.formulacao,
        alergeniosContaminacao: mp.contaminacao,
      });
      if (fornId) await setMpFornecedores(mpId, [{ fornecedorId: fornId, preferencial: true }]);
    }

    // Criar alguns produtos de exemplo por fábrica
    const produtosFab1 = [
      "Broa de Milho","Pão Rústico Mistura","Pão Rústico Trigo","Pão Trigo 450g",
      "Centeio 1Kg","Pão Aveia","Pão Multigrãos","Pão São","Pão Diabético","Pão Forma Shape",
      "Pão para Rabanadas","Pão triespelta","Pão Saloio","Courtons","Croissant Vegan"
    ];
    const produtosFab2 = [
      "Trigo da Serra","Broa de Milho da Serra","Centeio da Serra","Mistura da Serra","Cereais da Serra"
    ];
    const produtosFab3 = [
      "Tostas Mistura SG","Tostas Multicereais SG","Pão Forma Branco SG","Pão Forma Escuro SG",
      "Pão Forma 5 Sementes SG","Biscoitos Originais SG","Biscoitos Canela SG","Biscoitos Laranja SG",
      "Madalenas SG","Bolos de Arroz SG","Muffins Chocolate SG","Bolo Avó Mármore SG",
      "Almendrados SG","Grissinos Simples SG","Grissinos com Sésamo SG"
    ];

    for (const nome of produtosFab1) {
      await upsertProduto({ nome, fabricaId: fab1.id, gama: "Padaria Tradicional" });
    }
    for (const nome of produtosFab2) {
      await upsertProduto({ nome, fabricaId: fab2.id, gama: "Padaria Tradicional Granel" });
    }
    for (const nome of produtosFab3) {
      await upsertProduto({ nome, fabricaId: fab3.id, gama: "Sem Glúten" });
    }

    return {
      success: true,
      fornecedores: todosFornecedores.length,
      mpFab1: DADOS_FAB1.materiasPrimas.length,
      mpFab2: DADOS_FAB2.materiasPrimas.length,
      mpFab3: DADOS_FAB3.materiasPrimas.length,
      produtosFab1: produtosFab1.length,
      produtosFab2: produtosFab2.length,
      produtosFab3: produtosFab3.length,
    };
  }),
});
