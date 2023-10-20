import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import { kImages } from "@/util";
import { Painter } from "@/components";

export function getStaticPaths() {
  return {
    paths: kImages.map((_, index) => ({
      params: {
        imageIndex: index.toString(),
      },
    })),
    fallback: false,
  };
}

export function getStaticProps(context: GetStaticPropsContext) {
  return {
    props: {
      imageIndex: parseInt(context.params!.imageIndex as string),
    },
  };
}

export default function Paint(
  props: InferGetStaticPropsType<typeof getStaticProps>
): JSX.Element {
  return <Painter imageIndex={props.imageIndex} />;
}
