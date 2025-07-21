import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import { AppDataSource } from "./config/data-source";
import { initializeFirebase } from "./config/firebase";
import apiRateLimiter from "./middleware/rateLimiter";

import authRoutes from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import postRoutes from "./routes/postRoutes";
import errHandling from "./middleware/errorHandling";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/v1/", apiRateLimiter);

app.get("/", (req, res) => {
  res.send("API do CMS esta funcionando!");
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/posts", postRoutes);

app.use(errHandling);

AppDataSource.initialize()
  .then(() => {
    console.log("Banco de dados SQLite conectado com sucesso!");
    initializeFirebase();
    console.log("Firebase Admin SDK inicializado com sucesso!");
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((error) => console.log("Error ao conectar ao banco de dados:", error));
