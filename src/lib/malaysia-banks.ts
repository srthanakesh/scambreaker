export type BankCategory = 'local' | 'islamic' | 'foreign' | 'digital';

export interface MalaysiaBank {
  name: string;
  short_name: string;
  category: BankCategory;
  aliases: string[];
}

export const malaysiaBanks: MalaysiaBank[] = [
  // Local
  { name: "Malayan Banking Berhad", short_name: "Maybank", category: "local", aliases: ["maybank","m2u","maybank2u","mae","maybank app"] },
  { name: "CIMB Bank Berhad", short_name: "CIMB", category: "local", aliases: ["cimb","cimb clicks","octo","octo app"] },
  { name: "Public Bank Berhad", short_name: "Public Bank", category: "local", aliases: ["public bank","pbb","pbe","pb engage","pb engage app"] },
  { name: "RHB Bank Berhad", short_name: "RHB", category: "local", aliases: ["rhb","rhb now","rhb online","rhb reflex"] },
  { name: "Hong Leong Bank Berhad", short_name: "Hong Leong", category: "local", aliases: ["hong leong","hlb","hlb connect","connect app"] },
  { name: "AmBank (M) Berhad", short_name: "AmBank", category: "local", aliases: ["ambank","amonline","am bank app"] },
  { name: "Affin Bank Berhad", short_name: "Affin", category: "local", aliases: ["affin","affin bank","affin always","affinmax"] },
  { name: "Alliance Bank Malaysia Berhad", short_name: "Alliance Bank", category: "local", aliases: ["alliance bank","alliance","alliance online"] },
  { name: "Bank Simpanan Nasional", short_name: "BSN", category: "local", aliases: ["bsn","mybsn","bsn online"] },
  { name: "Agrobank", short_name: "Agrobank", category: "local", aliases: ["agrobank","agro bank"] },
  { name: "Bank Kerjasama Rakyat Malaysia Berhad", short_name: "Bank Rakyat", category: "local", aliases: ["bank rakyat","rakyat","irakyat"] },

  // Islamic
  { name: "Bank Islam Malaysia Berhad", short_name: "Bank Islam", category: "islamic", aliases: ["bank islam","bimb","go by bank islam","bank islam app"] },
  { name: "Bank Muamalat Malaysia Berhad", short_name: "Bank Muamalat", category: "islamic", aliases: ["bank muamalat","bmm","muamalat","i-muamalat"] },
  { name: "Maybank Islamic Berhad", short_name: "Maybank Islamic", category: "islamic", aliases: ["maybank islamic","m2u islamic","mae islamic"] },
  { name: "CIMB Islamic Bank Berhad", short_name: "CIMB Islamic", category: "islamic", aliases: ["cimb islamic","octo islamic"] },
  { name: "Public Islamic Bank Berhad", short_name: "Public Islamic", category: "islamic", aliases: ["public islamic","pbe islamic"] },
  { name: "RHB Islamic Bank Berhad", short_name: "RHB Islamic", category: "islamic", aliases: ["rhb islamic"] },
  { name: "Hong Leong Islamic Bank Berhad", short_name: "HLB Islamic", category: "islamic", aliases: ["hlb islamic"] },
  { name: "AmIslamic Bank Berhad", short_name: "AmBank Islamic", category: "islamic", aliases: ["amislamic","ambank islamic"] },
  { name: "Affin Islamic Bank Berhad", short_name: "Affin Islamic", category: "islamic", aliases: ["affin islamic"] },
  { name: "Alliance Islamic Bank Berhad", short_name: "Alliance Islamic", category: "islamic", aliases: ["alliance islamic"] },
  { name: "HSBC Amanah Malaysia Berhad", short_name: "HSBC Amanah", category: "islamic", aliases: ["hsbc amanah"] },
  { name: "OCBC Al-Amin Bank Berhad", short_name: "OCBC Al-Amin", category: "islamic", aliases: ["ocbc al amin","ocbc islamic"] },
  { name: "Kuwait Finance House (Malaysia) Berhad", short_name: "KFH", category: "islamic", aliases: ["kfh","kuwait finance house"] },
  { name: "Al Rajhi Banking & Investment Corporation (Malaysia) Berhad", short_name: "Al Rajhi", category: "islamic", aliases: ["al rajhi","arm"] },

  // Foreign
  { name: "HSBC Bank Malaysia Berhad", short_name: "HSBC", category: "foreign", aliases: ["hsbc","hsbc malaysia","hsbc online"] },
  { name: "OCBC Bank (Malaysia) Berhad", short_name: "OCBC", category: "foreign", aliases: ["ocbc","ocbc malaysia","velocity"] },
  { name: "Standard Chartered Bank Malaysia Berhad", short_name: "Standard Chartered", category: "foreign", aliases: ["standard chartered","scb","sc mobile"] },
  { name: "United Overseas Bank (Malaysia) Berhad", short_name: "UOB", category: "foreign", aliases: ["uob","uob malaysia","uob mighty"] },
  { name: "Bank of China (Malaysia) Berhad", short_name: "Bank of China", category: "foreign", aliases: ["bank of china","bocm"] },
  { name: "Bank of America Malaysia Berhad", short_name: "Bank of America", category: "foreign", aliases: ["bank of america","bofa"] },
  { name: "Deutsche Bank (Malaysia) Berhad", short_name: "Deutsche Bank", category: "foreign", aliases: ["deutsche bank","db"] },
  { name: "Bangkok Bank Berhad", short_name: "Bangkok Bank", category: "foreign", aliases: ["bangkok bank"] },
  { name: "China Construction Bank (Malaysia) Berhad", short_name: "CCB", category: "foreign", aliases: ["ccb","china construction bank"] },
  { name: "J.P. Morgan Chase Bank Berhad", short_name: "JPMorgan", category: "foreign", aliases: ["jp morgan","jpmorgan"] },
  { name: "Sumitomo Mitsui Banking Corporation Malaysia Berhad", short_name: "SMBC", category: "foreign", aliases: ["smbc","sumitomo mitsui"] },

  // Digital
  { name: "GX Bank Berhad", short_name: "GX Bank", category: "digital", aliases: ["gx bank","gxbank"] },
  { name: "Boost Bank Berhad", short_name: "Boost Bank", category: "digital", aliases: ["boost bank","boost"] },
  { name: "AEON Bank Berhad", short_name: "AEON Bank", category: "digital", aliases: ["aeon bank","aeon"] },
  { name: "YTL Digital Bank Berhad", short_name: "Ryt Bank", category: "digital", aliases: ["ryt bank","ytl bank"] },
];

/**
 * Resolve a bank name, short name, or alias to the canonical MalaysiaBank record.
 * Returns null if no match found.
 */
export function resolveBank(input: string): MalaysiaBank | null {
  if (!input || !input.trim()) return null;
  const normalized = input.trim().toLowerCase();

  // 1. Exact match on short_name
  let match = malaysiaBanks.find(b => b.short_name.toLowerCase() === normalized);
  if (match) return match;

  // 2. Exact match on name
  match = malaysiaBanks.find(b => b.name.toLowerCase() === normalized);
  if (match) return match;

  // 3. Match on alias
  match = malaysiaBanks.find(b => b.aliases.some(a => a.toLowerCase() === normalized));
  if (match) return match;

  // 4. Partial match: input is contained in short_name, name, or alias
  match = malaysiaBanks.find(b =>
    b.short_name.toLowerCase().includes(normalized) ||
    b.name.toLowerCase().includes(normalized) ||
    b.aliases.some(a => a.toLowerCase().includes(normalized))
  );
  if (match) return match;

  // 5. Partial match: alias or short_name is contained in input
  match = malaysiaBanks.find(b =>
    normalized.includes(b.short_name.toLowerCase()) ||
    b.aliases.some(a => normalized.includes(a.toLowerCase()))
  );
  return match ?? null;
}

/**
 * Scan a text string for any bank references and return all matched banks.
 * Tries to find the best match for each bank mentioned, preferring destination bank context.
 */
export function extractBanksFromText(text: string): { bank: MalaysiaBank; isDestination: boolean }[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const results: { bank: MalaysiaBank; isDestination: boolean }[] = [];
  const seen = new Set<string>();

  // Check for destination context patterns first
  const destPattern = new RegExp(
    `(?:to|into|akaun|account|masuk|transfer|receive|recipient|bayar)\\s+(${malaysiaBanks.flatMap(b => [b.short_name, ...b.aliases]).join('|')})`,
    'i'
  );
  const destMatch = text.match(destPattern);

  for (const bank of malaysiaBanks) {
    if (seen.has(bank.short_name)) continue;

    const allNames = [bank.short_name, bank.name, ...bank.aliases];
    const isMentioned = allNames.some(n => lower.includes(n.toLowerCase()));

    if (isMentioned) {
      const isDestination = destMatch && allNames.some(n =>
        n.toLowerCase() === destMatch[1]?.toLowerCase()
      );
      seen.add(bank.short_name);
      results.push({ bank, isDestination: !!isDestination });
    }
  }

  return results;
}
