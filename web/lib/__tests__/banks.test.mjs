import test from "node:test";
import assert from "node:assert/strict";
import { BANKS, bankByCode } from "../banks.ts";

// Test BANKS data structure
test("BANKS: contains expected major Nigerian banks", () => {
  const bankNames = BANKS.map((b) => b.name);
  
  // Major commercial banks
  assert.ok(bankNames.includes("Access Bank"));
  assert.ok(bankNames.includes("GTBank"));
  assert.ok(bankNames.includes("First Bank of Nigeria"));
  assert.ok(bankNames.includes("UBA"));
  assert.ok(bankNames.includes("Zenith Bank"));
});

test("BANKS: contains expected microfinance banks and FinTechs", () => {
  const bankNames = BANKS.map((b) => b.name);
  
  // Microfinance and digital platforms
  assert.ok(bankNames.includes("Kuda Microfinance Bank"));
  assert.ok(bankNames.includes("Moniepoint Microfinance Bank"));
  assert.ok(bankNames.includes("Opay"));
  assert.ok(bankNames.includes("PalmPay"));
});

test("BANKS: has correct number of banks configured", () => {
  assert.ok(BANKS.length >= 20, "Should have at least 20 banks");
  assert.equal(typeof BANKS.length, "number");
});

test("BANKS: each bank has name and code", () => {
  for (const bank of BANKS) {
    assert.ok(bank.name, "Bank must have a name");
    assert.ok(bank.code, "Bank must have a code");
    assert.equal(typeof bank.name, "string");
    assert.equal(typeof bank.code, "string");
    assert.ok(bank.name.length > 0, "Bank name must not be empty");
    assert.ok(bank.code.length > 0, "Bank code must not be empty");
  }
});

test("BANKS: banks are sorted by name", () => {
  for (let i = 0; i < BANKS.length - 1; i++) {
    const current = BANKS[i].name.toLowerCase();
    const next = BANKS[i + 1].name.toLowerCase();
    assert.ok(current <= next, `Banks not sorted: ${BANKS[i].name} > ${BANKS[i + 1].name}`);
  }
});

test("BANKS: has no duplicate codes", () => {
  const codes = BANKS.map((b) => b.code);
  const uniqueCodes = new Set(codes);
  assert.equal(codes.length, uniqueCodes.size, "Duplicate bank codes found");
});

test("BANKS: has no duplicate names", () => {
  const names = BANKS.map((b) => b.name);
  const uniqueNames = new Set(names);
  assert.equal(names.length, uniqueNames.size, "Duplicate bank names found");
});

// Test bankByCode lookup function
test("bankByCode: finds banks by code", () => {
  const bank = bankByCode("058"); // GTBank
  assert.ok(bank);
  assert.equal(bank.name, "GTBank");
  assert.equal(bank.code, "058");
});

test("bankByCode: finds all major bank codes", () => {
  const testCases = [
    { code: "044", name: "Access Bank" },
    { code: "011", name: "First Bank of Nigeria" },
    { code: "033", name: "UBA" },
    { code: "057", name: "Zenith Bank" },
    { code: "058", name: "GTBank" },
  ];

  for (const testCase of testCases) {
    const bank = bankByCode(testCase.code);
    assert.ok(bank, `Should find bank with code ${testCase.code}`);
    assert.equal(bank.name, testCase.name);
    assert.equal(bank.code, testCase.code);
  }
});

test("bankByCode: finds microfinance banks", () => {
  const kuda = bankByCode("50211");
  assert.ok(kuda);
  assert.equal(kuda.name, "Kuda Microfinance Bank");

  const moniepoint = bankByCode("50515");
  assert.ok(moniepoint);
  assert.equal(moniepoint.name, "Moniepoint Microfinance Bank");
});

test("bankByCode: finds FinTech platforms", () => {
  const opay = bankByCode("999992");
  assert.ok(opay);
  assert.equal(opay.name, "Opay");

  const palmPay = bankByCode("999991");
  assert.ok(palmPay);
  assert.equal(palmPay.name, "PalmPay");
});

test("bankByCode: returns undefined for unknown codes", () => {
  assert.equal(bankByCode("999"), undefined);
  assert.equal(bankByCode("000"), undefined);
  assert.equal(bankByCode(""), undefined);
  assert.equal(bankByCode("INVALID"), undefined);
});

test("bankByCode: is case-sensitive", () => {
  // Codes should be case-sensitive (all uppercase NIBSS codes)
  const result = bankByCode("058");
  assert.ok(result);
  
  // Lowercase should not match
  assert.equal(bankByCode("058".toLowerCase()), undefined);
});

test("bankByCode: handles whitespace correctly", () => {
  // Leading/trailing whitespace should not match
  assert.equal(bankByCode(" 058 "), undefined);
  assert.equal(bankByCode("058 "), undefined);
  assert.equal(bankByCode(" 058"), undefined);
});

// Integration tests
test("bankByCode: returns correct bank structure", () => {
  const bank = bankByCode("044");
  assert.ok(bank);
  assert.equal(typeof bank.name, "string");
  assert.equal(typeof bank.code, "string");
  assert.ok(Object.keys(bank).includes("name"));
  assert.ok(Object.keys(bank).includes("code"));
});

test("bankByCode: all banks in BANKS list are findable", () => {
  for (const bank of BANKS) {
    const found = bankByCode(bank.code);
    assert.ok(found, `Bank ${bank.name} with code ${bank.code} should be findable`);
    assert.equal(found.code, bank.code);
    assert.equal(found.name, bank.name);
  }
});

test("BANKS: special codes for digital platforms exist", () => {
  const digitalCodes = ["999991", "999992"]; // PalmPay, Opay
  for (const code of digitalCodes) {
    const bank = bankByCode(code);
    assert.ok(bank, `Digital platform with code ${code} should exist`);
    assert.ok(bank.name.length > 0);
  }
});

test("BANKS: covers major state-based and regional banks", () => {
  const bankNames = BANKS.map((b) => b.name);
  
  // Should include regional/state banks
  const hasRegionalBanks = bankNames.some((name) =>
    /Heritage|Polaris|Stanbic|Jaiz|Wema|Unity|Sterling/i.test(name)
  );
  assert.ok(hasRegionalBanks, "Should include regional/state banks");
});
