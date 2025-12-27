import { Board } from "@/components/kanban";
import { Header } from "@/components/layout/Header";

function App() {
	return (
		<div className="flex h-screen flex-col">
			<Header />
			<Board />
		</div>
	);
}

export default App;
