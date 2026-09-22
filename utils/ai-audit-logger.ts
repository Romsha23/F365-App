import { auditLogger } from './audit-logger';

type AIInteractionType = 
  | 'chat'
  | 'mood_prediction'
  | 'mood_explanation'
  | 'weekly_summary'
  | 'monthly_reflection'
  | 'personalized_tip';

type AIAuditEntry = {
  userUniqueId: string;
  interactionType: AIInteractionType;
  prompt?: string;
  responseLength: number;
  timestamp: string;
  tokensUsed?: number;
  modelUsed?: string;
};

class AIAuditLogger {
  private interactions: AIAuditEntry[] = [];
  private maxLocalInteractions: number = 500;
  
  public logAIInteraction(
    userUniqueId: string,
    interactionType: AIInteractionType,
    details: {
      prompt?: string;
      responseLength: number;
      tokensUsed?: number;
      modelUsed?: string;
    }
  ): void {
    const entry: AIAuditEntry = {
      userUniqueId,
      interactionType,
      prompt: details.prompt ? this.sanitizePrompt(details.prompt) : undefined,
      responseLength: details.responseLength,
      tokensUsed: details.tokensUsed,
      modelUsed: details.modelUsed,
      timestamp: new Date().toISOString(),
    };
    
    this.interactions.push(entry);
    
    if (this.interactions.length > this.maxLocalInteractions) {
      this.interactions = this.interactions.slice(-this.maxLocalInteractions);
    }
    
    auditLogger.log(
      userUniqueId,
      'data_access',
      `AI ${interactionType} interaction - Response length: ${details.responseLength} chars`
    );
    
    console.log(`[AI Audit] User ${userUniqueId} - ${interactionType} - ${new Date().toISOString()}`);
  }
  
  private sanitizePrompt(prompt: string): string {
    if (prompt.length > 200) {
      return prompt.substring(0, 200) + '...';
    }
    return prompt;
  }
  
  public getInteractionsForUser(userUniqueId: string): AIAuditEntry[] {
    return this.interactions.filter(i => i.userUniqueId === userUniqueId);
  }
  
  public getUserInteractionCount(userUniqueId: string, since?: Date): number {
    const userInteractions = this.getInteractionsForUser(userUniqueId);
    
    if (since) {
      return userInteractions.filter(i => new Date(i.timestamp) >= since).length;
    }
    
    return userInteractions.length;
  }
}

export const aiAuditLogger = new AIAuditLogger();

export const logAIChatInteraction = (
  userUniqueId: string,
  prompt: string,
  responseLength: number,
  tokensUsed?: number
): void => {
  aiAuditLogger.logAIInteraction(userUniqueId, 'chat', {
    prompt,
    responseLength,
    tokensUsed,
    modelUsed: 'gpt-4o-mini',
  });
};

export const logAIMoodPrediction = (
  userUniqueId: string,
  responseLength: number
): void => {
  aiAuditLogger.logAIInteraction(userUniqueId, 'mood_prediction', {
    responseLength,
  });
};

export const logAIWeeklySummary = (
  userUniqueId: string,
  responseLength: number
): void => {
  aiAuditLogger.logAIInteraction(userUniqueId, 'weekly_summary', {
    responseLength,
  });
};
