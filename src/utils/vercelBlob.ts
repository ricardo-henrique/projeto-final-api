import { put, del } from "@vercel/blob";
import { Buffer } from "buffer";

/**
 * Faz o upload de um arquivo para o Vercel Blob Storage.
 * @param fileBuffer O buffer do arquivo a ser enviado.
 * @param folder O nome da pasta dentro do Blob (ex: 'post-images').
 * @param fileName O nome do arquivo (ex: 'minha-imagem.jpg').
 * @param contentType O MIME type do arquivo (ex: 'image/jpeg'). Essencial para o Vercel Blob.
 * @returns A URL pública do arquivo enviado.
 */
export const uploadFileToVercelBlob = async (
  fileBuffer: Buffer,
  folder: string,
  fileName: string,
  contentType: string
): Promise<string> => {
  try {
    const filePath = `${folder}/${fileName}`;
    const { url } = await put(filePath, fileBuffer, {
      access: "public",
      contentType: contentType,
    });
    console.log(`Arquivo ${fileName} enviado para Vercel Blob. URL: ${url}`);
    return url;
  } catch (error) {
    console.error(`Erro ao enviar arquivo para Vercel Blob:`, error);
    throw new Error("Falha ao enviar imagem para o armazenamento.");
  }
};

/**
 * Deleta um arquivo do Vercel Blob Storage.
 * @param fileUrl A URL pública do arquivo a ser deletado.
 */
export const deleteFileFromVercelBlob = async (fileUrl: string): Promise<void> => {
  try {
    // A função `del` do Vercel Blob pode receber a URL completa
    await del(fileUrl);
    console.log(`Arquivo ${fileUrl} deletado do Vercel Blob.`);
  } catch (error: any) {
    console.warn(`Tentativa de deletar arquivo não existente ou erro ao deletar no Vercel Blob: ${fileUrl}`, error);
    // Vercel Blob pode não ter um código de erro específico para "não encontrado"
    // Dependendo do comportamento, você pode querer re-lançar ou apenas logar
    throw new Error(`Falha ao deletar imagem do armazenamento: ${error.message}`);
  }
};
