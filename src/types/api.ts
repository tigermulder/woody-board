export interface ApiSuccess<T> {
	data: T;
}

export interface ApiError {
	code: string;
	message: string;
}

export interface ApiErrorResponse {
	error: ApiError;
}

export interface ColumnType {
	id: string;
	title: string;
	order: number;
	createdAt: string;
	cards: CardType[];
}

export interface CardType {
	id: string;
	columnId: string;
	title: string;
	description: string;
	dueDate: string | null;
	order: number;
	createdAt: string;
	updatedAt: string;
}
