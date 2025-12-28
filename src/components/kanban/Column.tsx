import { useDroppable } from "@dnd-kit/core";
import {
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { CardAddSheet } from "@/components/kanban/CardAddSheet";
import { CardItem } from "@/components/kanban/CardItem";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
	Input,
	Sheet,
	SheetTrigger,
} from "@/components/ui";
import { useKanbanState } from "@/contexts/KanbanContext";
import { useCardActions } from "@/hooks/useCardActions";
import { useColumnActions } from "@/hooks/useColumnActions";
import { cn } from "@/lib/utils";
import type { ApiError, ColumnType } from "@/types/api.ts";

// Zod 스키마 정의
const cardFormSchema = z.object({
	title: z
		.string()
		.min(1, "제목은 필수입니다.")
		.max(100, "제목은 100자 이내여야 합니다."),
	description: z.string().optional(),
	dueDate: z.string().nullable().optional(),
});

export type CardFormValues = z.infer<typeof cardFormSchema>;

const columnBgColors: Record<string, string> = {
	"To Do": "bg-slate-200/70 dark:bg-slate-800/70",
	"In Progress": "bg-blue-100 dark:bg-blue-900/40",
	Done: "bg-emerald-100 dark:bg-emerald-900/40",
};

export function Column({ column }: { column: ColumnType }) {
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [addSheetOpen, setAddSheetOpen] = useState(false);
	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [draftTitle, setDraftTitle] = useState(column.title);
	const titleInputRef = useRef<HTMLInputElement>(null);
	const ignoreNextBlurRef = useRef(false);
	const { activeId } = useKanbanState();
	const isDraggingAnyCard = Boolean(activeId);

	const { remove, update } = useColumnActions();
	const { add } = useCardActions();

	// React Hook Form 초기화
	const form = useForm<CardFormValues>({
		resolver: zodResolver(cardFormSchema),
		defaultValues: {
			title: "",
			description: "",
			dueDate: "",
		},
	});

	const bgColor =
		columnBgColors[column.title] || "bg-slate-100/50 dark:bg-slate-900/50";

	const { setNodeRef, isOver } = useDroppable({
		id: column.id,
	});

	useLayoutEffect(() => {
		if (!isEditingTitle) return;
		titleInputRef.current?.focus();
		titleInputRef.current?.select();
	}, [isEditingTitle]);

	const startEditTitle = () => {
		setDraftTitle(column.title);
		setIsEditingTitle(true);
	};

	const cancelEditTitle = () => {
		setDraftTitle(column.title);
		setIsEditingTitle(false);
	};

	const commitEditTitle = async () => {
		const nextTitle = draftTitle.trim();
		if (!nextTitle) {
			toast.error("제목은 필수입니다.");
			titleInputRef.current?.focus();
			return;
		}
		if (nextTitle === column.title) {
			setIsEditingTitle(false);
			return;
		}

		const promise = update.mutateAsync({ id: column.id, title: nextTitle });
		toast.promise(promise, {
			loading: "컬럼 수정 중...",
			success: () => {
				setIsEditingTitle(false);
				return "컬럼이 수정되었습니다.";
			},
			error: (error) => (error as ApiError)?.message,
		});
	};

	// 컬럼 삭제 핸들러
	const handleDelete = () => {
		const promise = remove.mutateAsync(column.id);
		toast.promise(promise, {
			loading: "컬럼 삭제 중...",
			success: (data) => {
				setDeleteDialogOpen(false);
				const deletedCardsCount = data?.deleted_cards_count ?? null;
				return deletedCardsCount === null
					? "컬럼이 삭제되었습니다."
					: `컬럼이 삭제되었습니다. (카드 ${deletedCardsCount}개 포함)`;
			},
			error: (error) => (error as ApiError)?.message,
		});
	};

	// 카드 생성 핸들러
	const onSubmit = (values: CardFormValues) => {
		const promise = add.mutateAsync({
			columnId: column.id,
			title: values.title,
			description: values.description?.trim() || "",
			dueDate: values.dueDate || null,
		});

		toast.promise(promise, {
			loading: "카드 추가 중...",
			success: () => {
				setAddSheetOpen(false);
				form.reset(); // 폼 초기화
				return "카드가 추가되었습니다.";
			},
			error: (error) => (error as ApiError)?.message,
		});
	};

	return (
		<div
			className={cn(
				"flex w-80 shrink-0 flex-col gap-4 rounded-xl p-4",
				bgColor,
			)}
		>
			{/* 컬럼 헤더 */}
			<div className="flex items-center justify-between px-1">
				{isEditingTitle ? (
					<Input
						ref={titleInputRef}
						disabled={update.isPending || remove.isPending}
						value={draftTitle}
						onChange={(e) => setDraftTitle(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								void commitEditTitle();
							}
							if (e.key === "Escape") {
								e.preventDefault();
								ignoreNextBlurRef.current = true;
								cancelEditTitle();
							}
						}}
						onBlur={() => {
							if (ignoreNextBlurRef.current) {
								ignoreNextBlurRef.current = false;
								return;
							}
							void commitEditTitle();
						}}
						className="h-9 font-bold text-foreground text-lg"
					/>
				) : (
					<button
						type="button"
						className="truncate text-left font-bold text-foreground text-lg"
						disabled={update.isPending || remove.isPending}
						onClick={startEditTitle}
						title="클릭해서 제목 수정"
					>
						{column.title}
					</button>
				)}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 cursor-pointer"
						>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-32">
						<DropdownMenuItem
							className="cursor-pointer"
							disabled={update.isPending || remove.isPending}
							onClick={startEditTitle}
						>
							Edit{" "}
							<DropdownMenuShortcut>
								<Pencil className="h-3.5 w-3.5" />
							</DropdownMenuShortcut>
						</DropdownMenuItem>
						<DropdownMenuItem
							className="cursor-pointer text-destructive focus:text-destructive"
							onClick={() => setDeleteDialogOpen(true)}
						>
							Delete{" "}
							<DropdownMenuShortcut>
								<Trash2 className="h-3.5 w-3.5" />
							</DropdownMenuShortcut>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* 컬럼 삭제 알럿 */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent className="overflow-hidden p-0 sm:max-w-[480px]">
					<div className="flex gap-4 p-6">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
							<Trash2 className="h-5 w-5" />
						</div>
						<div>
							<AlertDialogHeader className="text-left">
								<AlertDialogTitle>컬럼을 삭제할까요?</AlertDialogTitle>
								<AlertDialogDescription>
									<span className="font-semibold text-foreground">
										{column.title}
									</span>{" "}
									내의 모든 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
								</AlertDialogDescription>
							</AlertDialogHeader>
						</div>
					</div>
					<AlertDialogFooter className="bg-muted/40 p-4 px-6">
						<AlertDialogCancel disabled={remove.isPending}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={remove.isPending}
							className="bg-destructive text-white hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* 카드 리스트 */}
			<div
				ref={setNodeRef}
				className={cn(
					"flex min-h-20 flex-col gap-3 rounded-lg transition-colors",
					isDraggingAnyCard && "outline-1 outline-primary/15",
					isOver && "bg-primary/5 outline-2 outline-primary/35",
				)}
			>
				<SortableContext
					items={column.cards.map((c) => c.id)}
					strategy={verticalListSortingStrategy}
				>
					{column.cards.map((card) => (
						<CardItem key={card.id} card={card} />
					))}
				</SortableContext>

				{column.cards.length === 0 && (
					<div
						className={cn(
							"flex h-20 items-center justify-center rounded-lg border-2 border-muted-foreground/10 border-dashed text-muted-foreground text-xs transition-colors",
							isOver && "border-primary/40 text-foreground/70",
						)}
					>
						카드를 추가해보세요
					</div>
				)}
			</div>

			{/* 카드 추가 */}
			<Sheet
				open={addSheetOpen}
				onOpenChange={(open) => {
					if (!open) form.reset(); // 닫힐 때 폼 초기화
					setAddSheetOpen(open);
				}}
			>
				<SheetTrigger asChild>
					<Button
						variant="ghost"
						className="justify-start gap-2 text-muted-foreground"
						size="sm"
					>
						<span className="text-xl">+</span> 카드 추가
					</Button>
				</SheetTrigger>
				<CardAddSheet
					form={form}
					onSubmit={onSubmit}
					isPending={add.isPending}
					onCancel={() => setAddSheetOpen(false)}
				/>
			</Sheet>
		</div>
	);
}
