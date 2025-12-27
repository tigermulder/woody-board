import { GripVerticalIcon } from "lucide-react";
import type * as React from "react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/lib/utils";

function ResizablePanelGroup({
	direction,
	orientation,
	className,
	...props
}: React.ComponentProps<typeof ResizablePrimitive.Group> & {
	direction?: "horizontal" | "vertical";
}) {
	const resolvedOrientation = orientation ?? direction;
	return (
		<ResizablePrimitive.Group
			data-slot="resizable-panel-group"
			className={cn(
				"flex h-full w-full",
				resolvedOrientation === "vertical" && "flex-col",
				className,
			)}
			orientation={resolvedOrientation}
			{...props}
		/>
	);
}

function ResizablePanel({
	...props
}: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
	return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

function ResizableHandle({
	withHandle,
	className,
	...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
	withHandle?: boolean;
}) {
	return (
		<ResizablePrimitive.Separator
			data-slot="resizable-handle"
			className={cn(
				"relative flex items-center justify-center bg-border focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 aria-[orientation=horizontal]:h-px aria-[orientation=vertical]:h-full aria-[orientation=horizontal]:w-full aria-[orientation=vertical]:w-px",
				className,
			)}
			{...props}
		>
			{withHandle && (
				<div className="z-10 flex h-4 w-3 items-center justify-center rounded-xs border bg-border">
					<GripVerticalIcon className="size-2.5" />
				</div>
			)}
		</ResizablePrimitive.Separator>
	);
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
