/**
 * Funda Puan repository abstraction.
 *
 * Same shape as `orders/repository.ts` / `campaigns/repository.ts`: an
 * in-memory store kept on `globalThis` (shared by a Route Handler and a
 * Server Component in the same process), behind an interface a
 * Supabase-backed implementation can drop into later via
 * `setFundaPointsRepository()`.
 *
 * The ledger invariant lives here, not in the callers: `appendTransaction`
 * is the only way a balance changes, it recomputes balance/lifetime totals
 * from the account + the new transaction, and it never lets a balance go
 * negative. Idempotency (a `businessKey` maps to at most one transaction)
 * is also enforced here so every caller gets it for free.
 */

import type { FundaPointAccount, FundaPointTransaction, NewFundaPointTransactionInput } from "./types";
import { FUNDA_POINT_ACCOUNT_SEED, FUNDA_POINT_TRANSACTION_SEED } from "./mock";

export interface FundaPointsRepository {
  getAccount(customerId: string): FundaPointAccount | null;
  listAccounts(): FundaPointAccount[];
  listTransactions(customerId: string): FundaPointTransaction[];
  findTransactionByBusinessKey(businessKey: string): FundaPointTransaction | null;
  appendTransaction(input: NewFundaPointTransactionInput): FundaPointTransaction;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `fpt_${crypto.randomUUID()}`;
  }
  return `fpt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

const nowISO = () => new Date().toISOString();

type Store = {
  accounts: Map<string, FundaPointAccount>;
  transactions: Map<string, FundaPointTransaction>;
  byBusinessKey: Map<string, string>;
};

function seedStore(): Store {
  const accounts = new Map(FUNDA_POINT_ACCOUNT_SEED.map((a) => [a.customerId, a]));
  const transactions = new Map<string, FundaPointTransaction>();
  const byBusinessKey = new Map<string, string>();
  for (const t of FUNDA_POINT_TRANSACTION_SEED) {
    transactions.set(t.id, t);
    if (t.businessKey) byBusinessKey.set(t.businessKey, t.id);
  }
  return { accounts, transactions, byBusinessKey };
}

const globalStore = globalThis as unknown as { __fundaPoints?: Store };

class InMemoryFundaPointsRepository implements FundaPointsRepository {
  private readonly store: Store;

  constructor() {
    globalStore.__fundaPoints ??= seedStore();
    this.store = globalStore.__fundaPoints;
  }

  getAccount(customerId: string): FundaPointAccount | null {
    return this.store.accounts.get(customerId) ?? null;
  }

  listAccounts(): FundaPointAccount[] {
    return [...this.store.accounts.values()];
  }

  listTransactions(customerId: string): FundaPointTransaction[] {
    return [...this.store.transactions.values()]
      .filter((t) => t.customerId === customerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  findTransactionByBusinessKey(businessKey: string): FundaPointTransaction | null {
    const id = this.store.byBusinessKey.get(businessKey);
    return id ? (this.store.transactions.get(id) ?? null) : null;
  }

  appendTransaction(input: NewFundaPointTransactionInput): FundaPointTransaction {
    if (input.businessKey) {
      const existing = this.findTransactionByBusinessKey(input.businessKey);
      if (existing) return existing; // idempotent no-op
    }

    const current = this.store.accounts.get(input.customerId);
    const base: FundaPointAccount =
      current ??
      ({
        customerId: input.customerId,
        customerName: input.customer?.name ?? "",
        customerPhone: input.customer?.phone ?? "",
        customerEmail: input.customer?.email ?? "",
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      } satisfies FundaPointAccount);

    const balanceAfter = base.balance + input.points;
    if (balanceAfter < 0) {
      throw new Error(
        `FUNDA_POINTS_NEGATIVE_BALANCE: customer ${input.customerId} would go to ${balanceAfter}`,
      );
    }

    const transaction: FundaPointTransaction = {
      id: makeId(),
      customerId: input.customerId,
      type: input.type,
      points: input.points,
      balanceAfter,
      orderId: input.orderId ?? null,
      orderNumber: input.orderNumber ?? null,
      businessKey: input.businessKey ?? null,
      description: input.description ?? null,
      createdAt: nowISO(),
    };

    const nextAccount: FundaPointAccount = {
      ...base,
      customerName: input.customer?.name || base.customerName,
      customerPhone: input.customer?.phone || base.customerPhone,
      customerEmail: input.customer?.email || base.customerEmail,
      balance: balanceAfter,
      lifetimeEarned: base.lifetimeEarned + Math.max(0, input.points),
      lifetimeSpent: base.lifetimeSpent + Math.max(0, -input.points),
      updatedAt: nowISO(),
    };

    this.store.accounts.set(input.customerId, nextAccount);
    this.store.transactions.set(transaction.id, transaction);
    if (transaction.businessKey) this.store.byBusinessKey.set(transaction.businessKey, transaction.id);

    return transaction;
  }
}

let repo: FundaPointsRepository = new InMemoryFundaPointsRepository();

export function setFundaPointsRepository(next: FundaPointsRepository): void {
  repo = next;
}
export function getFundaPointsRepository(): FundaPointsRepository {
  return repo;
}
