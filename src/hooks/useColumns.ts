import { useQuery } from "@tanstack/react-query";
import { kanbanApi } from "@/api/kanban";
import type { ApiError, ColumnType } from "@/types/api";

type UseColumnsOptions = {
	/** 드래그 중(낙관적 캐시 조작)에는 refetch를 잠시 중지 */
	pauseRefetch?: boolean;
};

export const useColumns = (options?: UseColumnsOptions) => {
	const pauseRefetch = options?.pauseRefetch ?? false;

	return useQuery<ColumnType[], ApiError>({
		queryKey: ["columns"],
		queryFn: kanbanApi.getColumns,
		// 멀티유저: 외부 변경 반영을 위해 포커스/재연결 refetch + 폴링 사용
		staleTime: 5_000,
		refetchOnWindowFocus: !pauseRefetch,
		refetchOnReconnect: !pauseRefetch,
		// 에러 상태에서는 "재시도" 버튼으로만 제어
		refetchInterval: (query) => {
			if (pauseRefetch) return false;
			if (query.state.status === "error") return false;
			return 15_000;
		},
		gcTime: 1000 * 60 * 30, // 30분동안 gc에 보관
		retry: false, // 네트워크 에러는 화면에서 "재시도" 버튼으로 제어
	});
};
