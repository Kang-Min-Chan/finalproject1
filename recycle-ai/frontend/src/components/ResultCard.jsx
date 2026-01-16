import React from "react";

export default function ResultCard({ result }) {
  const {
    category = "알 수 없음",
    bin = "확인 필요",
    howto = [],
    cautions = [],
  } = result || {};

  return (
    <div className="result">
      <div className="resultTop">
        <div>
          <div className="resultKicker">분류 결과</div>
          <div className="resultTitle">{category}</div>

          <div className="resultBin">
            <span className="pill strong">버릴 곳: {bin}</span>
          </div>
        </div>
      </div>

      {/* 결과 영역 */}
      <div className="resultGrid resultGridTall">
        <div className="box">
          <div className="boxTitle">버리는 방법</div>
          {howto.length ? (
            <ul className="ul">
              {howto.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          ) : (
            <div className="muted">가이드가 없어요.</div>
          )}
        </div>

        <div className="box">
          <div className="boxTitle">주의사항</div>
          {cautions.length ? (
            <ul className="ul">
              {cautions.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          ) : (
            <div className="muted">특이사항 없음</div>
          )}
        </div>
      </div>
    </div>
  );
}
