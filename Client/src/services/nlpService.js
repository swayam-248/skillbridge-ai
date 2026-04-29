import nlp from 'compromise';

export const matchSkills = (text, skillsFromDB) => {
  if (!text || text.trim().length < 2 || !skillsFromDB) return [];

  const lowerText = text.toLowerCase();
  const doc = nlp(lowerText);
  
  // Get all words in their root form for broader matching
  const textRoots = doc.termList().map(t => t.root || t.text);

  return skillsFromDB.filter(skill => {
    return skill.keywords.some(keyword => {
      const lowerKeyword = keyword.toLowerCase();

      // 1. Exact phrase match
      if (lowerText.includes(lowerKeyword)) return true;

      // 2. Compromise-based smart match
      if (doc.has(lowerKeyword)) return true;

      // 3. Root-to-Root match (Matches "plumber" to "plumbing")
      const keywordDoc = nlp(lowerKeyword);
      const keywordRoots = keywordDoc.termList().map(t => t.root || t.text);
      
      const hasRootMatch = keywordRoots.some(kRoot => 
        textRoots.some(tRoot => tRoot === kRoot || tRoot.startsWith(kRoot) || kRoot.startsWith(tRoot))
      );

      if (hasRootMatch) return true;

      // 4. Individual word fallback
      const words = lowerKeyword.split(' ');
      return words.length > 0 && words.every(word => {
        if (word.length < 3) return false; // Skip tiny words like "a", "to"
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(lowerText);
      });
    });
  });
};