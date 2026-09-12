/**
 * Demo seed — 6 customers with a mixed earn/redeem/reversal/adjustment
 * history so the admin table and detail drawer have something real to
 * show. Fabricated names, phone numbers and order numbers only.
 */

import type { FundaPointAccount, FundaPointTransaction, FundaPointTransactionType } from "./types";

type SeedEvent = {
  daysAgo: number;
  type: FundaPointTransactionType;
  points: number;
  orderNumber?: string;
  description?: string;
};

type SeedCustomer = {
  customerId: string;
  name: string;
  phone: string;
  email: string;
  events: SeedEvent[];
};

const SEED_CUSTOMERS: SeedCustomer[] = [
  {
    customerId: "cust_5321110001",
    name: "Ayşe Yılmaz",
    phone: "0532 111 00 01",
    email: "ayse.yilmaz@example.com",
    events: [
      { daysAgo: 40, type: "PURCHASE_EARN", points: 120, orderNumber: "FND-20260803-K3M1" },
      { daysAgo: 22, type: "PURCHASE_EARN", points: 85, orderNumber: "FND-20260821-P9T2" },
      { daysAgo: 8, type: "REDEEM", points: -50, orderNumber: "FND-20260904-Q7L5" },
    ],
  },
  {
    customerId: "cust_5321110002",
    name: "Mehmet Kaya",
    phone: "0532 111 00 02",
    email: "mehmet.kaya@example.com",
    events: [{ daysAgo: 5, type: "PURCHASE_EARN", points: 240, orderNumber: "FND-20260907-A2C4" }],
  },
  {
    customerId: "cust_5321110003",
    name: "Selin Aras",
    phone: "0532 111 00 03",
    email: "selin.aras@example.com",
    events: [
      { daysAgo: 60, type: "PURCHASE_EARN", points: 150, orderNumber: "FND-20260714-D8F1" },
      { daysAgo: 30, type: "PURCHASE_EARN", points: 90, orderNumber: "FND-20260813-H4J6" },
      {
        daysAgo: 29,
        type: "REFUND_REVERSAL",
        points: -90,
        orderNumber: "FND-20260813-H4J6",
        description: "İade nedeniyle geri alındı — FND-20260813-H4J6",
      },
      { daysAgo: 3, type: "PURCHASE_EARN", points: 60, orderNumber: "FND-20260909-N1P3" },
    ],
  },
  {
    customerId: "cust_5321110004",
    name: "Can Demir",
    phone: "0532 111 00 04",
    email: "can.demir@example.com",
    events: [
      { daysAgo: 15, type: "PURCHASE_EARN", points: 200, orderNumber: "FND-20260828-R5S7" },
      {
        daysAgo: 14,
        type: "ADMIN_ADJUSTMENT",
        points: 25,
        description: "Merkez müşteri hizmetleri düzeltmesi",
      },
      { daysAgo: 2, type: "REDEEM", points: -100, orderNumber: "FND-20260910-T6V8" },
    ],
  },
  {
    customerId: "cust_5321110005",
    name: "Zeynep Koç",
    phone: "0532 111 00 05",
    email: "zeynep.koc@example.com",
    events: [{ daysAgo: 70, type: "PURCHASE_EARN", points: 45, orderNumber: "FND-20260704-W2X4" }],
  },
  {
    customerId: "cust_5321110006",
    name: "Emre Şahin",
    phone: "0532 111 00 06",
    email: "emre.sahin@example.com",
    events: [
      { daysAgo: 12, type: "PURCHASE_EARN", points: 310, orderNumber: "FND-20260831-Y9Z1" },
      { daysAgo: 1, type: "PURCHASE_EARN", points: 40, orderNumber: "FND-20260911-B3D5" },
    ],
  },
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function buildSeed(): { accounts: FundaPointAccount[]; transactions: FundaPointTransaction[] } {
  const accounts: FundaPointAccount[] = [];
  const transactions: FundaPointTransaction[] = [];

  for (const c of SEED_CUSTOMERS) {
    let balance = 0;
    let lifetimeEarned = 0;
    let lifetimeSpent = 0;
    // oldest first, so balanceAfter accumulates in chronological order
    const chronological = [...c.events].sort((a, b) => b.daysAgo - a.daysAgo);
    let seq = 0;

    for (const e of chronological) {
      balance += e.points;
      lifetimeEarned += Math.max(0, e.points);
      lifetimeSpent += Math.max(0, -e.points);
      seq += 1;
      transactions.push({
        id: `fpt_seed_${c.customerId}_${seq}`,
        customerId: c.customerId,
        type: e.type,
        points: e.points,
        balanceAfter: balance,
        orderId: e.orderNumber ? `ord_${e.orderNumber}` : null,
        orderNumber: e.orderNumber ?? null,
        businessKey: e.orderNumber ? `ord_${e.orderNumber}:${e.type}` : null,
        description: e.description ?? null,
        createdAt: isoDaysAgo(e.daysAgo),
      });
    }

    const daysAgoValues = c.events.map((e) => e.daysAgo);
    accounts.push({
      customerId: c.customerId,
      customerName: c.name,
      customerPhone: c.phone,
      customerEmail: c.email,
      balance,
      lifetimeEarned,
      lifetimeSpent,
      createdAt: isoDaysAgo(Math.max(...daysAgoValues)),
      updatedAt: isoDaysAgo(Math.min(...daysAgoValues)),
    });
  }

  return { accounts, transactions };
}

const SEED = buildSeed();
export const FUNDA_POINT_ACCOUNT_SEED = SEED.accounts;
export const FUNDA_POINT_TRANSACTION_SEED = SEED.transactions;
