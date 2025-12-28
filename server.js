import { watch } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { v4 as uuidv4 } from "uuid";

const require = createRequire(import.meta.url);

// 패키지 명을 명확히 하여 require로 가져옵니다.
const jsonServer = require("json-server");

// 이후 코드는 기존과 동일하게 사용 가능합니다.
const server = jsonServer.create();
let router = jsonServer.router("db.json");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = resolve(__dirname, "db.json");

server.use(jsonServer.defaults());
// --- 공통 응답 포맷 미들웨어 ---
server.use(jsonServer.bodyParser);

server.use((_req, _res, next) => {
	// 네트워크 지연 시뮬레이션
	const delay = Math.floor(Math.random() * 300) + 200;

	setTimeout(next, delay);
});

server.use((_req, res, next) => {
	const originalJson = res.json.bind(res);
	res.json = (data) => {
		if (data && (data.data || data.error)) return originalJson(data);

		if (res.statusCode >= 400) {
			return originalJson({
				error: {
					code: data?.code || `ERR_${res.statusCode}`,
					message: data?.message || "요청 처리 중 에러가 발생했습니다.",
				},
			});
		}
		return originalJson({ data });
	};
	next();
});

// --- snake_case -> camelCase 마이그레이션/정규화 ---
const toIsoOrNull = (value) => {
	if (!value) return null;
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const normalizeColumn = (column) => {
	const createdAt = column.createdAt ?? column.created_at ?? null;
	return {
		...column,
		createdAt: toIsoOrNull(createdAt) ?? new Date().toISOString(),
	};
};

const normalizeCard = (card) => {
	const now = new Date().toISOString();
	const createdAt = card.createdAt ?? card.created_at ?? now;
	const updatedAt = card.updatedAt ?? card.updated_at ?? createdAt ?? now;
	const dueDate = card.dueDate ?? card.due_date ?? null;
	const columnId = card.columnId ?? card.column_id;

	return {
		...card,
		columnId,
		dueDate: toIsoOrNull(dueDate),
		createdAt: toIsoOrNull(createdAt) ?? now,
		updatedAt: toIsoOrNull(updatedAt) ?? toIsoOrNull(createdAt) ?? now,
	};
};

const migrateDbToCamelCase = () => {
	const db = router.db;

	const columns = db.get("columns").value();
	const migratedColumns = columns.map((c) => {
		const next = normalizeColumn(c);
		// snake 키 제거
		delete next.created_at;
		return next;
	});

	const cards = db.get("cards").value();
	const migratedCards = cards.map((c) => {
		const next = normalizeCard(c);
		delete next.created_at;
		delete next.updated_at;
		delete next.due_date;
		delete next.column_id;
		return next;
	});

	db.set("columns", migratedColumns).write();
	db.set("cards", migratedCards).write();
};

migrateDbToCamelCase();

// --- API 스펙 ---

// 컬럼 조회
server.get("/api/columns", (_req, res) => {
	const db = router.db;

	// 모든 컬럼
	const columns = db
		.get("columns")
		.sortBy("order")
		.value()
		.map(normalizeColumn);

	// 각 컬럼에 속해 있는 카드를 찾아 매핑
	const data = columns.map((column) => {
		const cards = db
			.get("cards")
			.filter({ columnId: column.id })
			.sortBy("order")
			.value()
			.map(normalizeCard);

		return {
			...column,
			cards: cards,
		};
	});

	res.status(200).json(data);
});

// 컬럼 생성
server.post("/api/columns", (req, res) => {
	const { title } = req.body;
	const db = router.db;

	// 유효성 검사
	if (!title || title.trim() === "") {
		return res.status(400).json({
			error: {
				code: "VALIDATION_ERROR",
				message: "컬럼 제목은 필수입니다.",
			},
		});
	}

	// 마지막 order 값 계산
	const lastColumn = db.get("columns").sortBy("order").last().value();

	const newOrder = lastColumn ? lastColumn.order + 1 : 0;

	// data meta
	const newColumn = {
		id: uuidv4(), // UUID
		title: title,
		order: newOrder,
		createdAt: new Date().toISOString(),
	};

	// DB 저장
	db.get("columns").push(newColumn).write();

	res.status(201).json(newColumn);
});

// 컬럼 수정
server.patch("/api/columns/:id", (req, res) => {
	const { id } = req.params;
	const { title } = req.body;
	const db = router.db;

	// 해당 컬럼이 존재하는지 확인
	const column = db.get("columns").find({ id }).value();

	if (!column) {
		return res.status(404).json({
			error: {
				code: "NOT_FOUND",
				message: "해당 컬럼을 찾을 수 없습니다.",
			},
		});
	}

	// DB 반영
	const updatedColumn = db
		.get("columns")
		.find({ id })
		.assign({ title: title || column.title })
		.write();

	res.status(200).json(normalizeColumn(updatedColumn));
});

// 컬럼 삭제
server.delete("/api/columns/:id", (req, res) => {
	const { id } = req.params;
	const db = router.db;

	// 해당 컬럼이 존재하는지 확인
	const column = db.get("columns").find({ id }).value();
	if (!column) {
		return res.status(404).json({
			error: {
				code: "NOT_FOUND",
				message: "삭제할 컬럼을 찾을 수 없습니다.",
			},
		});
	}

	// 컬럼에 속한 카드 개수 확인
	const deletedCardsCount = db
		.get("cards")
		.filter({ columnId: id })
		.value().length;

	// 관련 카드 일괄 삭제
	db.get("cards").remove({ columnId: id }).write();

	// 컬럼 삭제 실행
	db.get("columns").remove({ id }).write();

	res.status(200).json({
		success: true,
		deleted_cards_count: deletedCardsCount,
	});
});

// 카드 생성
server.post("/api/cards", (req, res) => {
	const { columnId, column_id, title, description, dueDate, due_date } =
		req.body;
	const resolvedColumnId = columnId ?? column_id;
	const resolvedDueDate = dueDate ?? due_date;
	const db = router.db;

	// 유효성 검사
	if (!title || title.length > 100) {
		return res.status(400).json({
			error: {
				code: "VALIDATION_ERROR",
				message: "카드 제목은 1~100자 이내로 입력해주세요.",
			},
		});
	}

	// 마지막 order 값 계산
	const lastCard = db
		.get("cards")
		.filter({ columnId: resolvedColumnId })
		.sortBy("order")
		.last()
		.value();

	const newOrder = lastCard ? lastCard.order + 1 : 0;

	// data meta
	const now = new Date().toISOString();
	const newCard = {
		id: uuidv4(), // UUID
		columnId: resolvedColumnId,
		title,
		description: description || "",
		dueDate: resolvedDueDate || null,
		order: newOrder,
		createdAt: now,
		updatedAt: now,
	};

	// DB 저장
	db.get("cards").push(newCard).write();

	res.status(201).json(normalizeCard(newCard));
});

// 카드 수정
server.patch("/api/cards/:id", (req, res) => {
	const { id } = req.params;
	const { title, description, dueDate, due_date } = req.body;
	const resolvedDueDate = dueDate ?? due_date;
	const db = router.db;

	// 수정할 카드가 존재하는지 확인
	const card = db.get("cards").find({ id }).value();
	if (!card) {
		return res.status(404).json({
			error: { code: "NOT_FOUND", message: "해당 카드를 찾을 수 없습니다." },
		});
	}

	// 데이터 업데이트
	const updatedCard = db
		.get("cards")
		.find({ id })
		.assign({
			// 값이 전달된 경우에만 업데이트, 없으면 기존 값 유지
			title: title !== undefined ? title : card.title,
			description: description !== undefined ? description : card.description,
			dueDate: resolvedDueDate !== undefined ? resolvedDueDate : card.dueDate,
			updatedAt: new Date().toISOString(),
		})
		.write();

	res.status(200).json(normalizeCard(updatedCard));
});

// 카드 삭제
server.delete("/api/cards/:id", (req, res) => {
	const { id } = req.params;
	const db = router.db;

	// 해당 카드가 존재하는지 확인
	const card = db.get("cards").find({ id }).value();
	if (!card) {
		return res.status(404).json({
			error: { code: "NOT_FOUND", message: "삭제할 카드를 찾을 수 없습니다." },
		});
	}

	// DB에서 카드 삭제
	db.get("cards").remove({ id }).write();

	res.status(200).json({
		success: true,
	});
});

// 카드 이동 및 순서 변경
server.patch("/api/cards/:id/move", (req, res) => {
	const { id } = req.params;
	const { target_column_id, new_order, targetColumnId, newOrder } = req.body;
	const resolvedTargetColumnId = targetColumnId ?? target_column_id;
	const resolvedNewOrder = newOrder ?? new_order;
	const db = router.db;

	const card = db.get("cards").find({ id }).value();
	if (!card)
		return res.status(404).json({ message: "카드를 찾을 수 없습니다." });

	// 이동 로직
	const updatedCard = db
		.get("cards")
		.find({ id })
		.assign({
			columnId: resolvedTargetColumnId,
			order: resolvedNewOrder,
			updatedAt: new Date().toISOString(),
		})
		.write();

	res.status(200).json(normalizeCard(updatedCard));
});

// --- 기본 라우터 ---
server.use("/api", router);

// --- DB Watch & Hot Reload ---
let watchTimeout;
watch(dbPath, (eventType) => {
	if (eventType === "change") {
		clearTimeout(watchTimeout);
		watchTimeout = setTimeout(() => {
			router = jsonServer.router(dbPath);
			console.log("Re-loaded db.json");
		}, 100);
	}
});

const PORT = 4000;
server.listen(PORT, () => {
	console.log(`JSON 서버가 http://localhost:${PORT}/api 에서 실행 중입니다`);
});
