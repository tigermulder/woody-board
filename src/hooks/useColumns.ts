import { useQuery } from "@tanstack/react-query";
import { kanbanApi } from "@/api/kanban";

export const useColumns = () => {
  return useQuery({
    queryKey: ["columns"],
    queryFn: kanbanApi.getColumns,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
};
