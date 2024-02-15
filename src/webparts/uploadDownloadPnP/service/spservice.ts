import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import { getSP } from "./pnpConfig";
import { IFile } from "@pnp/sp/files";

export interface IFiles extends Array<IFile & { get: () => any }> {}

export const getAllFilesInFolder = async (): Promise<IFiles> => {
  try {
    const sp = getSP();
    const folder: any = await sp.web.getFolderByServerRelativePath(
      "DocumentsUploaded"
    );
    const items: any[] = await folder.files();

    // Manually add 'get' function to each item
    const files: IFiles = items.map((item) => ({ ...item, get: () => item }));

    return files;
  } catch (error) {
    console.error("Error retrieving files:", error);
    return [];
  }
};

export async function UploadFile(file: File, filePath: string) {
  try {
    const fileNamePath: any = encodeURI(file.name);
    console.log(fileNamePath);
    const decodedFileNamePath = decodeURIComponent(fileNamePath);
    console.log(decodedFileNamePath);

    const sp = getSP();
    let result: any;

    if (file.size <= 10485760) {
      // small upload
      result = await sp.web
        .getFolderByServerRelativePath("DocumentsUploaded")
        .files.addUsingPath(decodedFileNamePath, file, { Overwrite: true });
    } else {
      // large upload
      result = await sp.web
        .getFolderByServerRelativePath("DocumentsUploaded")
        .files.addChunked(
          decodedFileNamePath,
          file,
          (data) => {
            console.log(`progress`);
          },

          true
        );
    }

    console.log(`Result of file upload: ${JSON.stringify(result)}`);
  } catch (error) {
    console.error("Error during file upload:", error);
  }
}

export async function downloadFile(
  fileId: string,
  fileName: string
): Promise<void> {
  try {
    const sp = getSP();

    // Use the getFileById method to get the file details
    const fileDetails: any = await sp.web.getFileById(fileId).getItem();
    console.log(fileDetails);
    console.log(fileId);

    // Check if fileDetails is defined
    if (!fileDetails) {
      console.error("File details are undefined.");
      return;
    }

    // Extract file name and type from the response
    const actualFileName: string =
      fileDetails.FileLeafRef || fileName || "downloadedFile";
    console.log(actualFileName);

    const fileType: string | undefined =
      fileDetails.File_x0020_Type || "application/octet-stream";
    console.log(fileType);

    // Use the file's getBuffer method to get the file content
    const fileBuffer: ArrayBuffer = await sp.web
      .getFileById(fileId)
      .getBuffer();
    console.log(fileBuffer);

    // Create a Blob from the file content
    const blob = new Blob([fileBuffer], { type: fileType });
    console.log(blob);

    // Wrap the creation of object URL in a Promise for better sequencing
    const objectUrl = URL.createObjectURL(blob);
    console.log(objectUrl);

    // Create a link element and initiate download
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = actualFileName;
    link.click();

    // Delay for a short time to allow the browser to start the download
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Revoke the object URL to free up resources
    URL.revokeObjectURL(objectUrl);

    console.log(`File downloaded successfully`);
  } catch (error) {
    console.error("Error downloading file by ID:", error);
  }
}
