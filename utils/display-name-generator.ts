import { generateText } from "@rork-ai/toolkit-sdk";

const COOL_NAME_PREFIXES = [
  'Luna', 'Nova', 'Aura', 'Bloom', 'Celeste', 'Ember', 'Flora', 'Glow',
  'Iris', 'Jade', 'Kira', 'Lumi', 'Misty', 'Nyx', 'Opal', 'Pearl',
  'Quinn', 'Rosie', 'Sage', 'Terra', 'Uma', 'Vela', 'Wren', 'Xara',
  'Yuna', 'Zara', 'Aria', 'Bree', 'Cleo', 'Dahlia', 'Elara', 'Faye',
  'Gemma', 'Halo', 'Ivy', 'Juno', 'Kali', 'Lyra', 'Mika', 'Nola',
  'Orla', 'Pixie', 'Remy', 'Stella', 'Thea', 'Vesper', 'Willow', 'Zuri',
];

const COOL_NAME_SUFFIXES = [
  'Star', 'Moon', 'Sky', 'Spark', 'Glow', 'Bloom', 'Ray', 'Dawn',
  'Mist', 'Fern', 'Dove', 'Fox', 'Bee', 'Cat', 'Wave', 'Petal',
  'Cloud', 'Frost', 'Rain', 'Sun', 'Leaf', 'Wing', 'Drop', 'Rose',
];

export function generateQuickCoolName(): string {
  const prefix = COOL_NAME_PREFIXES[Math.floor(Math.random() * COOL_NAME_PREFIXES.length)];
  const suffix = COOL_NAME_SUFFIXES[Math.floor(Math.random() * COOL_NAME_SUFFIXES.length)];
  return `${prefix}${suffix}`;
}

export async function generateAICoolName(): Promise<string> {
  try {
    const result = await generateText({
      messages: [
        {
          role: "user",
          content: "Generate ONE unique, cute, and cool display name for a women's wellness app user. It should be whimsical, empowering, and nature/cosmic inspired. Examples: LunaSpark, NovaBloom, CelesteFox, EmberGlow, MistyPetal. Just return the name, nothing else. No quotes, no explanation. Make it 2 words combined (CamelCase), max 14 characters total."
        }
      ],
    });

    const cleaned = result.trim().replace(/[^a-zA-Z]/g, '');
    if (cleaned.length >= 4 && cleaned.length <= 16) {
      return cleaned;
    }
    return generateQuickCoolName();
  } catch (error) {
    console.log('[DisplayNameGen] AI generation failed, using local fallback:', error);
    return generateQuickCoolName();
  }
}
