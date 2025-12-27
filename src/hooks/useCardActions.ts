import { useMutation, useQueryClient } from "@tanstack/react-query";
import { kanbanApi } from "@/api/kanban";
import type { CardType } from "@/types/api";

export const useCardActions = () => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["columns"] });

  // 카드 생성
  const add = useMutation({
    mutationFn: kanbanApi.createCard,
    onSuccess: invalidate,
  });

  // 카드 수정
  const update = useMutation({
    mutationFn: ({ id, params }: { id: string; params: Partial<CardType> }) =>
      kanbanApi.updateCard(id, params),
    onSuccess: invalidate,
  });

  // 카드 삭제
  const remove = useMutation({
    mutationFn: kanbanApi.deleteCard,
    onSuccess: invalidate,
  });

  // 카드 이동
  const move = useMutation({
    mutationFn: ({
      id,
      columnId,
      order,
    }: {
      id: string;
      columnId: string;
      order: number;
    }) => kanbanApi.moveCard(id, columnId, order),
    onSuccess: invalidate,
  });

  return { add, update, remove, move };
};
