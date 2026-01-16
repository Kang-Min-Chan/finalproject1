import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY missing in .env");

const genAI = new GoogleGenerativeAI(apiKey);

function extractJson(text) {
  if (!text) return null;
  let t = String(text).trim();

  // 1) ```json ... ``` 코드블록 제거
  t = t.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/g, "").trim();

  // 2) 텍스트 안에서 첫 '{' ~ 마지막 '}'만 잘라내기
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  return t.slice(start, end + 1);
}

export async function sendToGemini(detections) {
  const model = genAI.getGenerativeModel(
    { model: "gemini-2.5-flash-lite" },
    {
      generationConfig: {
        temperature: 0.25,
        topP: 0.9,
        maxOutputTokens: 380,
      },
    }
  );

  const labels = (detections ?? [])
    .slice(0, 3)
    .map((d) => `${d.label}(${Math.round(d.confidence * 100)}%)`)
    .join(", ");

  const prompt = `
너는 대한민국 분리배출 기준을 안내하는 전문 안내자다.

[감지 라벨] ${labels}

중요:
- 반드시 "아래 JSON만" 출력한다. 다른 문장/설명/코드펜스(\\\`\\\`\\\`) 절대 금지.
- howto/cautions는 각각 2~4개 문장으로 작성(너무 짧지 않게).
- 애매하면 "확인 필요"를 사용.
- category 값은 반드시: "종이류"|"종이박스"|"유리"|"캔류/고철"|"플라스틱"|"일반쓰레기" 중 하나만 사용

출력(JSON만):
{
  "category": "<한글 분류명>",
  "howto": ["<버리는 방법 1>", "<버리는 방법 2>", "<버리는 방법 3>"],
  "cautions": ["<주의사항 1>", "<주의사항 2>"]
}
`.trim();

  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  const jsonText = extractJson(raw);
  if (!jsonText) {
    return {
      category: "확인 필요",
      howto: ["분리배출 안내를 생성하지 못했습니다."],
      cautions: ["응답 형식을 해석할 수 없습니다."],
      rawText: raw,
    };
  }

  try {
    const parsed = JSON.parse(jsonText);
    return {
      category: parsed?.category ?? "확인 필요",
      howto: Array.isArray(parsed?.howto) ? parsed.howto : [],
      cautions: Array.isArray(parsed?.cautions) ? parsed.cautions : [],
      // rawText는 필요 없으면 지워도 됨
    };
  } catch (e) {
    return {
      category: "확인 필요",
      howto: ["분리배출 안내를 생성하지 못했습니다."],
      cautions: ["응답 형식을 해석할 수 없습니다."],
      rawText: raw,
    };
  }
}
