import { kImages } from "@/util";
import { Painter } from "@/components";

export function generateStaticParams() {
  return kImages.map((_, index) => ({
    imageIndex: index.toString(),
  }));
}

export default function Paint(props: {
  params: { imageIndex: string };
}): JSX.Element {
  return <Painter imageIndex={parseInt(props.params.imageIndex)} />;
}
