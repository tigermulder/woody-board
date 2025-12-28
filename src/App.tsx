import { Board } from "@/components/kanban";
import { Header } from "@/components/layout/Header";
import { Toaster } from "@/components/ui";

function App() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <Board />
      <Toaster richColors duration={2500} position="top-center" />
    </div>
  );
}

export default App;
