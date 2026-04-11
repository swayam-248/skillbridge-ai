import nlp from 'compromise';

// We removed the static skillsData import. 
// The function now accepts 'skillsFromDB' as a second parameter.
export const matchSkills = (text, skillsFromDB) => {
  // If the database hasn't loaded yet or text is too short, return empty
  if (!text || text.trim().length < 2 || !skillsFromDB) return [];

  const lowerText = text.toLowerCase();
  
  // Use the skillsFromDB array (passed from App.jsx) instead of the local file
  return skillsFromDB.filter(skill => {
    return skill.keywords.some(keyword => {
      const lowerKeyword = keyword.toLowerCase();

      // 1. Direct Phrase Match (Handles "window cleaning")
      if (lowerText.includes(lowerKeyword)) return true;

      // 2. Individual Word Match (Handles "farm work" matching "farm")
      const words = lowerKeyword.split(' ');
      return words.some(word => {
        // This regex checks if the word exists independently
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(lowerText);
      });
    });
  });
};