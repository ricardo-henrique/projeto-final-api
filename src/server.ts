import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import { AppDataSource } from "./config/data-source";
import apiRateLimiter from "./middleware/rateLimiter";

import authRoutes from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import postRoutes from "./routes/postRoutes";
import errHandling from "./middleware/errorHandling";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = ["http://localhost:4200", "https://cms-hardware-client.netlify.app"];

const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    // Permite requisições sem origem (como Postman ou requisições de arquivos locais)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

app.use(apiRateLimiter);

app.get("/", (req, res) => {
  res.send("API do CMS esta funcionando!");
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/posts", postRoutes);

app.use(errHandling);

AppDataSource.initialize()
  .then(() => {
    console.log("Banco de dados postgres conectado com sucesso!");
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.log("Error ao conectar ao banco de dados:", error);
    process.exit(1);
  });
