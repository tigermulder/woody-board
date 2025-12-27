import { Column } from "@/components/kanban/Column";
import { Button, ScrollArea, ScrollBar } from "@/components/ui";
import { useColumns } from "@/hooks/useColumns";
import type { ColumnType } from "@/types/api";

export function Board() {
	const { data: columns, isLoading } = useColumns();
	if (isLoading) return <div>Loading...</div>;
	return (
		<ScrollArea className="h-[calc(100vh-80px)] w-full">
			<div className="flex h-full w-max gap-6 p-6">
				{columns?.map((column: ColumnType) => (
					<Column key={column.id} column={column} />
				))}

				{/* 새 컬럼 추가 버튼 */}
				<div className="h-fit w-80 shrink-0 rounded-xl border-2 border-dashed p-3 opacity-60 transition-opacity hover:opacity-100">
					<Button variant="ghost" className="h-20 w-full gap-2">
						<span className="text-xl">+</span>
						<span className="font-medium">컬럼 추가</span>
					</Button>
				</div>
			</div>

			<ScrollBar orientation="horizontal" className="h-2.5" />
		</ScrollArea>
	);
}
