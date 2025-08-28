"use client";
import { PulseLoader } from "react-spinners";

export default function LoadingOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        zIndex: 9999,
      }}
    >
      <PulseLoader color="#272f47" size={10} />
    </div>
  );
}
