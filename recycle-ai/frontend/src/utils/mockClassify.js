// 파일명/크기 기반의 "임시" 분류 로직 (데모용)
// 나중에 CV 모델 결과로 대체하면 됨.
export function mockClassify(file) {
  const name = (file?.name || "").toLowerCase();

  // 간단 키워드 힌트
  const rules = [
    {
      test: () => /bottle|pet|water|coke|cola|soda/.test(name),
      out: {
        category: "플라스틱(PET 병)",
        bin: "플라스틱(투명 페트 분리함)",
        confidence: 0.88,
        reasons: [
          "PET는 재활용 가치가 높아 분리 배출하면 재생원료로 다시 사용돼요.",
          "이물질이 묻으면 선별/재활용 효율이 크게 떨어져요.",
        ],
        howto: [
          "내용물을 비우고 물로 한 번 헹구기",
          "라벨 제거(가능하면) 후 압착",
          "뚜껑은 보통 ‘플라스틱’로 함께 배출(지역 규정에 따르기)",
        ],
        cautions: [
          "기름/음료 찌꺼기가 심하면 일반쓰레기로 분류될 수 있어요.",
        ],
      },
    },
    {
      test: () => /can|coke|beer|soda/.test(name),
      out: {
        category: "캔(알루미늄/철)",
        bin: "캔류",
        confidence: 0.82,
        reasons: [
          "금속은 재활용 공정이 잘 구축되어 있고 원료로 재사용돼요.",
          "음료 잔여물이 있으면 악취/오염으로 전체 선별 품질을 떨어뜨려요.",
        ],
        howto: ["내용물 비우기", "가볍게 헹군 뒤 배출"],
        cautions: ["스프레이/부탄가스 등 압력용기는 별도 규정이 있어요."],
      },
    },
    {
      test: () => /paper|box|carton|note|receipt/.test(name),
      out: {
        category: "종이/박스",
        bin: "종이류",
        confidence: 0.8,
        reasons: [
          "종이는 오염이 적을수록 재활용이 잘 돼요.",
          "테이프/비닐 코팅은 선별을 방해할 수 있어요.",
        ],
        howto: ["테이프/스티커 최대한 제거", "접어서 부피 줄여 배출"],
        cautions: ["기름 묻은 피자박스 같은 오염 종이는 일반쓰레기일 수 있어요."],
      },
    },
    {
      test: () => /glass|soju|wine|bottle/.test(name),
      out: {
        category: "유리병",
        bin: "유리병",
        confidence: 0.78,
        reasons: [
          "유리는 재활용 가능하지만 색상/오염에 따라 공정이 달라요.",
          "뚜껑/이물질이 섞이면 선별이 어려워져요.",
        ],
        howto: ["내용물 비우기", "라벨 제거 가능하면 제거", "뚜껑은 분리 배출"],
        cautions: ["깨진 유리는 종량제봉투/전용 규정(지역) 확인이 필요해요."],
      },
    },
    {
      test: () => /vinyl|bag|plasticbag|wrap/.test(name),
      out: {
        category: "비닐류",
        bin: "비닐류",
        confidence: 0.76,
        reasons: [
          "비닐은 오염이 심하면 재활용이 어렵고 소각/매립으로 갈 수 있어요.",
        ],
        howto: ["내용물/음식물 제거", "가능하면 물로 가볍게 헹구고 말린 뒤 배출"],
        cautions: ["복합재질(은박/코팅)은 일반쓰레기일 수 있어요."],
      },
    },
  ];

  const hit = rules.find((r) => r.test());
  if (hit) return hit.out;

  // fallback: 파일 크기 기반으로 랜덤에 가까운 데모
  const size = file?.size || 0;
  const pick = size % 3;

  if (pick === 0) {
    return {
      category: "플라스틱(혼합)",
      bin: "플라스틱",
      confidence: 0.62,
      reasons: ["플라스틱류는 재질별로 분리될수록 재활용 효율이 좋아요."],
      howto: ["이물질 제거", "가능하면 라벨/뚜껑 분리", "부피를 줄여 배출"],
      cautions: ["복합재질(금속+플라스틱)은 분리 가능한지 확인이 필요해요."],
    };
  }
  if (pick === 1) {
    return {
      category: "일반쓰레기(추정)",
      bin: "종량제 봉투",
      confidence: 0.55,
      reasons: ["오염이 심하거나 복합재질이면 재활용 공정에서 제외될 가능성이 커요."],
      howto: ["물기 제거 후 종량제 봉투 배출"],
      cautions: ["지역별 분리배출 기준이 다를 수 있어요."],
    };
  }
  return {
    category: "분류 보류",
    bin: "확인 필요",
    confidence: 0.4,
    reasons: ["사진만으로 재질을 확정하기 어려워요."],
    howto: ["라벨/재질표기(PET, PP 등)가 보이게 다시 촬영해보세요."],
    cautions: ["지자체 기준을 함께 확인하면 정확해져요."],
  };
}
