import { describe, it, beforeAll, afterAll, expect, beforeEach } from "vitest";
import { execSync } from "node:child_process";
import request from "supertest";
import { app } from "../src/app";

describe("transactions routes", async () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    execSync("npx knex migration:roolback --all");
    execSync("npx knex migration:latest");
  });

  it("should be able to create a new transaction", async () => {
    await request(app.server)
      .post("/transactions")
      .send({
        title: "new transaction",
        amount: 5000,
        type: "credit",
      })
      .expect(201);
  });

  it("should be able to list all transactions", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "new transaction",
        amount: 5000,
        type: "credit",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    const listTransactionResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies!)
      .expect(200);

    expect(listTransactionResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: "new transaction",
        amount: 5000,
      }),
    ]);
  });

  it("should be able to get a specific transactions", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "new transaction",
        amount: 5000,
        type: "credit",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    const listTransactionResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies!)
      .expect(200);

    const transactionId = listTransactionResponse.body.transactions[0].id;

    const specificTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set("Cookie", cookies!)
      .expect(200);

    expect(specificTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        id: transactionId,
        title: "new transaction",
        amount: 5000,
      })
    );
  });

  it("should be able to get the summary", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "new transaction",
        amount: 5000,
        type: "credit",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    await request(app.server)
      .post("/transactions")
      .set("Cookie", cookies!)
      .send({
        title: "new transaction 2",
        amount: 2000,
        type: "debit",
      });

    const specificTransactionResponse = await request(app.server)
      .get(`/transactions/summary`)
      .set("Cookie", cookies!)
      .expect(200);

    expect(specificTransactionResponse.body.summary).toEqual({
      amount: 3000,
    });
  });
});
