import express from "express";
import multer from "multer";
import fs from "fs";
import { sendToYolo } from "../services/yolo.js";
import { sendToGemini } from "../services/gemini.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("image"), async (req, res) => {
  const uploadedPath = req?.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "image file is missing",
      });
    }

    // 1) YOLO
    const yoloResult = await sendToYolo(req.file.path);

    if (!yoloResult?.success || !yoloResult?.detections?.length) {
      return res.status(200).json({
        success: true,
        yolo: yoloResult,
        llm: null,
      });
    }

    // 2) Gemini
    const geminiResult = await sendToGemini(yoloResult.detections);

    /**
     * ✅ LLM 결과 표준화
     * - sendToGemini가 JSON 객체를 반환하면 그대로 사용
     * - 문자열이면 기존 message로 들어오던 값을 howto로 넣고 cautions는 빈 배열
     */
    let llm = null;

    if (geminiResult && typeof geminiResult === "object") {
      llm = {
        category: geminiResult.category ?? "확인 필요",
        howto: Array.isArray(geminiResult.howto) ? geminiResult.howto : [],
        cautions: Array.isArray(geminiResult.cautions) ? geminiResult.cautions : [],
      };
    } else if (typeof geminiResult === "string") {
      llm = {
        category: "확인 필요",
        howto: [geminiResult],
        cautions: [],
      };
    } else {
      llm = null;
    }

    // 3) 최종 응답
    return res.json({
      success: true,
      yolo: yoloResult,
      llm,
    });
  } catch (err) {
    console.error("DETECT ERROR:", err);
    console.error("CAUSE:", err?.cause);

    return res.status(500).json({
      success: false,
      message: "processing failed",
    });
  } finally {
    // ✅ 업로드 파일 정리 (uploads 폴더에 파일 쌓이는 것 방지)
    if (uploadedPath) {
      fs.promises.unlink(uploadedPath).catch(() => {});
    }
  }
});

export default router;
