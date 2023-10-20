import Link from "next/link";

export default async function Home(): Promise<JSX.Element> {
  return <Link href={"/0"}>Paint</Link>;
}
