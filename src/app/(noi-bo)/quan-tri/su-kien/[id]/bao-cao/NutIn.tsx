"use client";

export default function NutIn() {
  return (
    <button onClick={() => window.print()} className="btn-primary print:hidden">
      🖨 In / lưu PDF
    </button>
  );
}
