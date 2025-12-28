import { useQuery } from "@tanstack/react-query";
import { kanbanApi } from "@/api/kanban";
import type { ApiError, ColumnType } from "@/types/api";

export const useColumns = () => {
  return useQuery<ColumnType[], ApiError>({
    queryKey: ["columns"],
    queryFn: kanbanApi.getColumns,
    staleTime: Infinity, // 사용자의 serverAction전까지는 자동갱신 X
    refetchOnWindowFocus: false, // 윈도우 포커스 시 자동갱신 X
    gcTime: 1000 * 60 * 60, // 1시간동안 gc에 보관
    retry: false, // 네트워크 에러는 화면에서 "재시도" 버튼으로 제어
  });
};
