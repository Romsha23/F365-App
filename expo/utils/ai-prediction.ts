// Add better JSON parsing with error handling
export const safeJsonParse = (text: string, fallback: any = null) => {
  try {
    if (!text || typeof text !== 'string') {
      console.warn('Invalid text provided to safeJsonParse:', typeof text);
      return fallback;
    }
    
    // Remove markdown code blocks and backticks
    let cleaned = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .replace(/`/g, '')
      .trim();
    
    // Try to find JSON object in the text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/) || cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // If no JSON object found, try parsing the whole cleaned text
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('JSON parsing failed:', error);
    console.error('Original text:', text);
    return fallback;
  }
};

// Rest of the file remains the same...