import jsonServer from "json-server";
import { watch } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = resolve(__dirname, "db.json");

let router = jsonServer.router(dbPath);
const server = jsonServer.create();
const middlewares = jsonServer.defaults();

// --- 공통 응답 포맷 미들웨어 ---
server.use(jsonServer.bodyParser);
server.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    // 이미 규격화된 응답은 그대로 반환
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

// --- 커스텀 라우팅: API 스펙 ---

// 카드 생성 (POST /api/cards)
server.post("/api/cards", (req, res, next) => {
  const { column_id, title, description, due_date } = req.body;
  const db = router.db;

  // 1. 유효성 검사 (스펙 반영)
  if (!title || title.length > 100) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "카드 제목은 1~100자 이내로 입력해주세요.",
      },
    });
  }

  // 2. 해당 컬럼의 마지막 order 값 계산
  const lastCard = db
    .get("cards")
    .filter({ column_id })
    .sortBy("order")
    .last()
    .value();

  const newOrder = lastCard ? lastCard.order + 1 : 0;

  // 3. 데이터 구성
  const now = new Date().toISOString();
  const newCard = {
    id: `card_${Date.now()}`, // 간단한 ID 생성 (실제론 UUID 권장)
    column_id,
    title,
    description: description || "",
    due_date: due_date || null,
    order: newOrder,
    created_at: now,
    updated_at: now,
  };

  // 4. DB 저장 및 응답
  db.get("cards").push(newCard).write();

  res.status(201).json(newCard);
});

// 카드 이동 및 순서 변경 (PATCH /api/cards/:id/move)
server.patch("/api/cards/:id/move", (req, res) => {
  const { id } = req.params;
  const { target_column_id, new_order } = req.body;
  const db = router.db;

  const card = db.get("cards").find({ id }).value();
  if (!card)
    return res.status(404).json({ message: "카드를 찾을 수 없습니다." });

  // 이동 로직
  const updatedCard = db
    .get("cards")
    .find({ id })
    .assign({
      column_id: target_column_id,
      order: new_order,
      updated_at: new Date().toISOString(),
    })
    .write();

  res.status(200).json(updatedCard);
});

// 컬럼 삭제 시 관련 카드 일괄 삭제 (DELETE /api/columns/:id)
server.delete("/api/columns/:id", (req, res, next) => {
  const { id } = req.params;
  const db = router.db;

  // 삭제될 카드 개수 미리계산
  const deletedCardsCount = db
    .get("cards")
    .filter({ column_id: id })
    .value().length;

  // 카드 삭제
  db.get("cards").remove({ column_id: id }).write();

  // 컬럼 삭제는 기본 라우터에 맡김 (next 호출 시 {success: true} 응답을 위해 커스텀 처리)
  db.get("columns").remove({ id }).write();

  res.status(200).json({
    success: true,
    deleted_cards_count: deletedCardsCount,
  });
});

// --- 기본 라우터 연결 ---
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
  console.log(`JSON Server is running on http://localhost:${PORT}/api`);
});
