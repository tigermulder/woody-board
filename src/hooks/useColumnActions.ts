import { useMutation, useQueryClient } from "@tanstack/react-query";
import { kanbanApi } from "@/api/kanban";

export const useColumnActions = () => {
	const queryClient = useQueryClient();
	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: ["columns"] });

	// 컬럼 생성
	const add = useMutation({
		mutationFn: kanbanApi.createColumn,
		onSuccess: invalidate,
	});

	// 컬럼 수정
	const update = useMutation({
		mutationFn: ({ id, title }: { id: string; title: string }) =>
			kanbanApi.updateColumn(id, title),
		onSuccess: invalidate,
	});

	// 컬럼 삭제
	const remove = useMutation({
		mutationFn: kanbanApi.deleteColumn,
		onSuccess: invalidate,
	});

	return { add, update, remove };
};
