"use client";

import Link from "next/link";
import Image from "next/image";
import { kImages, SEMImageData } from "@/util";
import { Gradient } from "@/components/Gradient";
import { useEffect } from "react";

export default async function Home(): Promise<JSX.Element> {
  // useEffect(() => {
  //   const gradient = new Gradient();
  //   gradient.initGradient("#gradient-canvas");
  // }, []);
  return (
    <>
      <div>
        <canvas
          id="gradient-canvas"
          className="w-full h-full top-0 left-0 opacity-30 -z-10 fixed"
          data-transition-in
        />
      </div>
      <div className="py-10 w-[min(120rem,90%)] mx-auto text-center space-y-10 ">
        <h1 className="text-center font-light text-[min(8rem,6vw)] mt-10 opacity-80">
          Behind Density Lines
        </h1>
        <p className="font-medium text-2xl">
          Choose one of the images below to start collaboratively segmenting:
        </p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] gap-4 bg-slate-50 p-4 rounded-md">
          {kImages.map((data: SEMImageData, index: number) => (
            <Link
              href={`/${index}`}
              key={index}
              className="border rounded p-4 flex flex-col gap-2 transition bg-[rgba(240,240,240,0.9)] hover:opacity-80 active:bg-blue"
            >
              <div className="w-full relative pt-[100%]">
                <Image
                  fill
                  src={data.image.src}
                  alt=""
                  className="rounded w-full h-full object-cover top-0 left-0"
                />
              </div>
              <div className="ml-4">
                <h1 className="font-bold">Room: {index + 1}</h1>
                <p>{data.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
