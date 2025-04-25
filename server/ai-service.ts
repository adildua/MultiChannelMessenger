import OpenAI from "openai";
import { log } from './vite';

/**
 * This is a mock implementation of the OpenAI service for development
 * purposes. In production, use a real OpenAI API key.
 */
class AIService {
  private openai: OpenAI | null = null;

  constructor() {
    // In a real implementation, we would initialize the OpenAI client
    // this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // For development/demo purposes, we're using a null client and mock responses
    log('Initialized AI service with mock implementation', 'ai-service');
  }

  /**
   * Analyzes a message and provides optimization suggestions
   */
  async optimizeMessage(message: string, options: { 
    channel: string; 
    audience?: string;
    tone?: string;
    goal?: string;
  }): Promise<{
    optimizedMessage: string;
    suggestions: Array<{
      type: string;
      description: string;
      before?: string;
      after?: string;
    }>;
    stats: {
      clarity: number;
      engagement: number;
      persuasiveness: number;
      overall: number;
    }
  }> {
    try {
      log(`Mock analyzing message for channel: ${options.channel}`, 'ai-service');
      
      // If we had a real OpenAI client, we would do something like:
      // const response = await this.openai.chat.completions.create({...})
      
      // For now, return mock data with improvements based on the original message
      const suggestions = this.generateMockSuggestions(message, options);
      const optimizedMessage = this.generateMockOptimizedMessage(message, options);
      const stats = this.generateMockStats();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        optimizedMessage,
        suggestions,
        stats
      };
    } catch (error) {
      log(`Error optimizing message: ${error}`, 'ai-service');
      throw new Error(`Failed to optimize message: ${error}`);
    }
  }

  /**
   * Generate mock suggestions based on message content and channel
   */
  private generateMockSuggestions(message: string, options: { channel: string; audience?: string; tone?: string; goal?: string; }): Array<{
    type: string;
    description: string;
    before?: string;
    after?: string;
  }> {
    const suggestions = [];
    const { channel } = options;
    
    // Analyze message length
    if (message.length > 160 && channel === 'SMS') {
      suggestions.push({
        type: 'Length',
        description: 'SMS messages should ideally be under 160 characters to avoid splitting.',
        before: message,
        after: message.substring(0, 157) + '...'
      });
    }
    
    // Check for personalization
    if (!message.includes('[first_name]') && !message.includes('[name]')) {
      const personalizedMessage = `Hi [first_name], ${message}`;
      suggestions.push({
        type: 'Personalization',
        description: 'Adding personalization can increase engagement rates by up to 26%.',
        before: message,
        after: personalizedMessage
      });
    }
    
    // Check for clear call-to-action
    const ctaKeywords = ['click', 'tap', 'visit', 'call', 'reply', 'buy', 'sign up', 'register', 'learn more'];
    const hasCTA = ctaKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    if (!hasCTA) {
      suggestions.push({
        type: 'Call to Action',
        description: 'Include a clear call-to-action to guide recipients on next steps.',
        before: message,
        after: `${message} Tap the link to learn more!`
      });
    }
    
    // Channel-specific suggestions
    if (channel === 'WhatsApp' && !message.includes('emoji')) {
      suggestions.push({
        type: 'Engagement',
        description: 'WhatsApp messages with emojis have higher engagement rates.',
        before: message,
        after: `${message} 👍`
      });
    }
    
    if (channel === 'SMS' && message.includes('http://') && !message.includes('https://')) {
      const secureMessage = message.replace('http://', 'https://');
      suggestions.push({
        type: 'Security',
        description: 'Use HTTPS instead of HTTP for enhanced security and customer trust.',
        before: message,
        after: secureMessage
      });
    }
    
    return suggestions;
  }

  /**
   * Generate a mock optimized message
   */
  private generateMockOptimizedMessage(message: string, options: { channel: string; audience?: string; tone?: string; goal?: string; }): string {
    const { channel, tone } = options;
    
    let optimized = message;
    
    // Add personalization if missing
    if (!optimized.includes('[first_name]') && !optimized.includes('[name]')) {
      optimized = `Hi [first_name], ${optimized}`;
    }
    
    // Adjust based on channel
    if (channel === 'SMS' && optimized.length > 160) {
      optimized = optimized.substring(0, 157) + '...';
    }
    
    // Add emoji for more casual tones
    if (tone === 'casual' || tone === 'friendly') {
      if (optimized.includes('thank')) optimized += ' 🙏';
      if (optimized.includes('offer') || optimized.includes('discount')) optimized += ' 🎉';
      if (optimized.includes('new')) optimized += ' ✨';
    }
    
    // Add a call to action if missing
    const ctaKeywords = ['click', 'tap', 'visit', 'call', 'reply', 'buy', 'sign up', 'register', 'learn more'];
    const hasCTA = ctaKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    if (!hasCTA) {
      optimized += ' Tap to learn more!';
    }
    
    return optimized;
  }

  /**
   * Generate mock stats for the message analysis
   */
  private generateMockStats(): {
    clarity: number;
    engagement: number;
    persuasiveness: number;
    overall: number;
  } {
    return {
      clarity: Math.floor(Math.random() * 30 + 70) / 100, // 0.7-1.0
      engagement: Math.floor(Math.random() * 40 + 60) / 100, // 0.6-1.0
      persuasiveness: Math.floor(Math.random() * 35 + 65) / 100, // 0.65-1.0
      overall: Math.floor(Math.random() * 25 + 75) / 100 // 0.75-1.0
    };
  }
}

// Export singleton instance
export const aiService = new AIService();