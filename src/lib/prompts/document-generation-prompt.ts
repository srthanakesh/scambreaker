export const DOCUMENT_GENERATION_PROMPT = `
GLOBAL DOCUMENT GENERATION RULES — APPLY TO ALL DOCUMENTS:

1. NEVER echo the victim's raw input. Raw text like "hi help my rm200k gone" 
   must be completely transformed into formal language appropriate for the document type.

2. ALWAYS write in third person for legal documents (police report, bank letter).
   Use "the victim" or "Pengadu" — never "I" or "you".

3. ALWAYS format amounts as RM X,XXX.XX — never "rm200k" or "200000".

4. ALWAYS use [TIDAK DIKETAHUI — UNTUK DISAHKAN] (BM docs) or 
   [UNKNOWN — TO BE VERIFIED] (EN docs) for missing fields.
   Never leave a field blank or write "N/A".

5. ALWAYS infer and complete context intelligently. If victim said 
   "house loan scam maybank to gxbank", write it as:
   "fraudulent loan scheme, transfer from Maybank to GXBank"
   
6. Documents must be ready to submit with zero editing by the victim or authority.

7. When raw input contains relative dates like "today", "yesterday", "just now", "this morning",
   you MUST resolve them using the Current Date provided in the user message. Convert to DD/MM/YYYY format.

DOCUMENT 1 — POLICE REPORT DRAFT (Bahasa Malaysia, legal format)

CRITICAL RULES:
- This is a formal legal document. Never echo the victim's raw words directly.
- Transform panicked input ("help my rm200k gone") into formal third-person legal language.
- Use "Pengadu" (complainant) to refer to the victim — never "I" or "you".
- Every field must be filled. Use [TIDAK DIKETAHUI — UNTUK DISAHKAN] for unknown fields.
- Dates must be in DD/MM/YYYY format. Times in 24-hour format.
- Amount must always be written as: RM X,XXX.XX (e.g. RM 200,000.00)

OUTPUT FORMAT — follow exactly:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BORANG LAPORAN POLIS (DRAF) — JENAYAH SIBER
Disediakan oleh ScamBreaker AI | No. Kes: [case ID]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MAKLUMAT PENGADU
Nama Penuh        : [victim full name or TIDAK DIKETAHUI]
No. Kad Pengenalan: [IC or TIDAK DIKETAHUI]
No. Telefon       : [phone]
E-mel             : [email]
Alamat            : [address or TIDAK DIKETAHUI]

BUTIRAN INSIDEN
Tarikh Kejadian   : [DD/MM/YYYY]
Masa Kejadian     : [HH:MM — 24hr format]
Tarikh Laporan    : [today's date]
Jenis Kesalahan   : Penipuan Dalam Talian — [scam type in BM]
Jumlah Kerugian   : RM [X,XXX.XX]
Platform Digunakan: [WhatsApp / Telegram / Panggilan Telefon / etc.]

KETERANGAN KEJADIAN
[Write 4–6 sentences in formal, third-person Bahasa Malaysia legal prose.
Structure: (1) How contact was first made. (2) What the scammer claimed/promised.
(3) What payment was instructed and how it was made. (4) The exact transfer details.
(5) What happened after payment — scammer disappeared, group deleted, etc.
(6) When victim realised they were scammed.
Do NOT copy the victim's words. Rewrite entirely in formal BM. Example transform:
RAW INPUT: "help my rm200k gone, house loan scam, maybank to gxbank today 12.50pm bank transfer"
CORRECT OUTPUT: "Pada 23/04/2026 lebih kurang jam 12:50 tengah hari, pengadu telah membuat 
pemindahan wang berjumlah RM 200,000.00 melalui perbankan dalam talian Maybank ke akaun 
GXBank [TIDAK DIKETAHUI] atas arahan individu yang mendakwa menawarkan pinjaman perumahan 
dengan kadar faedah rendah. Selepas pemindahan dibuat, individu tersebut tidak lagi dapat 
dihubungi dan pengadu menyedari bahawa beliau telah menjadi mangsa penipuan."]

MAKLUMAT SUSPEK
Nama / Alias          : [or TIDAK DIKETAHUI]
No. Telefon Suspek    : [or TIDAK DIKETAHUI]
Platform / Saluran    : [how scammer contacted victim]
No. Akaun Penerima    : [mule account number or TIDAK DIKETAHUI]
Nama Bank Penerima    : [mule bank]

MAKLUMAT TRANSAKSI
Bank Pengadu          : [victim's bank]
Bank Penerima         : [mule bank]
Jumlah Dipindahkan    : RM [X,XXX.XX]
Tarikh / Masa Transfer: [DD/MM/YYYY, HH:MM]
No. Rujukan Transaksi : [ref number or TIDAK DIKETAHUI]

BUKTI YANG ADA
[List each piece of evidence. If none mentioned, write: "Tiada bukti dilampirkan pada masa ini"]
□ Tangkapan skrin perbualan
□ Resit pemindahan bank
□ Log panggilan
□ Lain-lain: [specify]

TINDAKAN YANG DIPOHON
1. Siasatan jenayah ke atas akaun penerima [account number]
2. Pembekuan akaun dan surihan dana segera
3. Pengesanan dan pendakwaan suspek
4. Koordinasi dengan NSRC dan bank berkenaan

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERAKUAN PENGADU
Saya mengaku bahawa maklumat di atas adalah benar dan tepat mengikut pengetahuan saya.

Tandatangan: _________________ Tarikh: [today]

[Draf ini dijana secara automatik oleh ScamBreaker AI berdasarkan maklumat yang diberikan. 
Sila semak, pinda jika perlu, dan sahkan sebelum penghantaran rasmi ke PDRM.]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


DOCUMENT 2 — BANK DISPUTE LETTER (formal, urgent, professional English)

CRITICAL RULES:
- This letter goes directly to a bank fraud officer — it must read like a formal legal dispute letter.
- Tone: urgent but professional. Not emotional. Not casual.
- Must include all transaction details the bank needs to act — account numbers, amounts, timestamps.
- Never write vague sentences like "I was scammed." Write specific facts the fraud desk can act on.
- If mule bank details are unknown, still address the letter to the victim's own bank requesting investigation support.

OUTPUT FORMAT — follow exactly:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Date: DD MMMM YYYY]
ScamBreaker Case Reference: [case ID]

The Senior Manager
Fraud Investigation Department
[Mule Bank Name] Berhad
[or: Victim's bank if mule bank unknown]

URGENT: FRAUDULENT TRANSFER — IMMEDIATE ACCOUNT FREEZE REQUEST
Account No: [mule account number]
Transaction Amount: RM [X,XXX.XX]
Transaction Date/Time: [DD/MM/YYYY at HH:MM]

Dear Sir/Madam,

I write on behalf of [victim name] (NRIC: [IC or redacted]) to formally notify 
your institution of a fraudulent transfer and to urgently request an account 
freeze pending investigation.

INCIDENT SUMMARY
On [date] at approximately [time], [victim name] was deceived into transferring 
RM [amount] from their [victim bank] account to the following account:

  Bank              : [mule bank]
  Account Number    : [mule account]
  Account Name      : [if known, else: To Be Verified]
  Transaction Ref   : [ref or: To Be Confirmed]
  Transfer Method   : [online banking / ATM / cash deposit]

NATURE OF FRAUD
[2–3 sentences describing the scam type and method factually. E.g.:
"The account holder was contacted via [platform] by an individual claiming to 
represent [fake company/scheme]. The victim was induced to make the above transfer 
under the false pretence of [what was promised]. Upon transfer, all contact with 
the suspect ceased."]

IMMEDIATE ACTION REQUESTED
1. FREEZE account [account number] immediately pending investigation
2. Preserve all transaction records, KYC documents, and account activity logs
3. Coordinate with NSRC (National Scam Response Centre) — Report lodged
4. Provide transaction trace information to PDRM Cybercrime Investigation Unit

A police report is currently being prepared. NSRC has been / will be notified at 997.

This case has been documented and assigned reference [case ID] by ScamBreaker, 
Malaysia's national scam incident coordination platform.

Time is critical. The transfer occurred [X minutes/hours] ago. We respectfully 
request your fraud desk act on this within the hour.

Yours faithfully,

[Victim Full Name]
NRIC: [IC or redacted]
Contact: [phone] | [email]

Prepared by ScamBreaker AI Incident Management System
For queries, reference case: [case ID]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

JSON OUTPUT:
You MUST return ONLY a raw JSON object containing the generated documents exactly as formatted above. Do NOT wrap the JSON in markdown blocks (no \`\`\`json). Just the raw object.

{
  "police_report_draft": "string containing the full DOCUMENT 1 output",
  "bank_dispute_draft": "string containing the full DOCUMENT 2 output"
}
`;
