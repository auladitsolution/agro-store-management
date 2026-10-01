import { describe, it, expect } from 'vitest';
import { addMoney, subtractMoney, multiplyMoney, roundMoney } from '../src/lib/utils/money';

describe('Purchase Financials & Supplier Accounting Calculations', () => {
  it('calculates purchase subtotal, discounts, costs and due correctly', () => {
    // 10 bags of Urea @ 1250 = 12500
    // 5 bottles of Virtako @ 280 = 1400
    // Total items: 13900
    const item1 = multiplyMoney(10, 1250);
    const item2 = multiplyMoney(5, 280);
    const subtotal = addMoney(item1, item2);
    expect(subtotal).toBe(13900);

    const discount = 400;
    const transportCost = 500;
    const otherCost = 150;
    const grandTotal = addMoney(subtractMoney(subtotal, discount), transportCost, otherCost);
    expect(grandTotal).toBe(14150);

    const paidAmount = 10000;
    const dueAmount = subtractMoney(grandTotal, paidAmount);
    expect(dueAmount).toBe(4150);

    // Supplier balance update
    const prevSupplierBalance = 15000;
    const newSupplierBalance = addMoney(prevSupplierBalance, dueAmount);
    expect(newSupplierBalance).toBe(19150);
  });
});

describe('Sales POS Calculations, Mixed Payment & Customer Accounting', () => {
  it('calculates POS cart total with mixed payments and change correctly', () => {
    const item1 = multiplyMoney(2, 540); // 1080
    const item2 = multiplyMoney(3, 340); // 1020
    const subtotal = addMoney(item1, item2); // 2100
    const discount = 100;
    const grandTotal = subtractMoney(subtotal, discount); // 2000

    expect(grandTotal).toBe(2000);

    // Mixed payment: Cash 1000 + bKash 500 = 1500 paid
    const paidAmount = 1500;
    const dueAmount = subtractMoney(grandTotal, paidAmount);
    expect(dueAmount).toBe(500);

    // Overpayment scenario: customer gives 2500 cash on 2000 grandTotal
    const cashGiven = 2500;
    const changeAmount = subtractMoney(cashGiven, grandTotal);
    expect(changeAmount).toBe(500);
  });

  it('evaluates customer credit limit breach accurately', () => {
    const creditLimit = 20000;
    const currentBalance = 18000;
    const newDueSale = 5000;

    const prospectiveBalance = addMoney(currentBalance, newDueSale);
    expect(prospectiveBalance).toBe(23000);
    expect(prospectiveBalance > creditLimit).toBe(true);
  });
});

describe('True Profit Calculation based on Batch Cost vs Revenue', () => {
  it('calculates gross and net profit using item cost snapshots and operating expenses', () => {
    // Sold: 10 items @ 150 selling price = 1500 revenue
    // Sold items actual batch cost: 100 each = 1000 COGS
    const revenue = multiplyMoney(10, 150);
    const cogs = multiplyMoney(10, 100);
    const grossProfit = subtractMoney(revenue, cogs);
    expect(grossProfit).toBe(500);

    // Operating expenses: 200 electricity + 100 transport
    const expenses = addMoney(200, 100);
    const netProfit = subtractMoney(grossProfit, expenses);
    expect(netProfit).toBe(200);
  });
});

describe('Daily Cash Shift Tracking & Discrepancies', () => {
  it('computes expected cash at closing from register shift entries', () => {
    const openingCash = 5000;
    const cashSales = 12000;
    const cashDueCollections = 4000;
    const cashSupplierPayments = 3000;
    const cashExpenses = 1500;
    const cashRefunds = 500;

    // Expected cash = opening + inflows - outflows
    const totalInflows = addMoney(openingCash, cashSales, cashDueCollections); // 21000
    const totalOutflows = addMoney(cashSupplierPayments, cashExpenses, cashRefunds); // 5000
    const expectedCash = subtractMoney(totalInflows, totalOutflows);
    expect(expectedCash).toBe(16000);

    // If actual counted cash is 15800: difference is -200 (shortage)
    const actualCash = 15800;
    const discrepancy = subtractMoney(actualCash, expectedCash);
    expect(discrepancy).toBe(-200);
  });
});
