export type ActionPlanStep = {
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
};

export type ActionPlanRule = {
  keywords: string[];
  steps: ActionPlanStep[];
};

export const actionPlanDataset: ActionPlanRule[] = [
  // 🔹 E-WALLET / TNG
  {
    keywords: ['tng', 'touch n go', 'e-wallet', 'duitnow'],
    steps: [
      {
        title: 'Contact E-Wallet Support Immediately',
        description: 'Report the transaction and request freeze using receipt and recipient details.',
        priority: 'HIGH'
      },
      {
        title: 'Request Transaction Freeze or Investigation',
        description: 'Ask if the transaction can be flagged, frozen, or escalated.',
        priority: 'HIGH'
      }
    ]
  },

  // 🔹 BANK
  {
    keywords: ['bank', 'maybank', 'cimb', 'rhb', 'public bank'],
    steps: [
      {
        title: 'Call Your Bank Fraud Hotline',
        description: 'Contact your bank immediately to report and secure your account.',
        priority: 'HIGH'
      },
      {
        title: 'Request Account Protection',
        description: 'Ask the bank to monitor and block suspicious activity.',
        priority: 'HIGH'
      }
    ]
  },

  // 🔹 CRYPTO / INVESTMENT
  {
    keywords: ['crypto', 'investment', 'telegram', 'trading', 'bitcoin'],
    steps: [
      {
        title: 'Report Investment Scam Platform',
        description: 'Report the scam via Telegram or trading platform.',
        priority: 'HIGH'
      },
      {
        title: 'Preserve Wallet and Chat Evidence',
        description: 'Save wallet address, transaction proof, and chat screenshots.',
        priority: 'HIGH'
      },
      {
        title: 'Avoid Further Payments',
        description: 'Do not send additional funds even if asked.',
        priority: 'MEDIUM'
      }
    ]
  },

  // 🔹 CALL / IMPERSONATION
  {
    keywords: ['call', 'phone', 'impersonation', 'pretending'],
    steps: [
      {
        title: 'Preserve Call Evidence',
        description: 'Save phone number, call logs, and messages.',
        priority: 'MEDIUM'
      }
    ]
  },

  // 📦 PARCEL SCAM
  {
    keywords: ['parcel', 'delivery', 'courier', 'pos laju', 'customs'],
    steps: [
      {
        title: 'Verify Delivery Company',
        description: 'Contact the official courier service to confirm if the parcel is real.',
        priority: 'HIGH'
      },
      {
        title: 'Do Not Pay Unexpected Fees',
        description: 'Avoid paying customs or release fees requested by unknown parties.',
        priority: 'HIGH'
      },
      {
        title: 'Preserve Messages and Tracking Info',
        description: 'Save tracking numbers, messages, and payment requests.',
        priority: 'MEDIUM'
      }
    ]
  },

  // 💼 JOB SCAM
  {
    keywords: ['job', 'part-time', 'task', 'salary', 'commission'],
    steps: [
      {
        title: 'Stop All Task Payments',
        description: 'Do not continue any tasks that require upfront payments.',
        priority: 'HIGH'
      },
      {
        title: 'Report Job Platform',
        description: 'Report the scam on the platform where the job was posted.',
        priority: 'HIGH'
      },
      {
        title: 'Preserve Payment and Chat Records',
        description: 'Keep all transaction receipts and conversations.',
        priority: 'MEDIUM'
      }
    ]
  },

  // 💳 LOAN SCAM
  {
    keywords: ['loan', 'interest', 'approval', 'processing fee'],
    steps: [
      {
        title: 'Stop Further Payments',
        description: 'Do not pay additional fees for loan approval.',
        priority: 'HIGH'
      },
      {
        title: 'Report to Bank Negara Malaysia',
        description: 'Report the scam loan service to authorities.',
        priority: 'HIGH'
      },
      {
        title: 'Preserve Loan Documents',
        description: 'Keep agreements, messages, and payment proof.',
        priority: 'MEDIUM'
      }
    ]
  },

  // ❤️ ROMANCE SCAM
  {
    keywords: ['love', 'romance', 'relationship', 'partner', 'girlfriend', 'boyfriend'],
    steps: [
      {
        title: 'Cease Communication Immediately',
        description: 'Stop all contact with the scammer.',
        priority: 'HIGH'
      },
      {
        title: 'Do Not Send More Money',
        description: 'Avoid sending any further financial support.',
        priority: 'HIGH'
      },
      {
        title: 'Preserve Chat and Identity Evidence',
        description: 'Save messages, photos, and account details.',
        priority: 'MEDIUM'
      }
    ]
  },

  // 🛒 E-COMMERCE SCAM
  {
    keywords: ['shopee', 'lazada', 'order', 'seller', 'product', 'purchase'],
    steps: [
      {
        title: 'Contact Platform Support',
        description: 'Report the seller to Shopee/Lazada support immediately.',
        priority: 'HIGH'
      },
      {
        title: 'Request Refund or Dispute',
        description: 'Use the platform dispute system to recover funds.',
        priority: 'HIGH'
      },
      {
        title: 'Save Order and Payment Evidence',
        description: 'Keep order ID, receipts, and seller communication.',
        priority: 'MEDIUM'
      }
    ]
  }
];

export const defaultActionPlanSteps: ActionPlanStep[] = [
  {
    title: 'Call NSRC 997',
    description: 'Report immediately so authorities can coordinate recovery.',
    priority: 'HIGH'
  },
  {
    title: 'Preserve All Evidence',
    description: 'Keep receipts, screenshots, account details, and messages.',
    priority: 'MEDIUM'
  },
  {
    title: 'File Police Report',
    description: 'Submit a report within 24 hours at nearest police station.',
    priority: 'LOW'
  }
];