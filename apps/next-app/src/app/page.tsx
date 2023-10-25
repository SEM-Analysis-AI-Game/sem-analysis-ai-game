import Link from "next/link";
import Image from "next/image";
import { kImages, SEMImageData } from "@/util";

export default async function Home(): Promise<JSX.Element> {
  return (
    <>
      <div className="background" />
      <h1 className="text-center font-bold text-2xl mt-10">
        Behind Density Lines
      </h1>
      <div className="max-w-xl block mx-auto mt-5 overflow-y-scroll">
        <p>
          Choose one of the images below to start collaboratively segmenting:
        </p>
        {kImages.map((data: SEMImageData, index: number) => (
          <Link href={`/${index}`} key={index} className="border rounded p-4 flex transition bg-[rgba(240,240,240,0.9)] hover:opacity-80 my-2 active:bg-blue">
            <Image 
              width={100}
              height={100}
              src={data.image.src}
              alt=""
              className="rounded"
            />
            <div className="ml-4">
              <h1 className="font-bold">
                Room: {index + 1}
              </h1>
              <p>
                { data.description }
              </p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
