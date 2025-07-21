import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { Category } from "./Category";

@Entity()
export class Post {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ unique: true })
  slug!: string;

  @Column("text")
  content!: string;

  @Column({ type: "text", nullable: true })
  imageUrl?: string | null;

  @Column({ default: "draft" })
  status!: string;

  @CreateDateColumn()
  createAt!: Date;

  @UpdateDateColumn()
  updateAt!: Date;

  @ManyToOne(() => User, (user) => user.id, { onDelete: "CASCADE", eager: false })
  @JoinColumn({ name: "authorId" })
  author!: User;

  @Column()
  authorId!: string;

  @ManyToOne(() => Category, (category) => category.id, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "categoryId" })
  category!: Category | null;

  @Column({ nullable: true })
  categoryId?: string | null;
}
