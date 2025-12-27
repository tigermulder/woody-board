import type { ColumnType } from "@/types/api.ts";

export function Column({ column }: { column: ColumnType }) {
	return (
		<div className="flex w-80 shrink-0 flex-col gap-4 rounded-xl bg-slate-100/50 p-4 dark:bg-slate-900/50">
			{/* 컬럼 헤더: 제목과 카드 개수 표시 */}
			<div className="flex items-center justify-between px-1">
				<h3 className="font-bold text-foreground text-lg">{column.title}</h3>
				<span className="rounded-full bg-slate-200 px-2 py-0.5 font-semibold text-slate-600 text-xs dark:bg-slate-800 dark:text-slate-400">
					{column.cards.length}
				</span>
			</div>

			{/* 카드 추가 버튼 */}
			<button
				type="button"
				className="mt-2 flex w-full items-center justify-center rounded-lg py-2 font-medium text-muted-foreground text-sm transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-800"
			>
				+ 카드 추가
			</button>
		</div>
	);
}
