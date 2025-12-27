import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ColumnType } from "@/types/api.ts";

const columnBgColors: Record<string, string> = {
	"To Do": "bg-slate-200/70 dark:bg-slate-800/70",
	"In Progress": "bg-blue-100 dark:bg-blue-900/40",
	Done: "bg-emerald-100 dark:bg-emerald-900/40",
};

export function Column({ column }: { column: ColumnType }) {
	// 매칭되는 게 없으면 기본 색상 적용
	const bgColor =
		columnBgColors[column.title] || "bg-slate-100/50 dark:bg-slate-900/50";

	return (
		<div
			className={cn(
				"flex w-80 shrink-0 flex-col gap-4 rounded-xl p-4 transition-colors",
				"cursor-grab active:cursor-grabbing",
				bgColor,
			)}
		>
			{/* 컬럼 헤더 */}
			<div className="flex items-center justify-between px-1">
				<h3 className="font-bold text-foreground text-lg">{column.title}</h3>
				{/* 컬럼 액션 메뉴 */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 cursor-pointer"
						>
							<MoreHorizontal className="h-4 w-4" />
							<span className="sr-only">컬럼 메뉴</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-30">
						<DropdownMenuItem className="cursor-pointer gap-2">
							Edit
							<DropdownMenuShortcut>
								<Pencil className="h-3.5 w-3.5 opacity-70" />
							</DropdownMenuShortcut>
						</DropdownMenuItem>
						<DropdownMenuItem className="cursor-pointer gap-2 text-destructive focus:text-destructive">
							Delete
							<DropdownMenuShortcut>
								<Trash2 className="h-3.5 w-3.5 opacity-70" />
							</DropdownMenuShortcut>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* 카드 리스트 (ScrollArea 적용 예정 구역) */}
			<div className="flex flex-col gap-3">
				{/* 카드들이 들어갈 자리입니다. */}
			</div>

			{/* 카드 추가 버튼 */}
			<Button
				variant="ghost"
				className="justify-start gap-2 text-muted-foreground hover:bg-background/50"
				size="sm"
			>
				<span className="text-xl">+</span> 카드 추가
			</Button>
		</div>
	);
}
