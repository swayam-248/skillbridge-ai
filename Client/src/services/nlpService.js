import nlp from 'compromise';
import skillsData from '../data/skills.json';

export const matchSkills = (text) => {
  if (!text || text.trim().length < 2) return [];

  const lowerText = text.toLowerCase();
  
  return skillsData.filter(skill => {
    return skill.keywords.some(keyword => {
      const lowerKeyword = keyword.toLowerCase();

      // 1. Direct Phrase Match (Handles "window cleaning")
      if (lowerText.includes(lowerKeyword)) return true;

      // 2. Individual Word Match (Handles "farm work" matching "farm")
      const words = lowerKeyword.split(' ');
      return words.some(word => {
        // This regex checks if the word exists independently (not inside another word)
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(lowerText);
      });
    });
  });
};