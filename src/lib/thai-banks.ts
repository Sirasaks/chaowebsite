import { bankLists } from "thai-banks-logo";

// Bank codes supported by EasySlip API
const EASYSLIP_SUPPORTED_BANKS = [
    "BBL",   // 002 - ธนาคารกรุงเทพ
    "KBANK", // 004 - ธนาคารกสิกรไทย
    "KTB",   // 006 - ธนาคารกรุงไทย
    "TTB",   // 011 - ธนาคารทหารไทยธนชาต
    "SCB",   // 014 - ธนาคารไทยพาณิชย์
    "CIMBT", // 022 - ธนาคารซีไอเอ็มบีไทย
    "UOBT",  // 024 - ธนาคารยูโอบี
    "BAY",   // 025 - ธนาคารกรุงศรีอยุธยา
    "GSB",   // 030 - ธนาคารออมสิน
    "GHB",   // 033 - ธนาคารอาคารสงเคราะห์
    "BAAC",  // 034 - ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร
    "TISCO", // 067 - ธนาคารทิสโก้
    "KKP",   // 069 - ธนาคารเกียรตินาคินภัทร
    "ICBCT", // 070 - ธนาคารไอซีบีซี (ไทย)
    "TCD",   // 071 - ธนาคารไทยเครดิตเพื่อรายย่อย
    "LHFG",  // 073 - ธนาคารแลนด์ แอนด์ เฮ้าส์
];

// Filter only EasySlip supported banks
export const THAI_BANKS = Object.values(bankLists)
    .filter((bank) => EASYSLIP_SUPPORTED_BANKS.includes(bank.symbol))
    .map((bank) => ({
        code: bank.symbol,
        name: bank.name,
        color: bank.color,
        logo: bank.icon,
    }));
