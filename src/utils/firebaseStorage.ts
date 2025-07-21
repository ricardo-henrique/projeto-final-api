import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getFirebaseStorage, initializeFirebase } from "../config/firebase";

/**
 * Faz upload de um arquivo para o Firebase Storage
 * @param fileBuffer
 * @param folder
 * @param fileName
 * @returns URL
 */
export const uploadFileToFirebase = async (
  fileBuffer: Buffer,
  folder: string,
  fileName: string,
  contentType: string
): Promise<string> => {
  const storage = getFirebaseStorage();
  const bucket = storage.bucket();
  const file = bucket.file(`${folder}/${fileName}`);

  await file.save(fileBuffer, {
    resumable: false,
    metadata: {
      contentType: contentType,
    },
  });

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: "01-01-3015",
  });

  return url;
};

/**
 * Deleta um arquivo do Firebase Storage.
 * @param fileUrl url publica de arquivo a ser deletado
 */
export const deleteFileFromFirebase = async (fileUrl: string): Promise<void> => {
  try {
    const storage = getFirebaseStorage();
    const bucket = storage.bucket();
    const filepath = new URL(fileUrl).pathname.substring(1);
    await bucket.file(filepath).delete();
    console.log(`Arquivo ${fileUrl} deletado do Firebase Storage.`);
  } catch (error: any) {
    if (error.code === "storage/object-not-found") {
      console.warn(`Tentativa de deletar arquivo não existente no Storage: ${fileUrl}`);
    } else {
      console.error(`Erro ao deletar arquivo do firebase Storage (${fileUrl})`);
      throw error;
    }
  }
};
