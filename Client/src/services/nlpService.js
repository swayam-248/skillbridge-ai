import nlp from 'compromise';

// Domain entity synonyms for accurate conversational trade matching
const SYNONYMS = {
  // Bathroom / Sanitation
  bathroom: ['restroom', 'toilet', 'washroom', 'bathrooms', 'restrooms', 'toilets', 'lavatory', 'shower'],
  bathrooms: ['restroom', 'toilet', 'washroom', 'bathroom', 'restrooms', 'toilets'],
  restroom: ['bathroom', 'toilet', 'washroom', 'restrooms', 'bathrooms'],
  restrooms: ['bathroom', 'toilet', 'washroom', 'restroom', 'bathrooms'],
  toilet: ['bathroom', 'restroom', 'washroom', 'toilets'],
  toilets: ['bathroom', 'restroom', 'washroom', 'toilet'],
  
  // Plumbing
  pipe: ['plumbing', 'faucet', 'drain', 'leak', 'water line', 'pipes', 'plumber', 'sink'],
  pipes: ['plumbing', 'faucet', 'drain', 'leak', 'water line', 'pipe', 'plumber', 'sink'],
  plumbing: ['pipe', 'pipes', 'leak', 'faucet', 'drain', 'sink', 'plumber'],
  plumber: ['plumbing', 'pipe', 'pipes', 'leak', 'faucet', 'drain'],
  leak: ['plumbing', 'pipe', 'water leak', 'faucet'],

  // Electrical
  wire: ['wiring', 'electrical', 'circuit', 'cable', 'breaker', 'electrician'],
  wires: ['wiring', 'electrical', 'circuit', 'cable', 'breaker', 'electrician'],
  wiring: ['wire', 'wires', 'electrical', 'circuit', 'cable', 'breaker', 'electrician'],
  electrical: ['wire', 'wiring', 'circuit', 'breaker', 'electrician'],
  electrician: ['electrical', 'wiring', 'circuit', 'wires'],

  // Painting
  paint: ['painting', 'painter', 'wall', 'primer', 'coating'],
  painting: ['paint', 'painter', 'wall', 'primer', 'coating'],
  painter: ['painting', 'paint', 'wall', 'primer'],

  // Cleaning
  clean: ['cleaning', 'cleaner', 'wash', 'sanitizing', 'scrub', 'mop'],
  cleaning: ['clean', 'cleaner', 'wash', 'sanitizing', 'scrub', 'mop'],
  cleaner: ['clean', 'cleaning', 'janitor', 'sanitation'],

  // HVAC
  ac: ['air conditioner', 'hvac', 'cooling', 'refrigerant', 'chiller'],
  hvac: ['air conditioner', 'ac', 'cooling', 'refrigerant', 'ventilation', 'heating']
};

// Generic verbs that describe actions across many trades and MUST NOT trigger matches alone
const GENERIC_VERBS = new Set([
  'clean', 'cleaning', 'wash', 'washing', 'fix', 'fixing', 'repair', 'repairing',
  'install', 'installing', 'maintain', 'maintaining', 'work', 'working',
  'do', 'doing', 'make', 'making', 'build', 'building', 'handle', 'handling',
  'operate', 'operating', 'service', 'servicing', 'help', 'helping', 'use', 'using',
  'provide', 'providing', 'apply', 'applying'
]);

// Conversational filler / stop words
const STOP_WORDS = new Set([
  'i', 'im', "i'm", 'me', 'my', 'myself', 'we', 'our', 'you', 'your', 'he', 'she', 'they',
  'it', 'this', 'that', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
  'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'of', 'at', 'by', 'for', 'with',
  'about', 'to', 'from', 'in', 'out', 'on', 'off', 'over', 'under', 'all', 'any', 'some', 'lot', 'lots'
]);

/**
 * Precision semantic scoring function
 * Evaluates how well a specific trade skill aligns with user speech
 */
export const scoreSkillMatch = (text, skill) => {
  if (!text || !skill || !Array.isArray(skill.keywords)) return 0;

  const lowerText = text.toLowerCase();
  const doc = nlp(lowerText);
  const textWords = lowerText.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w && !STOP_WORDS.has(w));
  const textRoots = doc.termList().map(t => (t.root || t.text).toLowerCase()).filter(w => !STOP_WORDS.has(w));

  // Build expanded token set with synonyms
  const expandedTextWords = new Set(textWords);
  const expandedTextRoots = new Set(textRoots);
  for (const w of textWords) {
    if (SYNONYMS[w]) {
      for (const syn of SYNONYMS[w]) {
        expandedTextWords.add(syn);
        expandedTextRoots.add(syn);
      }
    }
  }

  let maxScore = 0;

  for (const keyword of skill.keywords) {
    const lowerKeyword = keyword.toLowerCase();

    // 1. Exact phrase match in speech (highest confidence)
    if (lowerText.includes(lowerKeyword)) {
      maxScore = Math.max(maxScore, 10.0);
      continue;
    }

    const kwWords = lowerKeyword.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w && !STOP_WORDS.has(w));
    if (kwWords.length === 0) continue;

    const kwDoc = nlp(lowerKeyword);
    const kwRoots = kwDoc.termList().map(t => (t.root || t.text).toLowerCase()).filter(w => !STOP_WORDS.has(w));

    // Separate domain entity nouns from generic action verbs
    const entityWords = kwWords.filter(w => !GENERIC_VERBS.has(w));
    const entityRoots = kwRoots.filter(w => !GENERIC_VERBS.has(w));

    // Count matched domain entities
    let matchedEntities = 0;
    for (const ew of entityWords) {
      if (
        expandedTextWords.has(ew) ||
        Array.from(expandedTextWords).some(tw => tw === ew || (tw.length >= 4 && ew.length >= 4 && (tw.startsWith(ew) || ew.startsWith(tw))))
      ) {
        matchedEntities++;
      }
    }
    for (const er of entityRoots) {
      if (
        expandedTextRoots.has(er) ||
        Array.from(expandedTextRoots).some(tr => tr === er || (tr.length >= 4 && er.length >= 4 && (tr.startsWith(er) || er.startsWith(tr))))
      ) {
        matchedEntities++;
      }
    }

    // Count matched generic verbs
    let matchedGeneric = 0;
    const genericWords = kwWords.filter(w => GENERIC_VERBS.has(w));
    for (const gw of genericWords) {
      if (expandedTextWords.has(gw) || expandedTextRoots.has(gw)) {
        matchedGeneric++;
      }
    }

    // Critical rule: If the keyword contains domain entities (e.g. 'bathrooms', 'dishes', 'paint tools'),
    // it MUST match at least one domain entity! A generic action verb alone ('clean') gets 0 points.
    if (entityWords.length > 0 || entityRoots.length > 0) {
      if (matchedEntities === 0) {
        // Domain entity mismatch (e.g. 'cleaning dishes' when user said 'clean bathroom')
        continue;
      }
      const totalEntities = Math.max(1, entityWords.length + entityRoots.length);
      const ratio = matchedEntities / totalEntities;
      let score = ratio * 7.0;
      if (matchedGeneric > 0) score += 3.0; // Bonus when both the action verb and domain entity match
      maxScore = Math.max(maxScore, score);
    } else {
      // Keyword only consists of generic words
      if (matchedGeneric > 0) {
        maxScore = Math.max(maxScore, 2.5);
      }
    }
  }

  // Boost if the trade title itself directly contains a matching domain noun
  const titleWords = skill.professional_title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => !STOP_WORDS.has(w));
  for (const tw of titleWords) {
    if (!GENERIC_VERBS.has(tw) && (expandedTextWords.has(tw) || expandedTextRoots.has(tw))) {
      maxScore = Math.max(maxScore, 6.0);
    }
  }

  const titleLower = skill.professional_title.toLowerCase();
  for (const ew of expandedTextWords) {
    if (ew.length >= 4 && titleLower.includes(ew) && !GENERIC_VERBS.has(ew)) {
      maxScore += 2.5;
      break;
    }
  }

  return maxScore;
};

/**
 * Main matching export
 * Returns relevant trade skills ranked by confidence score
 */
export const matchSkills = (text, skillsFromDB) => {
  if (!text || text.trim().length < 2 || !skillsFromDB || !Array.isArray(skillsFromDB)) {
    return [];
  }

  // Score all candidate skills
  const scoredSkills = skillsFromDB
    .map(skill => ({
      ...skill,
      _confidenceScore: scoreSkillMatch(text, skill),
    }))
    .filter(skill => skill._confidenceScore >= 4.0) // Require minimum entity confidence
    .sort((a, b) => b._confidenceScore - a._confidenceScore);

  if (scoredSkills.length === 0) return [];

  const topScore = scoredSkills[0]._confidenceScore;

  // Prune low-scoring false positives relative to top match
  const filtered = scoredSkills.filter(skill => {
    if (topScore >= 9.0) {
      return skill._confidenceScore >= 7.0;
    }
    return skill._confidenceScore >= topScore * 0.65;
  });

  return filtered;
};

export default matchSkills;