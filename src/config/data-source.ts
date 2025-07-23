import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";
import { User } from "../entity/User";
import { Post } from "../entity/Posts";
import { Category } from "../entity/Category";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: false,
  entities: [User, Post, Category],
  migrations: [__dirname + "/../migration/*.ts"],
  subscribers: [],
  ssl: {
    rejectUnauthorized: false,
  },
});
