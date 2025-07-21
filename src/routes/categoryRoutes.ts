import { Router, Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Category } from "../entity/Category";
import authMiddleware, { adminAuthMiddleware } from "../middleware/auth";

const router = Router();
const categoryRepository = AppDataSource.getRepository(Category);

/**
 * @route POST /api/v1/categories
 * @description Cria uma nova categoria
 * @access Private (Admin)
 */
router.post("/", authMiddleware, adminAuthMiddleware, async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Nome da categoria é obrigatório." });
  }

  try {
    const existingCategory = await categoryRepository.findOne({ where: { name } });
    if (existingCategory) {
      return res.status(409).json({ message: "Categoria com este nome já existe" });
    }
    const newCategory = categoryRepository.create({ name });
    await categoryRepository.save(newCategory);
    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Erro ao criar vategoria", error);
    res.status(500).json({ message: "Erro interno do servidor ao criar categoria" });
  }
});

/**
 * @route GET /api/v1/categories
 * @description Obtém todas as categorias
 * @access Public
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const categories = await categoryRepository.find();
    res.status(200).json(categories);
  } catch (error) {
    console.error("Erro ao obter categorias:", error);
    res.status(500).json({ message: "Erro interno do servidor ao obter categorias" });
  }
});

/**
 * @route GET /api/v1/categories/:id
 * @description Obtém uma categoria pelo ID
 * @access Public
 */
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const category = await categoryRepository.findOne({ where: { id } });
    if (!category) {
      return res.status(404).json({ message: "Categoria não encontrada." });
    }
    res.status(200).json(category);
  } catch (error) {
    console.error("Erro ao obter categorias", error);
    res.status(500).json({ message: "Erro interno do servidor ao obter categoria." });
  }
});

/**
 * @route PUT /api/v1/categories/:id
 * @description Atualiza uma categoria existente
 * @access Private (Admin Only)
 */
router.put("/:id", authMiddleware, adminAuthMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Nome de categoria é obrigatório para atualização." });
  }

  try {
    const category = await categoryRepository.findOne({ where: { id } });
    if (!category) {
      return res.status(404).json({ message: "Categoria não encontrada." });
    }

    const existingCategory = await categoryRepository.findOne({ where: { name } });
    if (existingCategory && existingCategory.id !== id) {
      return res.status(409).json({ message: "Já existe uma categoria com este nome" });
    }
    category.name = name;
    await categoryRepository.save(category);
    res.status(200).json(category);
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    res.status(500).json({ message: "Erro interno do servidor ao utlizar categoria" });
  }
});

/**
 * @route DELETE /api/v1/categories/:id
 * @description Deleta uma categoria
 * @access Private (Admin Only)
 */
router.delete("/:id", authMiddleware, adminAuthMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const category = await categoryRepository.findOne({ where: { id } });
    if (!category) {
      return res.status(404).json({ message: "Categoria não encontrada." });
    }

    await categoryRepository.remove(category);
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar categoria:", error);
    res.status(500).json({ message: "Erro interno do servidor ao deletar categoria." });
  }
});

export default router;
