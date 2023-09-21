import { UploadButton } from "@/components";

export default function Home(): JSX.Element {
  return (
    <div>
      <h1>SEM Analysis AI Game</h1>
      <UploadButton>
        <img src="/upload.png" className="w-4 mr-2" /> <span>Upload Image</span>
      </UploadButton>
    </div>
  );
}
