import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import MateriasPrimas from "./pages/MateriasPrimas";
import Fornecedores from "./pages/Fornecedores";
import FichasTecnicas from "./pages/FichasTecnicas";
import Receitas from "./pages/Receitas";
import Produtos from "./pages/Produtos";
import Sequenciamento from "./pages/Sequenciamento";
import FichasProduto from "./pages/FichasProduto";
import Historico from "./pages/Historico";
import Importacao from "./pages/Importacao";
import Fabricas from "./pages/Fabricas";
import Rececoes from "./pages/Rececoes";
import Utilizadores from "./pages/Utilizadores";
import Notificacoes from "./pages/Notificacoes";
import { useAuth } from "./_core/hooks/useAuth";
import AcessoPin from "./pages/AcessoPin";

function QualidadeRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === "logistica") return <Redirect to="/rececoes" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <QualidadeRoute component={Dashboard} />} />
      <Route path="/fabricas" component={() => <QualidadeRoute component={Fabricas} />} />
      <Route path="/materias-primas" component={() => <QualidadeRoute component={MateriasPrimas} />} />
      <Route path="/fornecedores" component={() => <QualidadeRoute component={Fornecedores} />} />
      <Route path="/fichas-tecnicas" component={() => <QualidadeRoute component={FichasTecnicas} />} />
      <Route path="/receitas" component={() => <QualidadeRoute component={Receitas} />} />
      <Route path="/produtos" component={() => <QualidadeRoute component={Produtos} />} />
      <Route path="/sequenciamento" component={() => <QualidadeRoute component={Sequenciamento} />} />
      <Route path="/rececoes" component={Rececoes} />
      <Route path="/fichas-produto" component={() => <QualidadeRoute component={FichasProduto} />} />
      <Route path="/historico" component={() => <QualidadeRoute component={Historico} />} />
      <Route path="/notificacoes" component={() => <QualidadeRoute component={Notificacoes} />} />
      <Route path="/importacao" component={() => <QualidadeRoute component={Importacao} />} />
      <Route path="/utilizadores" component={() => <QualidadeRoute component={Utilizadores} />} />
      <Route path="/configuracoes" component={() => <QualidadeRoute component={Utilizadores} />} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppAccessGate() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">A verificar acesso...</div>;
  return isAuthenticated ? <Router /> : <AcessoPin />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <AppAccessGate />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
