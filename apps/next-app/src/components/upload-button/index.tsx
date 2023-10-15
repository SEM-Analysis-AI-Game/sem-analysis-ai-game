import { UploadButtonClientSide } from "./client-side";

/**
 * Server-side rendered upload button. Routes to the /paint route and
 * updates BackgroundContext if one is found.
 */
export function UploadButton(): JSX.Element {
  return (
    <UploadButtonClientSide>
      <div className="flex w-full justify-center">
        {/* <img src="/upload.png" className="w-4 mr-2" /> <span>Upload Image</span> */}
        <img src="/download.png" className="w-4 mr-1" /> <span>New Image</span>
      </div>
    </UploadButtonClientSide>
  );
}
