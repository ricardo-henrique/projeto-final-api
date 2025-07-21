import rateLimit from "express-rate-limit";

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "Muitas requisições deste IP, por favor, tente novamente após 15 minutos",
  standardHeaders: true,
  legacyHeaders: false,
});

export default apiRateLimiter;
