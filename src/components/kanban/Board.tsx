import { Column } from "@/components/kanban/Column";
import { Button } from "@/components/ui";
import { useColumns } from "@/hooks/useColumns";
import type { ColumnType } from "@/types/api";

export function Board() {
	const { data: columns, isLoading } = useColumns();
	if (isLoading) return <div>Loading...</div>;
	return (
		<div className="scrollbar-hide flex h-full w-full gap-6 overflow-x-auto p-6">
			{columns?.map((column: ColumnType) => (
				<Column key={column.id} column={column} />
			))}
			{/* 새 컬럼 추가 버튼 */}
			<div className="w-80 shrink-0 rounded-xl border-2 p-3">
				<Button size="xl">
					<span className="text-xl">+</span>
					<span className="font-medium">컬럼 추가</span>
				</Button>
			</div>
		</div>
	);
}
