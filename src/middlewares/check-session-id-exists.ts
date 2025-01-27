import { FastifyReply, FastifyRequest } from "fastify";

export async function checkSessionIdExists(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { sesssionId } = request.cookies;
  if (!sesssionId) return reply.status(401).send({ error: "Unauthorized" });
}
