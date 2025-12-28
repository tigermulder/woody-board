import { Board } from "@/components/kanban";
import { GlobalQueryLoadingBar } from "@/components/layout/GlobalQueryLoadingBar";
import { Header } from "@/components/layout/Header";
import { Toaster } from "@/components/ui";

function App() {
  return (
    <div className="flex h-screen flex-col">
      <GlobalQueryLoadingBar />
      <Header />
      <Board />
      <Toaster richColors duration={2500} position="top-center" />
    </div>
  );
}

export default App;
