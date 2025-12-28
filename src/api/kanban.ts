import { axiosInstance } from "@/lib/axiosInstance";
import type { ApiSuccess, CardType, ColumnType } from "@/types/api";

export const kanbanApi = {
	// --- 컬럼 관련 API ---

	// 컬럼 전체 조회
	getColumns: async () => {
		return await axiosInstance.get<ApiSuccess<ColumnType[]>, ColumnType[]>(
			"/columns",
		);
	},

	// 컬럼 생성
	createColumn: async (title: string) => {
		return await axiosInstance.post<ApiSuccess<ColumnType>, ColumnType>(
			"/columns",
			{
				title,
			},
		);
	},

	// 컬럼 수정
	updateColumn: async (id: string, title: string) => {
		return await axiosInstance.patch<ApiSuccess<ColumnType>, ColumnType>(
			`/columns/${id}`,
			{
				title,
			},
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
		columnId: string;
		title: string;
		description?: string;
		dueDate?: string | null;
	}) => {
		return await axiosInstance.post<ApiSuccess<CardType>, CardType>(
			"/cards",
			params,
		);
	},

	// 카드 수정
	updateCard: async (
		id: string,
		params: Partial<Pick<CardType, "title" | "description" | "dueDate">>,
	) => {
		return await axiosInstance.patch<ApiSuccess<CardType>, CardType>(
			`/cards/${id}`,
			params,
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
	moveCard: async (id: string, targetColumnId: string, newOrder: number) => {
		return await axiosInstance.patch<ApiSuccess<CardType>, CardType>(
			`/cards/${id}/move`,
			{
				targetColumnId,
				newOrder,
			},
		);
	},
};
