import { UploadButton } from "@/components";

export default function Home(): JSX.Element {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <h1>SEM Analysis AI Game</h1>
      <UploadButton />
    </div>
  );
}
