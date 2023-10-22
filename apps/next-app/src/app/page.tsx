import Link from "next/link";
import { kImages } from "@/util";

export default async function Home(): Promise<JSX.Element> {
  return (
    <>
      {kImages.map((_, index) => (
        <Link href={`/${index}`} key={index}>
          {index}
        </Link>
      ))}
    </>
  );
}
