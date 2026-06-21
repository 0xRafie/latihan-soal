export const normalizeGroupCode = (code: string) => code.trim().toUpperCase();

export const isValidGroupCodeFormat = (code: string) => /^[A-Z0-9_-]{4,24}$/.test(normalizeGroupCode(code));

export const generateGroupCode = () => `GRUP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
