import { createContext, useContext, useState } from "react";

// Context 생성
const KanbanStateContext = createContext<string | null>(null);
const KanbanDispatchContext = createContext<
	((id: string | null) => void) | null
>(null);

export function KanbanProvider({ children }: { children: React.ReactNode }) {
	const [activeId, setActiveId] = useState<string | null>(null);

	return (
		<KanbanStateContext.Provider value={activeId}>
			<KanbanDispatchContext.Provider value={setActiveId}>
				{children}
			</KanbanDispatchContext.Provider>
		</KanbanStateContext.Provider>
	);
}

// Getter 커스텀 훅
export function useKanbanState() {
	const context = useContext(KanbanStateContext);
	return context;
}

// Setter 커스텀 훅
export function useKanbanDispatch() {
	const context = useContext(KanbanDispatchContext);
	if (context === null) {
		throw new Error(
			"useKanbanDispatch는 KanbanProvider 안에서만 사용할 수 있습니다.",
		);
	}
	return context;
}
