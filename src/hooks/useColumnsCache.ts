import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { ColumnType } from "@/types/api";

const columnsQueryKey = ["columns"] as const;

/**
 * columns 캐시 접근 유틸.
 * - queryKey 일관성
 * - get/set 함수 참조 고정
 */
export function useColumnsCache(fallback?: ColumnType[]) {
  const queryClient = useQueryClient();

  const getColumnsCache = useCallback((): ColumnType[] => {
    return (
      queryClient.getQueryData<ColumnType[]>(columnsQueryKey) ?? fallback ?? []
    );
  }, [queryClient, fallback]);

  const setColumnsCache = useCallback(
    (next: ColumnType[]) => {
      queryClient.setQueryData<ColumnType[]>(columnsQueryKey, next);
    },
    [queryClient]
  );

  return { columnsQueryKey, getColumnsCache, setColumnsCache };
}
