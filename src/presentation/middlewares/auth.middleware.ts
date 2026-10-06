import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../infrastructure/database/prisma";
import { SecurityService } from "../../infrastructure/security/hash";

export interface AuthenticatedMerchant {
  id: string;
  name: string;
  document: string;
}

declare module "fastify" {
  interface FastifyRequest {
    merchant?: AuthenticatedMerchant;
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.status(401).send({
      type: "https://payflowcore.internal/errors/unauthorized",
      title: "Unauthorized",
      status: 401,
      detail: "Cabeçalho Authorization com Bearer API Key é obrigatório.",
    });
  }

  const rawKey = authHeader.substring(7).trim();
  const keyHash = SecurityService.sha256(rawKey);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { merchant: true },
  });

  if (!apiKey || apiKey.revoked || !apiKey.merchant.active) {
    return reply.status(401).send({
      type: "https://payflowcore.internal/errors/unauthorized",
      title: "Unauthorized",
      status: 401,
      detail: "API Key inválida, revogada ou merchant inativo.",
    });
  }

  request.merchant = {
    id: apiKey.merchant.id,
    name: apiKey.merchant.name,
    document: apiKey.merchant.document,
  };
}
