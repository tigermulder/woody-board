export interface ApiResponse<T> {
	data: T;
}

export interface Column {
	id: string;
	title: string;
	order: number;
	created_at: string;
	cards: Card[];
}

export interface Card {
	id: string;
	column_id: string;
	title: string;
	description: string;
	due_date: string | null;
	order: number;
	created_at: string;
	updated_at: string;
}
