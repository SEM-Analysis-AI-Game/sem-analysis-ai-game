"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { PropsWithChildren, useContext, useRef } from "react";
import {
  BackgroundContext,
  loadBackground,
} from "../painter/background-loader";

/**
 * Client-side state for the upload button.
 */
export function UploadButtonClientSide(props: PropsWithChildren): JSX.Element {
  const router = useRouter();
  const pathName = usePathname();

  const fileUploadRef = useRef<HTMLInputElement>(null);

  const backgroundState = useContext(BackgroundContext);

  return (
    <>
      <input
        type="file"
        accept=".png,.jpg"
        ref={fileUploadRef}
        style={{ display: "none" }}
        onChange={() => {
          const reader = new FileReader();
          reader.onload = (ev: ProgressEvent<FileReader>) => {
            const img = ev.target?.result;
            if (img) {
              const dataUri = img.toString();
              // Save to localStorage
              localStorage.setItem("background", dataUri);
              if (pathName !== "/paint") {
                router.push("/paint");
              }
              // Update BackgroundContext if it exists
              if (backgroundState) {
                loadBackground(dataUri, (texture) => {
                  backgroundState[1](texture);
                });
              }
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
        className="flex flex-row bg-slate-100 hover:bg-slate-300 transition active:bg-slate-300 p-1 m-1 text-slate-800 font-bold rounded text-sm h-8 border-black border-2"
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
