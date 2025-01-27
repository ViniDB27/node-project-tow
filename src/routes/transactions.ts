import { FastifyInstance } from "fastify";
import { knex } from "../database";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";

export async function transactionsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", (request, reply) => {
    console.log(`[${request.method}] ${request.url}`);
  });

  app.post("/", async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    });

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body
    );

    let sesssionId = request.cookies.sessionId;

    if (!sesssionId) {
      sesssionId = randomUUID();
      reply.setCookie("sessionId", sesssionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    await knex("transactions").insert({
      id: randomUUID(),
      title,
      amount: type === "credit" ? amount : amount * -1,
      session_id: sesssionId,
    });

    reply.status(201).send();
  });

  app.get(
    "/",
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { sesssionId } = request.cookies;
      const transactions = await knex("transactions")
        .where("session_id", sesssionId)
        .select();
      return reply.status(200).send({
        transactions,
      });
    }
  );

  app.get(
    "/:id",
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getTransactionParamsSchema = z.object({
        id: z.string().uuid(),
      });
      const { id } = getTransactionParamsSchema.parse(request.params);
      const { sesssionId } = request.cookies;
      const transaction = await knex("transactions")
        .where({
          session_id: sesssionId,
          id: id,
        })
        .first();
      return reply.status(200).send({ transaction });
    }
  );

  app.get(
    "/summary",
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { sesssionId } = request.cookies;
      const summary = await knex("transactions")
        .where("session_id", sesssionId)
        .sum("amount", { as: "amount" })
        .first();
      return reply.status(200).send({ summary });
    }
  );
}
