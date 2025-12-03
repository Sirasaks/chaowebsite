import { bankLists } from "thai-banks-logo";

export const THAI_BANKS = Object.values(bankLists).map((bank) => ({
    code: bank.symbol,
    name: bank.name,
    color: bank.color,
    logo: bank.icon,
}));
