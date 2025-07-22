import { Router, Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Post } from "../entity/Posts";
import { User } from "../entity/User";
import { Category } from "../entity/Category";
import authMiddleware, { adminAuthMiddleware } from "../middleware/auth";
import { deleteFileFromVercelBlob, uploadFileToVercelBlob } from "../utils/vercelBlob";
import multer, { FileFilterCallback } from "multer";
import slugify from "slugify";
import { Not } from "typeorm";

const imageFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    const error = new Error("Apenas arquivos de imagem são permitidos!");
    cb(error as any, false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: imageFilter,
});

const router = Router();
const postRepository = AppDataSource.getRepository(Post);
const userRepository = AppDataSource.getRepository(User);
const categoryRepository = AppDataSource.getRepository(Category);

/**
 * @route POST /api/v1/posts
 * @description Cria um novo post (com upload de imagem)
 * @access Private
 */
router.post("/", authMiddleware, upload.single("image"), async (req: Request, res: Response) => {
  const { title, content, categoryId, status } = req.body;
  const authorId = (req as any).user.id; // Supondo que o authMiddleware anexa user.id

  if (!title || !content || !authorId) {
    return res.status(400).json({ message: "Título, conteúdo e autor são obrigatórios!" });
  }

  let imageUrl: string | null = null; // Inicializa como null

  try {
    const author = await userRepository.findOne({ where: { id: authorId } });
    if (!author) {
      return res.status(404).json({ message: "Autor não encontrado." });
    }

    let categoryInstance: Category | null = null;
    if (categoryId) {
      const foundCategory = await categoryRepository.findOne({ where: { id: categoryId } });
      if (!foundCategory) {
        return res.status(404).json({ message: "Categoria não encontrada." });
      }
      categoryInstance = foundCategory;
    }

    let baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    while (await postRepository.findOne({ where: { slug: slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    if (req.file) {
      const fileExtension = req.file.originalname.split(".").pop();
      const fileName = `${slug}-${Date.now()}.${fileExtension}`; // Nome do arquivo no storage
      const folder = "post-images"; // Pasta no Vercel Blob
      imageUrl = await uploadFileToVercelBlob(req.file.buffer, folder, fileName, req.file.mimetype);
    }

    const newPost = postRepository.create({
      title,
      slug,
      content,
      imageUrl,
      status: status || "draft",
      author: author,
      category: categoryInstance,
    });

    await postRepository.save(newPost);
    return res.status(201).json(newPost);
  } catch (error: any) {
    // Se o erro vier do Multer por mimeType inválido, trate-o
    if (error.message === "Apenas arquivos de imagem são permitidos!") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Erro ao criar post:", error);
    return res.status(500).json({ message: "Erro interno do servidor ao criar post." });
  }
});

/**
 * @route GET /api/v1/posts
 * @description Obtem todos os posts (com paginação e filtros opcionais)
 * @access Public
 */

router.get("/", async (req: Request, res: Response) => {
  try {
    const posts = await postRepository.find({
      where: {
        status: "draft", // Garante que apenas posts publicados são retornados
      },
      relations: ["author", "category"], // Inclui autor e categoria
      order: {
        createAt: "DESC", // Ordena pelos mais recentes
      },
    });

    // Retorna apenas o array de posts, sem informações de paginação
    // console.log(posts);
    res.status(200).json(posts);
  } catch (error) {
    console.error("Erro interno do servidor ao obter posts:", error);
    res.status(500).json({ message: "Erro interno do servidor ao obter posts." });
  }
});

/**
 * @route GET /api/v1/posts/:slug
 * @description Obtém um post pelo slug
 * @access Public
 */
router.get("/:slug", async (req: Request, res: Response) => {
  const { slug } = req.params;

  try {
    const post = await postRepository.findOne({
      where: { slug },
      relations: ["author", "category"],
    });

    if (!post) {
      return res.status(404).json({ message: "Post não encontrado." });
    }
    res.status(200).json(post);
  } catch (error) {
    console.error("Erro ao obter post:", error);
    res.status(500).json({ message: "Erro interno do servidor ao obter post." });
  }
});

/**
 * @route PUT /api/v1/posts/:id
 * @description Atualiza um post existente (com upload de imagem opcional)
 * @access Private (Autor do post ou Admin)
 */
router.put("/:id", authMiddleware, upload.single("image"), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content, categoryId, status, removeImage } = req.body; // Adicione removeImage
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  try {
    const post = await postRepository.findOne({ where: { id }, relations: ["author", "category"] });
    if (!post) {
      return res.status(404).json({ message: "Post não encontrado." });
    }

    // Verificação de permissão (apenas autor ou admin podem editar)
    if (post.author.id !== userId && userRole !== "Admin") {
      return res.status(403).json({ message: "Você não tem permissão para editar este post." });
    }

    let categoryInstance: Category | null = null;
    if (categoryId) {
      // Se categoryId foi enviado (pode ser string vazia para remover)
      if (categoryId === "null" || categoryId === "") {
        // Se a intenção é remover a categoria
        categoryInstance = null;
      } else {
        const foundCategory = await categoryRepository.findOne({ where: { id: categoryId } });
        if (!foundCategory) {
          return res.status(404).json({ message: "Categoria não encontrada." });
        }
        categoryInstance = foundCategory;
      }
    } else if (categoryId === undefined) {
      // Se categoryId não foi enviado, mantém a existente
      categoryInstance = post.category;
    }

    let newSlug = post.slug; // Mantém o slug existente por padrão
    if (title && title !== post.title) {
      // Se o título mudou, recalcule o slug
      let baseSlug = slugify(title, { lower: true, strict: true });
      let counter = 1;
      let tempSlug = baseSlug;
      while ((await postRepository.findOne({ where: { slug: tempSlug } })) && tempSlug !== post.slug) {
        tempSlug = `${baseSlug}-${counter++}`;
      }
      newSlug = tempSlug;
    }

    // === Lógica de Upload/Remoção de Imagem para Vercel Blob ===
    if (req.file) {
      // Se um novo arquivo foi enviado
      // Se já existe uma imagem antiga, delete-a primeiro
      if (post.imageUrl) {
        await deleteFileFromVercelBlob(post.imageUrl);
      }

      const fileExtension = req.file.originalname.split(".").pop();
      const fileName = `${newSlug}-${Date.now()}.${fileExtension}`; // Nome do arquivo no storage
      const folder = "post-images";

      post.imageUrl = await uploadFileToVercelBlob(req.file.buffer, folder, fileName, req.file.mimetype);
    } else if (removeImage === "true" && post.imageUrl) {
      // Se 'removeImage' for true e existe uma imagem
      await deleteFileFromVercelBlob(post.imageUrl);
      post.imageUrl = null; // Zera a URL da imagem no post
    }
    // =========================================================

    // Atualiza os campos do post
    post.title = title || post.title;
    post.slug = newSlug; // Atualiza o slug
    post.content = content || post.content;
    post.status = status || post.status;
    post.category = categoryInstance; // Atualiza a categoria

    await postRepository.save(post);
    return res.status(200).json(post); // Retorna o post atualizado
  } catch (error: any) {
    if (error.message === "Apenas arquivos de imagem são permitidos!") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Erro ao atualizar post:", error);
    return res.status(500).json({ message: "Erro interno do servidor ao atualizar post." });
  }
});

/**
 * @route DELETE /api/v1/posts/:id
 * @desc Deleta um post e sua imagem associada no Firebase
 * @access Private (Autor do post ou Admin)
 */
router.delete("/:id", authMiddleware, adminAuthMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  try {
    const post = await postRepository.findOne({ where: { id }, relations: ["author"] });
    if (!post) {
      return res.status(404).json({ message: "Post não encontrado." });
    }

    // Verificação de permissão
    if (post.author.id !== userId && userRole !== "Admin") {
      return res.status(403).json({ message: "Você não tem permissão para deletar este post." });
    }

    // === Lógica de Exclusão de Imagem do Vercel Blob ===
    if (post.imageUrl) {
      await deleteFileFromVercelBlob(post.imageUrl);
    }
    // ===================================================

    await postRepository.remove(post);
    return res.status(204).send(); // Retorna 204 No Content para sucesso sem corpo
  } catch (error) {
    console.error("Erro ao deletar post:", error);
    return res.status(500).json({ message: "Erro interno do servidor ao deletar post." });
  }
});

export default router;
