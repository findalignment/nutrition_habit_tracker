export interface SafetyCheckResult {
  isSafe: boolean
  flag?: 'eating_disorder' | 'medical' | 'self_harm' | 'minor' | 'unsafe_content'
  message?: string
  shouldBlockResponse: boolean
}

const ED_KEYWORDS = [
  'purge', 'purging', 'binge', 'restrict', 'starve', 'starving',
  'anorexia', 'bulimia', 'throw up', 'vomit', 'laxative',
  'not eating', 'stop eating', 'hate my body', 'too fat'
]

const MEDICAL_KEYWORDS = [
  'medication', 'prescription', 'diabetes', 'insulin', 'blood pressure',
  'heart', 'kidney', 'liver', 'cancer', 'disease', 'diagnose', 'doctor'
]

const SELF_HARM_KEYWORDS = [
  'kill myself', 'suicide', 'self harm', 'cut myself', 'end it all',
  'want to die', 'hurt myself'
]

export function checkUserInputSafety(text: string): SafetyCheckResult {
  const lowerText = text.toLowerCase()

  // Check for self-harm (highest priority)
  if (SELF_HARM_KEYWORDS.some(keyword => lowerText.includes(keyword))) {
    return {
      isSafe: false,
      flag: 'self_harm',
      shouldBlockResponse: true,
      message: '⚠️ If you\'re in crisis, please contact:\n- National Suicide Prevention Lifeline: 988\n- Crisis Text Line: Text HOME to 741741\n- Emergency Services: 911'
    }
  }

  // Check for eating disorder behaviors
  if (ED_KEYWORDS.some(keyword => lowerText.includes(keyword))) {
    return {
      isSafe: false,
      flag: 'eating_disorder',
      shouldBlockResponse: true,
      message: '⚠️ I notice you may be experiencing disordered eating patterns. This app is not designed to treat eating disorders. Please consider reaching out to:\n- National Eating Disorders Association (NEDA): 1-800-931-2237\n- NEDA Crisis Text Line: Text "NEDA" to 741741\n- A qualified healthcare professional'
    }
  }

  // Check for medical advice requests
  if (MEDICAL_KEYWORDS.some(keyword => lowerText.includes(keyword))) {
    return {
      isSafe: true,
      flag: 'medical',
      shouldBlockResponse: false,
      message: '💡 This app provides general habit guidance only, not medical advice. Please consult your healthcare provider for medical questions.'
    }
  }

  return {
    isSafe: true,
    shouldBlockResponse: false,
  }
}

export function checkMinorAge(age?: number): boolean {
  if (!age) return false
  return age < 18
}

export function getSafeResponse(flag: SafetyCheckResult['flag']): string {
  switch (flag) {
    case 'eating_disorder':
      return 'I\'m designed to support healthy habit building, not treat eating disorders. Your wellbeing is important—please reach out to a qualified professional who can provide appropriate support.'
    case 'medical':
      return 'I can share general nutrition guidance, but I can\'t provide medical advice. Please consult your healthcare provider for any medical concerns or medication questions.'
    case 'self_harm':
      return 'Your safety matters. Please reach out to a crisis counselor who can help: call 988 or text HOME to 741741.'
    case 'minor':
      return 'This service is designed for adults 18+. Please work with a parent, guardian, or healthcare provider for nutrition guidance.'
    default:
      return 'I\'m here to support healthy habits. If you have concerns about your health, please consult a qualified healthcare professional.'
  }
}
