import {
  actionPlanDataset,
  defaultActionPlanSteps,
  ActionPlanStep,
} from '@/lib/action-plan-dataset';

type MainType =
  | 'crypto'
  | 'ewallet'
  | 'parcel'
  | 'job'
  | 'loan'
  | 'romance'
  | 'ecommerce'
  | 'bank'
  | 'general';

function removeDuplicateSteps(steps: ActionPlanStep[]) {
  return steps.filter((step, index, self) => {
    const title = step.title.toLowerCase();

    return (
      index ===
      self.findIndex((otherStep) => {
        const otherTitle = otherStep.title.toLowerCase();

        if (title.includes('preserve') && otherTitle.includes('preserve')) {
          return true;
        }

        return otherTitle === title;
      })
    );
  });
}
function getMainType(text: string): MainType {
  if (/loan|interest|processing fee|approval/.test(text)) {
    return 'loan';
  }

  if (/crypto|bitcoin|usdt|telegram|investment|trading|wallet address/.test(text)) {
    return 'crypto';
  }

  if (/parcel|delivery|courier|pos laju|customs|tracking/.test(text)) {
    return 'parcel';
  }

  if (/job|part-time|task|commission|salary/.test(text)) {
    return 'job';
  }

  if (/love|romance|relationship|partner|girlfriend|boyfriend/.test(text)) {
    return 'romance';
  }

  if (/shopee|lazada|order|seller|product|purchase/.test(text)) {
    return 'ecommerce';
  }

  if (/tng|touch n go|e-wallet|ewallet|duitnow/.test(text)) {
    return 'ewallet';
  }

  if (/bank|maybank|cimb|rhb|public bank|bank transfer/.test(text)) {
    return 'bank';
  }

  return 'general';
}
function isRuleAllowedForMainType(ruleKeywords: string[], mainType: MainType) {
  const keywords = ruleKeywords.map((keyword) => keyword.toLowerCase());

  if (mainType === 'loan') {
    return (
      keywords.includes('loan') ||
      keywords.includes('interest') ||
      keywords.includes('approval') ||
      keywords.includes('processing fee')
    );
  }

  if (mainType === 'job') {
    return (
      keywords.includes('job') ||
      keywords.includes('part-time') ||
      keywords.includes('task') ||
      keywords.includes('salary') ||
      keywords.includes('commission')
    );
  }

  if (mainType === 'parcel') {
    return (
      keywords.includes('parcel') ||
      keywords.includes('delivery') ||
      keywords.includes('courier') ||
      keywords.includes('pos laju') ||
      keywords.includes('customs') ||
      keywords.includes('tracking')
    );
  }

  if (mainType === 'romance') {
    return (
      keywords.includes('love') ||
      keywords.includes('romance') ||
      keywords.includes('relationship') ||
      keywords.includes('partner') ||
      keywords.includes('girlfriend') ||
      keywords.includes('boyfriend')
    );
  }

  if (mainType === 'crypto') {
    return (
      keywords.includes('crypto') ||
      keywords.includes('investment') ||
      keywords.includes('telegram') ||
      keywords.includes('trading') ||
      keywords.includes('bitcoin')
    );
  }

  if (mainType === 'ecommerce') {
    return (
      keywords.includes('shopee') ||
      keywords.includes('lazada') ||
      keywords.includes('order') ||
      keywords.includes('seller') ||
      keywords.includes('product') ||
      keywords.includes('purchase')
    );
  }

if (mainType === 'ewallet') {
  return (
    keywords.includes('tng') ||
    keywords.includes('touch n go') ||
    keywords.includes('e-wallet') ||
    keywords.includes('duitnow') ||

    // ✅ ADD THIS PART
    keywords.includes('bank') ||
    keywords.includes('maybank') ||
    keywords.includes('cimb') ||
    keywords.includes('rhb') ||
    keywords.includes('public bank')
  );
}

  if (mainType === 'bank') {
    return (
      keywords.includes('bank') ||
      keywords.includes('maybank') ||
      keywords.includes('cimb') ||
      keywords.includes('rhb') ||
      keywords.includes('public bank')
    );
  }

  return true;
}

export function generateActionPlan(description: string): ActionPlanStep[] {
  const text = description.toLowerCase();
  const mainType = getMainType(text);

  let selectedSteps: ActionPlanStep[] = [];

  for (const rule of actionPlanDataset) {
    const matched = rule.keywords.some((keyword: string) =>
      text.includes(keyword.toLowerCase())
    );

    if (!matched) continue;

    if (!isRuleAllowedForMainType(rule.keywords, mainType)) continue;

    selectedSteps.push(...rule.steps);
  }

  selectedSteps.push(...defaultActionPlanSteps);

  selectedSteps = removeDuplicateSteps(selectedSteps);

  const priorityRank: Record<ActionPlanStep['priority'], number> = {
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  selectedSteps.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

  return selectedSteps.slice(0, 6);
}