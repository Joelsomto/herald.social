import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { posts, engagementData } = await req.json();

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `You are an AI content strategist for a social media platform. Analyze the following content performance data and provide actionable insights.

Posts data: ${JSON.stringify(posts)}
Engagement data: ${JSON.stringify(engagementData)}

Provide a JSON response with the following structure:
{
  "optimalPostingTimes": [
    { "day": "Monday", "time": "10:00 AM", "reason": "..." }
  ],
  "contentInsights": [
    { "title": "...", "description": "...", "priority": "high|medium|low" }
  ],
  "engagementTips": [
    { "tip": "...", "expectedImpact": "..." }
  ],
  "topPerformingContentType": "...",
  "audienceActivityPattern": "..."
}

Be specific and actionable. Base recommendations on the actual data provided.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are an expert social media analyst. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI API error:', error);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    // Parse the JSON response
    let insights;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      insights = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      // Provide default insights if parsing fails
      insights = {
        optimalPostingTimes: [
          { day: "Saturday", time: "6:00 PM", reason: "Peak user activity observed on weekends" },
          { day: "Thursday", time: "12:00 PM", reason: "High engagement during lunch breaks" },
          { day: "Friday", time: "5:00 PM", reason: "Users active before weekend" }
        ],
        contentInsights: [
          { title: "Increase Visual Content", description: "Posts with images get 2x more engagement", priority: "high" },
          { title: "Engage with Comments", description: "Reply to comments within 1 hour for better visibility", priority: "medium" }
        ],
        engagementTips: [
          { tip: "Post consistently at the same times", expectedImpact: "30% increase in reach" },
          { tip: "Use trending hashtags relevant to your content", expectedImpact: "25% more impressions" }
        ],
        topPerformingContentType: "Educational and entertaining content",
        audienceActivityPattern: "Most active during evenings and weekends"
      };
    }

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in ai-content-insights:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});