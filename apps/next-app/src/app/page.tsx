import { RoomLink } from "@/components";
import { kImages } from "@/util";

export default async function Home(): Promise<JSX.Element> {
  return (
    <>
      {kImages.map((_, index) => (
        <RoomLink room={index.toString()} key={index} />
      ))}
    </>
  );
}
