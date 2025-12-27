import { axiosInstance } from "@/lib/axiosInstance";
import type { ApiSuccess, CardType, ColumnType } from "@/types/api";

export const kanbanApi = {
  // --- 컬럼 관련 API ---

  // 컬럼 전체 조회
  getColumns: async () => {
    return await axiosInstance.get<ApiSuccess<ColumnType[]>, ColumnType[]>(
      "/columns"
    );
  },

  // 컬럼 생성
  createColumn: async (title: string) => {
    return await axiosInstance.post<ApiSuccess<ColumnType>, ColumnType>(
      "/columns",
      {
        title,
      }
    );
  },

  // 컬럼 수정
  updateColumn: async (id: string, title: string) => {
    return await axiosInstance.patch<ApiSuccess<ColumnType>, ColumnType>(
      `/columns/${id}`,
      {
        title,
      }
    );
  },

  // 컬럼 삭제
  deleteColumn: async (id: string) => {
    return await axiosInstance.delete<
      ApiSuccess<{ success: boolean; deleted_cards_count: number }>,
      { success: boolean; deleted_cards_count: number }
    >(`/columns/${id}`);
  },

  // --- 카드 관련 API ---

  // 카드 생성
  createCard: async (params: {
    column_id: string;
    title: string;
    description?: string;
  }) => {
    return await axiosInstance.post<ApiSuccess<CardType>, CardType>(
      "/cards",
      params
    );
  },

  // 카드 수정
  updateCard: async (
    id: string,
    params: Partial<Pick<CardType, "title" | "description" | "due_date">>
  ) => {
    return await axiosInstance.patch<ApiSuccess<CardType>, CardType>(
      `/cards/${id}`,
      params
    );
  },

  // 카드 삭제
  deleteCard: async (id: string) => {
    return await axiosInstance.delete<
      ApiSuccess<{ success: boolean }>,
      { success: boolean }
    >(`/cards/${id}`);
  },

  // 카드 이동 및 순서 변경
  moveCard: async (id: string, target_column_id: string, new_order: number) => {
    return await axiosInstance.patch<ApiSuccess<CardType>, CardType>(
      `/cards/${id}/move`,
      {
        target_column_id,
        new_order,
      }
    );
  },
};
