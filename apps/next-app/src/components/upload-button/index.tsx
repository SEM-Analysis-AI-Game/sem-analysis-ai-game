import { UploadButtonClientSide } from "./client-side";

export function UploadButton(): JSX.Element {
  return (
    <UploadButtonClientSide>
      <div className="flex w-full justify-center">
        <img src="/upload.png" className="w-4 mr-2" /> <span>Upload Image</span>
      </div>
    </UploadButtonClientSide>
  );
}
