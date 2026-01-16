import React, { useRef, useState } from "react";

export default function Dropzone({ onPickFile }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const openPicker = () => inputRef.current?.click();

  const handleFiles = (files) => {
    const f = files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있어요.");
      return;
    }
    onPickFile?.(f);
  };

  return (
    <div
      className={`dropzone ${dragOver ? "over" : ""}`}
      onClick={openPicker}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        className="fileInput"
        type="file"
        accept="image/*"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="dzInner">
        <div className="dzIcon">📷</div>
        <div className="dzText">
          <div className="dzTitle">클릭하거나 이미지를 끌어다 놓으세요</div>
          <div className="dzSub">JPG/PNG/WEBP 등 이미지 파일</div>
        </div>
      </div>
    </div>
  );
}
