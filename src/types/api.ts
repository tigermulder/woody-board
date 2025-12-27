export interface ApiResponse<T> {
	data: T;
}

export interface ColumnType {
	id: string;
	title: string;
	order: number;
	created_at: string;
	cards: CardType[];
}

export interface CardType {
	id: string;
	column_id: string;
	title: string;
	description: string;
	due_date: string | null;
	order: number;
	created_at: string;
	updated_at: string;
}
