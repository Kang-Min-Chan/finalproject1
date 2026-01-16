import React, { useMemo, useState } from "react";
import Dropzone from "./components/Dropzone.jsx";
import ResultCard from "./components/ResultCard.jsx";

const BIN_MAP = {
  metal: "캔류 / 고철",
  plastic: "플라스틱",
  paper: "종이",
  cardboard: "종이박스",
  glass: "유리",
  trash: "일반쓰레기",
};

const LABEL_KO = {
  metal: "금속",
  plastic: "플라스틱",
  paper: "종이",
  cardboard: "종이박스",
  glass: "유리",
  trash: "일반쓰레기",
};

export default function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => !!file, [file]);

  const onPickFile = (picked) => {
    setResult(null);
    setFile(picked);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(picked);
    setPreviewUrl(url);
  };

  const resetAll = () => {
    setResult(null);
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
  };

  // ✅ Node(3001) /api/detect 로 요청 (Vite proxy로 /api → 3001)
  const callDetectApi = async () => {
    if (!file) throw new Error("파일이 없습니다.");

    const form = new FormData();
    // ✅ multer upload.single("image") 이므로 키는 image
    form.append("image", file);

    const res = await fetch("/api/detect", {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`서버 오류 (${res.status}) ${text}`);
    }

    const data = await res.json();

    // ✅ YOLO detections
    const dets = Array.isArray(data?.yolo?.detections) ? data.yolo.detections : [];

    // ✅ LLM JSON (gemini.js에서 JSON으로 내려주는 형태)
    // 예: data.llm = { category: "종이류", howto:[...], cautions:[...] }
    const llm = data?.llm && typeof data.llm === "object" ? data.llm : null;

    if (!dets.length) {
      return {
        category: llm?.category ?? "알 수 없음",
        bin: "확인 필요",
        confidence: 0,
        reasons: ["감지된 객체가 없어요."],
        howto: Array.isArray(llm?.howto) ? llm.howto : ["다른 각도/조명으로 다시 촬영해보세요."],
        cautions: Array.isArray(llm?.cautions) ? llm.cautions : [],
        raw: data,
      };
    }

    // ✅ 신뢰도 높은 순으로 정렬
    const sorted = [...dets].sort(
      (a, b) => (b.confidence ?? 0) - (a.confidence ?? 0)
    );

    // ✅ 중복 라벨 제거 (복합 쓰레기 판단)
    const uniqueLabels = [...new Set(sorted.map((d) => d.label).filter(Boolean))];
    const isMixed = uniqueLabels.length > 1;

    // ✅ 대표 라벨 = 최고 confidence
    const main = sorted[0];
    const mainLabel = main?.label ?? "unknown";
    const mainConf = Number(main?.confidence ?? 0);

    // ✅ LLM에서 howto/cautions를 분리해서 받기
    const llmHowto = Array.isArray(llm?.howto) ? llm.howto : [];
    const llmCautions = Array.isArray(llm?.cautions) ? llm.cautions : [];

    // ✅ fallback (LLM이 없거나 형식이 깨졌을 때)
    const fallbackHowto = [
      "분리배출 안내를 생성하지 못했어요. 다시 시도해주세요.",
    ];

    // ✅ ResultCard가 쓰기 좋은 형태로 변환
    return {
      // category: 복합이면 "복합 쓰레기", 아니면 LLM category 우선 → 없으면 한글 라벨
      category: isMixed
        ? "복합 쓰레기"
        : (llm?.category ?? (LABEL_KO[mainLabel] ?? mainLabel)),

      // bin: 복합이면 분리 후 배출, 단일이면 BIN_MAP
      bin: isMixed ? "분리 후 각각 배출" : (BIN_MAP[mainLabel] ?? "확인 필요"),

      confidence: mainConf,

      reasons: [
        isMixed
          ? `여러 재질이 함께 감지되었어요: ${uniqueLabels
              .map((l) => LABEL_KO[l] ?? l)
              .join(", ")}`
          : mainConf < 0.7
          ? "정확도가 낮아 다른 분류 가능성도 있어요."
          : "이미지 특징을 바탕으로 분류되었어요.",
      ],

      // ✅ 핵심: 버리는 방법 / 주의사항을 분리해서 넣기
      howto: isMixed
        ? [
            `감지된 재질: ${uniqueLabels.map((l) => LABEL_KO[l] ?? l).join(", ")}`,
            "가능하면 재질을 분리한 뒤 각각 분리배출하세요.",
            ...(llmHowto.length ? llmHowto : fallbackHowto),
          ]
        : (llmHowto.length ? llmHowto : fallbackHowto),

      // ✅ cautions에는 LLM cautions + YOLO 감지 로그 같이 붙이기
      cautions: [
        ...(llmCautions.length ? llmCautions : []),
        ...sorted.map(
          (d) =>
            `YOLO 감지: ${LABEL_KO[d.label] ?? d.label} (${(
              Number(d.confidence ?? 0) * 100
            ).toFixed(1)}%)`
        ),
      ],

      raw: data, // 디버깅용
    };
  };

  const onSubmit = async () => {
    if (!canSubmit || loading) return;

    setLoading(true);
    setResult(null);

    try {
      const uiResult = await callDetectApi();
      setResult(uiResult);
    } catch (e) {
      setResult({
        category: "오류",
        bin: "확인 필요",
        confidence: 0,
        reasons: ["분류 중 오류가 발생했어요."],
        howto: [
          "이미지를 다시 선택하거나 Node(3001) / YOLO(8000) 서버가 켜져 있는지 확인하세요.",
        ],
        cautions: [String(e?.message || e)],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="logo">♻️</div>
          <div>
            <div className="title">쓰레기 분리수거 도우미</div>
            <div className="subtitle">사진 한 장으로 분류</div>
          </div>
        </div>

        <div className="toolbar">
          <button className="btn ghost" onClick={resetAll} disabled={loading}>
            초기화
          </button>
        </div>
      </header>

      <main className="grid">
        <section className="panel">
          <h2 className="h2">1) 사진 업로드</h2>
          <p className="p">
            헷갈리는 쓰레기를 찍어 올리면 <b>분리수거 종류</b>와{" "}
            <b>왜 그렇게 버려야 하는지</b>를 알려줘요.
          </p>

          <Dropzone onPickFile={onPickFile} />

          {previewUrl && (
            <div className="previewWrap">
              <div className="previewLabel">미리보기</div>
              <img className="preview" src={previewUrl} alt="preview" />
              <div className="previewMeta">
                <span className="pill">{file?.name}</span>
                <span className="pill">
                  {Math.round((file?.size || 0) / 1024)} KB
                </span>
              </div>
            </div>
          )}

          <div className="actions">
            <button
              className="btn"
              onClick={onSubmit}
              disabled={!canSubmit || loading}
            >
              {loading ? "분류 중..." : "분리수거 판별하기"}
            </button>
            <button className="btn ghost" onClick={resetAll} disabled={loading}>
              다시 선택
            </button>
          </div>

          <div className="note">
            <b>TIP</b> 라벨/로고/재질이 보이게 찍으면 정확도가 올라가요.
            (예: PET, PP, 종이, 비닐)
          </div>
        </section>

        <section className="panel">
          <h2 className="h2">2) 결과</h2>
          {!result ? (
            <div className="empty">
              아직 결과가 없어요. 왼쪽에서 사진을 올리고 “판별하기”를 눌러주세요.
            </div>
          ) : (
            <ResultCard result={result} />
          )}
        </section>
      </main>

      <footer className="footer">
        <span>Vite + React</span>
        <span className="dot">•</span>
        <span>Recycle Helper UI</span>
      </footer>
    </div>
  );
}
