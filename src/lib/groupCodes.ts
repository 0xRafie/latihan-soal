export const VALID_GROUP_CODES = ['BELAJAR123', 'KELOMPOK1'];

export const normalizeGroupCode = (code: string) => code.trim().toUpperCase();

export const isValidGroupCode = (code: string) => VALID_GROUP_CODES.includes(normalizeGroupCode(code));

export const formatGroupCodes = () => VALID_GROUP_CODES.map((code) => `"${code}"`).join(' atau ');
