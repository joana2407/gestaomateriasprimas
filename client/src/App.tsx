import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/fabricas" component={Fabricas} />
      <Route path="/materias-primas" component={MateriasPrimas} />
      <Route path="/fornecedores" component={Fornecedores} />
      <Route path="/fichas-tecnicas" component={FichasTecnicas} />
      <Route path="/receitas" component={Receitas} />
      <Route path="/produtos" component={Produtos} />
      <Route path="/sequenciamento" component={Sequenciamento} />
      <Route path="/rececoes" component={Rececoes} />
      <Route path="/fichas-produto" component={FichasProduto} />
      <Route path="/historico" component={Historico} />
      <Route path="/importacao" component={Importacao} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
