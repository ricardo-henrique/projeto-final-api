import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entity/User";
import { Post } from "../entity/Posts";
import { Category } from "../entity/Category";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "./src/db/cms.sqlite",
  synchronize: process.env.NODE_ENV !== "production",
  logging: false,
  entities: [User, Post, Category],
  migrations: [],
  subscribers: [],
});
