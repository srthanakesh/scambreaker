export const agencies = [
  {
    "agency_id": "NSRC",
    "name": "National Scam Response Centre",
    "role": "Central coordination hub",
    "handles": ["all scam types", "cross-agency coordination", "urgent scam response"],
    "keywords": ["scam", "fraud", "urgent transfer", "online scam", "stolen funds"],
    "priority_focus": "all high-risk cases",
    "can_escalate_to": ["PDRM_CCID", "BNM", "MCMC", "CYBERSECURITY_MY", "PAYNET", "NFP", "FMOS", "PIDM"]
  },
  {
    "agency_id": "PDRM_CCID",
    "name": "Royal Malaysia Police - Commercial Crime Investigation Department",
    "role": "Criminal investigation",
    "handles": ["investment scam", "loan scam", "phone scam", "impersonation", "mule-account-linked fraud"],
    "keywords": ["police report", "loan scam", "fake officer", "whatsapp scam", "fraud case"],
    "priority_focus": "criminal fraud cases",
    "can_escalate_to": ["NSRC", "BNM"]
  },
  {
    "agency_id": "BNM",
    "name": "Bank Negara Malaysia",
    "role": "Banking fraud and financial regulation",
    "handles": ["unauthorized transactions", "bank transfer fraud", "banking safeguards", "mule-account controls"],
    "keywords": ["bank transfer", "account freeze", "unauthorized debit", "online banking fraud", "mule account"],
    "priority_focus": "financial transaction recovery and regulatory intervention",
    "can_escalate_to": ["NSRC", "PDRM_CCID", "PAYNET", "NFP", "FMOS"]
  },
  {
    "agency_id": "MCMC",
    "name": "Malaysian Communications and Multimedia Commission",
    "role": "Telecom and digital communication abuse",
    "handles": ["sms scam", "phone number spoofing", "whatsapp scam", "phishing links"],
    "keywords": ["sms", "whatsapp", "telegram", "phishing link", "phone number"],
    "priority_focus": "communication channel abuse",
    "can_escalate_to": ["PDRM_CCID", "NSRC", "CYBERSECURITY_MY"]
  },
  {
    "agency_id": "CYBERSECURITY_MY",
    "name": "CyberSecurity Malaysia",
    "role": "Digital forensics and cyber threats",
    "handles": ["phishing sites", "malware", "fake websites", "account hacking"],
    "keywords": ["link", "website", "login theft", "hacked account", "fake portal"],
    "priority_focus": "cyber attack cases",
    "can_escalate_to": ["PDRM_CCID", "NSRC", "MCMC"]
  },
  {
    "agency_id": "PAYNET",
    "name": "Payments Network Malaysia",
    "role": "National payments infrastructure support",
    "handles": ["interbank payment tracing", "fraud signal coordination", "payment-rail analysis"],
    "keywords": ["duitnow", "interbank transfer", "payment rail", "transaction trace"],
    "priority_focus": "payment network tracing",
    "can_escalate_to": ["NSRC", "BNM", "NFP"]
  },
  {
    "agency_id": "NFP",
    "name": "National Fraud Portal",
    "role": "Fraud operations and tracing support platform",
    "handles": ["fraud case workflow", "stolen fund tracing", "incident coordination"],
    "keywords": ["fraud portal", "trace funds", "incident workflow", "fraud alert"],
    "priority_focus": "coordinated fraud operations",
    "can_escalate_to": ["NSRC", "BNM", "PAYNET"]
  },
  {
    "agency_id": "FMOS",
    "name": "Financial Markets Ombudsman Service",
    "role": "Financial dispute resolution",
    "handles": ["banking disputes", "unauthorized transaction disputes", "complaints against financial providers"],
    "keywords": ["bank dispute", "complaint outcome", "unauthorized transaction", "financial complaint"],
    "priority_focus": "consumer redress after unresolved complaints",
    "can_escalate_to": ["BNM", "NSRC"]
  },
  {
    "agency_id": "PIDM",
    "name": "Perbadanan Insurans Deposit Malaysia",
    "role": "Deposit insurance and scam-awareness support",
    "handles": ["deposit protection queries", "member bank verification", "PIDM impersonation scam context"],
    "keywords": ["insured deposit", "PIDM member", "deposit protection", "fake PIDM"],
    "priority_focus": "deposit protection clarification and scam impersonation awareness",
    "can_escalate_to": ["BNM", "NSRC"]
  },
  {
    "agency_id": "MAYBANK",
    "name": "Malayan Banking Berhad (Maybank)",
    "role": "Domestic commercial bank fraud response",
    "handles": ["customer fraud complaints", "unauthorized transfers", "account compromise", "online banking scam cases"],
    "keywords": ["maybank", "maybank2u", "mae", "unauthorized transfer", "bank account"],
    "priority_focus": "customer-level scam containment and transaction review",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET"]
  },
  {
    "agency_id": "CIMB_BANK",
    "name": "CIMB Bank Berhad",
    "role": "Domestic commercial bank fraud response",
    "handles": ["customer fraud complaints", "unauthorized transfers", "account compromise"],
    "keywords": ["cimb", "cimb clicks", "bank transfer", "unauthorized debit"],
    "priority_focus": "customer-level scam containment and transaction review",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET"]
  },
  {
    "agency_id": "PUBLIC_BANK",
    "name": "Public Bank Berhad",
    "role": "Domestic commercial bank fraud response",
    "handles": ["customer fraud complaints", "unauthorized transfers", "account compromise"],
    "keywords": ["public bank", "pb engage", "pbe", "unauthorized transaction"],
    "priority_focus": "customer-level scam containment and transaction review",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET"]
  },
  {
    "agency_id": "RHB_BANK",
    "name": "RHB Bank Berhad",
    "role": "Domestic commercial bank fraud response",
    "handles": ["customer fraud complaints", "transaction review", "account compromise"],
    "keywords": ["rhb", "rhb now", "fraud report", "bank transfer"],
    "priority_focus": "customer-level scam containment and transaction review",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET"]
  },
  {
    "agency_id": "HLB",
    "name": "Hong Leong Bank Berhad",
    "role": "Domestic commercial bank fraud response",
    "handles": ["customer fraud complaints", "online banking fraud", "account compromise"],
    "keywords": ["hong leong bank", "hlb connect", "unauthorized transfer"],
    "priority_focus": "customer-level scam containment and transaction review",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET"]
  },
  {
    "agency_id": "ALLIANCE_BANK",
    "name": "Alliance Bank Malaysia Berhad",
    "role": "Domestic commercial bank fraud response",
    "handles": ["customer fraud complaints", "online transfer fraud", "account compromise"],
    "keywords": ["alliance bank", "bank transfer", "account issue"],
    "priority_focus": "customer-level scam containment and transaction review",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET"]
  },
  {
    "agency_id": "AMBANK",
    "name": "AmBank (M) Berhad",
    "role": "Domestic commercial bank fraud response",
    "handles": ["customer fraud complaints", "unauthorized transfers", "account compromise"],
    "keywords": ["ambank", "amonline", "unauthorized debit"],
    "priority_focus": "customer-level scam containment and transaction review",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET"]
  },
  {
    "agency_id": "AFFIN_BANK",
    "name": "Affin Bank Berhad",
    "role": "Domestic commercial bank fraud response",
    "handles": ["customer fraud complaints", "account compromise", "transaction disputes"],
    "keywords": ["affin bank", "affinalways", "transfer fraud"],
    "priority_focus": "customer-level scam containment and transaction review",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET"]
  },
  {
    "agency_id": "BANK_ISLAM",
    "name": "Bank Islam Malaysia Berhad",
    "role": "Islamic bank fraud response",
    "handles": ["customer fraud complaints", "unauthorized transfers", "account compromise"],
    "keywords": ["bank islam", "be u", "bank islam transfer fraud"],
    "priority_focus": "Islamic banking customer scam response",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET", "PIDM"]
  },
  {
    "agency_id": "BANK_MUAMALAT",
    "name": "Bank Muamalat Malaysia Berhad",
    "role": "Islamic bank fraud response",
    "handles": ["customer fraud complaints", "unauthorized transfers", "account compromise"],
    "keywords": ["bank muamalat", "i-muamalat", "transfer fraud"],
    "priority_focus": "Islamic banking customer scam response",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET", "PIDM"]
  },
  {
    "agency_id": "CIMB_ISLAMIC",
    "name": "CIMB Islamic Bank Berhad",
    "role": "Islamic bank fraud response",
    "handles": ["customer fraud complaints", "account compromise", "transaction review"],
    "keywords": ["cimb islamic", "cimb clicks islamic", "bank scam"],
    "priority_focus": "Islamic banking customer scam response",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET", "PIDM"]
  },
  {
    "agency_id": "MAYBANK_ISLAMIC",
    "name": "Maybank Islamic Berhad",
    "role": "Islamic bank fraud response",
    "handles": ["customer fraud complaints", "account compromise", "unauthorized transfer cases"],
    "keywords": ["maybank islamic", "mae", "islamic banking fraud"],
    "priority_focus": "Islamic banking customer scam response",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET", "PIDM"]
  },
  {
    "agency_id": "RHB_ISLAMIC",
    "name": "RHB Islamic Bank Berhad",
    "role": "Islamic bank fraud response",
    "handles": ["customer fraud complaints", "account compromise", "transaction disputes"],
    "keywords": ["rhb islamic", "rhb online fraud"],
    "priority_focus": "Islamic banking customer scam response",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET", "PIDM"]
  },
  {
    "agency_id": "AMBANK_ISLAMIC",
    "name": "AmBank Islamic Berhad",
    "role": "Islamic bank fraud response",
    "handles": ["customer fraud complaints", "transaction disputes", "account compromise"],
    "keywords": ["ambank islamic", "amonline islamic", "transfer fraud"],
    "priority_focus": "Islamic banking customer scam response",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET", "PIDM"]
  },
  {
    "agency_id": "HONG_LEONG_ISLAMIC",
    "name": "Hong Leong Islamic Bank Berhad",
    "role": "Islamic bank fraud response",
    "handles": ["customer fraud complaints", "online banking scam", "account compromise"],
    "keywords": ["hong leong islamic", "hlisam", "online fraud"],
    "priority_focus": "Islamic banking customer scam response",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET", "PIDM"]
  },
  {
    "agency_id": "HSBC_MY",
    "name": "HSBC Bank Malaysia Berhad",
    "role": "Foreign bank fraud response",
    "handles": ["customer fraud complaints", "unauthorized transaction cases", "account compromise"],
    "keywords": ["hsbc malaysia", "hsbc online banking", "bank fraud"],
    "priority_focus": "foreign bank customer scam response",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET", "PIDM"]
  },
  {
    "agency_id": "OCBC_MY",
    "name": "OCBC Bank (Malaysia) Berhad",
    "role": "Foreign bank fraud response",
    "handles": ["customer fraud complaints", "unauthorized transaction cases", "account compromise"],
    "keywords": ["ocbc malaysia", "ocbc online banking", "bank fraud"],
    "priority_focus": "foreign bank customer scam response",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET", "PIDM"]
  },
  {
    "agency_id": "UOB_MY",
    "name": "United Overseas Bank (Malaysia) Berhad",
    "role": "Foreign bank fraud response",
    "handles": ["customer fraud complaints", "unauthorized transaction cases", "account compromise"],
    "keywords": ["uob malaysia", "uob tmrw", "bank fraud"],
    "priority_focus": "foreign bank customer scam response",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET", "PIDM"]
  },
  {
    "agency_id": "SCB_MY",
    "name": "Standard Chartered Bank Malaysia Berhad",
    "role": "Foreign bank fraud response",
    "handles": ["customer fraud complaints", "transaction disputes", "account compromise"],
    "keywords": ["standard chartered malaysia", "sc mobile", "bank fraud"],
    "priority_focus": "foreign bank customer scam response",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET", "PIDM"]
  },
  {
    "agency_id": "CITIBANK_MY",
    "name": "Citibank Berhad",
    "role": "Foreign bank fraud response",
    "handles": ["customer fraud complaints", "unauthorized transaction cases", "account compromise"],
    "keywords": ["citibank malaysia", "citi online", "bank fraud"],
    "priority_focus": "foreign bank customer scam response",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET", "PIDM"]
  },
  {
    "agency_id": "BANK_OF_CHINA_MY",
    "name": "Bank of China (Malaysia) Berhad",
    "role": "Foreign bank fraud response",
    "handles": ["customer fraud complaints", "transaction disputes", "account compromise"],
    "keywords": ["bank of china malaysia", "online banking fraud"],
    "priority_focus": "foreign bank customer scam response",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET", "PIDM"]
  },
  {
    "agency_id": "BANGKOK_BANK_MY",
    "name": "Bangkok Bank Berhad",
    "role": "Foreign bank fraud response",
    "handles": ["customer fraud complaints", "transaction disputes", "account compromise"],
    "keywords": ["bangkok bank malaysia", "bank fraud", "unauthorized transaction"],
    "priority_focus": "foreign bank customer scam response",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET", "PIDM"]
  },
  {
    "agency_id": "GX_BANK",
    "name": "GX Bank Berhad",
    "role": "Digital bank fraud response",
    "handles": ["digital account fraud", "unauthorized transfers", "app-based scam cases"],
    "keywords": ["gx bank", "digital bank", "app fraud", "unauthorized transfer"],
    "priority_focus": "digital banking scam response",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET", "PIDM"]
  },
  {
    "agency_id": "BOOST_BANK",
    "name": "Boost Bank Berhad",
    "role": "Digital bank fraud response",
    "handles": ["digital account fraud", "unauthorized transfers", "app-based scam cases"],
    "keywords": ["boost bank", "digital bank", "app fraud", "unauthorized transfer"],
    "priority_focus": "digital banking scam response",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET", "PIDM"]
  },
  {
    "agency_id": "AEON_BANK",
    "name": "AEON Bank (M) Berhad",
    "role": "Islamic digital bank fraud response",
    "handles": ["digital account fraud", "unauthorized transfers", "app-based scam cases"],
    "keywords": ["aeon bank", "islamic digital bank", "app fraud", "unauthorized transfer"],
    "priority_focus": "digital Islamic banking scam response",
    "can_escalate_to": ["NSRC", "BNM", "PDRM_CCID", "PAYNET", "PIDM"]
  }
];