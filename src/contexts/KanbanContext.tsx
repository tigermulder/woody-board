import { createContext, useContext, useState } from "react";

interface KanbanState {
  activeId: string | null; // 드래그 중인 카드
  selectedCardId: string | null; // 상세 패널을 연 카드
}

interface KanbanDispatch {
  setActiveId: (id: string | null) => void;
  setSelectedCardId: (id: string | null) => void;
}

const KanbanStateContext = createContext<KanbanState | null>(null);
const KanbanDispatchContext = createContext<KanbanDispatch | null>(null);

export function KanbanProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const state: KanbanState = { activeId, selectedCardId };
  const dispatch: KanbanDispatch = { setActiveId, setSelectedCardId };

  return (
    <KanbanStateContext.Provider value={state}>
      <KanbanDispatchContext.Provider value={dispatch}>
        {children}
      </KanbanDispatchContext.Provider>
    </KanbanStateContext.Provider>
  );
}

// Getter 커스텀 훅
export function useKanbanState() {
  const context = useContext(KanbanStateContext);
  if (context === null) {
    throw new Error(
      "useKanbanState는 KanbanProvider 안에서만 사용할 수 있습니다."
    );
  }
  return context;
}

export function useKanbanDispatch() {
  const context = useContext(KanbanDispatchContext);
  if (context === null) {
    throw new Error(
      "useKanbanDispatch는 KanbanProvider 안에서만 사용할 수 있습니다."
    );
  }
  return context;
}
