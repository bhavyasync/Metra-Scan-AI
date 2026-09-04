"use client";

import { useRef } from "react";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
}

export default function ImageUploader({
  onImageSelect,
}: ImageUploaderProps) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (file) {
      onImageSelect(file);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleChange}
        style={{
          display: "none",
        }}
      />

      <button
        type="button"
        onClick={() =>
          inputRef.current?.click()
        }
        style={{
          width: "100%",
          padding: "40px 20px",
          border: "2px dashed #475569",
          borderRadius: "12px",
          background: "#0f172a",
          color: "#cbd5e1",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        🖼️ Click here to select a product image
      </button>
    </div>
  );
}