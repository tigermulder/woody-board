import { Button } from "@/components/ui";

export function Board() {
	return (
		<div className="scrollbar-hide flex h-full w-full gap-6 overflow-x-auto p-6">
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
