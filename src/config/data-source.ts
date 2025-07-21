import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entity/User";
import { Post } from "../entity/Posts";
import { Category } from "../entity/Category";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "./src/db/cms.sqlite",
  synchronize: true,
  logging: false,
  entities: [User, Post, Category],
  migrations: [],
  subscribers: [],
});
