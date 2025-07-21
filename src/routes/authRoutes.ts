import { Router, Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt";

const router = Router();

const userRepository = AppDataSource.getRepository(User);

/**
 * @route POST /api/v1/auth/register
 * @desc Registra um novo usuário
 * @access Public
 */
router.post("/register", async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, role } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({
      message: "Email e senha são obrigatórios.",
    });
  }

  try {
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email já registrado." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = userRepository.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    await userRepository.save(newUser);

    const token = generateToken({
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role,
    });
    res.status(201).json({
      message: "Usuário registrado com sucesso!",
      token,
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

/**
 * @route POST /api/v1/auth/login
 * @description Autentica um usuario e retorna um token
 * @access Public
 */
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email senha são obrigatórios." });
  }

  try {
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "email não existe ou invalido." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "senha incorreta." });
    }

    const token = generateToken({ id: user.id, firstName: user.firstName, email: user.email, role: user.role });

    res.status(200).json({
      message: "Login bem-sucedido!",
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error no login:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

export default router;
