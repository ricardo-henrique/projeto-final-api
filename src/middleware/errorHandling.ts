import { ErrorRequestHandler } from "express";

const errHandling: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ message: "JSON da requisição mal formatado." });
  }

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({ Message: "Ocorreu um erro interno no servidor" });
};

export default errHandling;
