"use client";

import { useRouter } from "next/navigation";
import React, { ChangeEvent, PropsWithChildren, useRef } from "react";

export function UploadButton(props: PropsWithChildren): JSX.Element {
  const router = useRouter();

  const fileUploadRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        type="file"
        accept=".png,.jpg"
        ref={fileUploadRef}
        style={{ display: "none" }}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const reader = new FileReader();
          reader.onload = (ev: ProgressEvent<FileReader>) => {
            const img = ev.target?.result;
            if (img) {
              localStorage.setItem("background", img.toString());
              router.push("/paint");
            } else {
              alert("Failed to load image");
            }
          };
          const files = fileUploadRef.current?.files;
          if (files && files.length > 0) {
            reader.readAsDataURL(files[0]);
          }
        }}
      />
      <button
        className="flex flex-row bg-slate-200 hover:bg-slate-400 transition active:bg-slate-300 p-1 text-slate-800 font-bold rounded text-sm h-10"
        style={{
          alignItems: "center",
        }}
        onClick={() => {
          fileUploadRef.current?.click();
        }}
      >
        {props.children}
      </button>
    </>
  );
}
