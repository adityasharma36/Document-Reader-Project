
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/client.js";
import { serverConfig } from "../../configs/env.config.js";

const connectionString = `${serverConfig.DATABASE}`;

const adapter = new PrismaPg({connectionString})

const prisma = new PrismaClient({adapter})

export { prisma }