// Gemini AI Service for Sentinel Terrain Management
// This service provides AI-powered chat, image analysis, and satellite imagery analysis
// Use mock mode for testing without API key

const USE_MOCK_MODE = true; // Set to false and add your API key to use real Gemini API
const GEMINI_API_KEY = ''; // Add your API key here when ready

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Mock responses for different scenarios
const MOCK_RESPONSES = {
  chat: {
    greeting: "Hello! I'm your Sentinel AI Assistant. I can help you with:\n\n• Reporting road issues\n• Checking incident status\n• Analyzing road conditions\n• Satellite imagery queries\n\nHow can I assist you today?",
    pothole: "Potholes are a common road issue in Jamaica, especially after heavy rainfall. Our maintenance teams address potholes based on severity and traffic volume. You can report a pothole using the 'Report Issue' button, and our team will assess and repair it within 48-72 hours for major roads.",
    flooding: "Jamaica experiences flooding during heavy rains, particularly in low-lying areas. If you've noticed flooding on roads, please report it immediately. Our flood monitoring system tracks affected areas and our crews will assess the situation.",
    status: "To check the status of your reported issue, please provide your Report ID or the location where you reported the problem. Our system tracks all incidents in the St. Catherine Parish area.",
    default: "Thank you for contacting Sentinel. I've noted your inquiry and will connect you with a field officer if needed. Is there anything specific about road conditions or incident reporting I can help you with?"
  },
  imageAnalysis: {
    pothole: {
      severity: "Moderate",
      description: "A pothole approximately 30cm in diameter with significant edges. Water accumulation detected around the perimeter suggesting drainage issues.",
      recommendation: "Priority repair recommended within 48 hours. This defect could cause vehicle damage and poses a safety hazard.",
      estimatedCost: "JMD $15,000 - $25,000"
    },
    crack: {
      severity: "Low",
      description: "Longitudinal crack pattern detected, approximately 2mm width. No significant structural damage observed.",
      recommendation: "Routine maintenance recommended. Seal within 30 days to prevent water infiltration.",
      estimatedCost: "JMD $5,000 - $10,000"
    },
    flooding: {
      severity: "High",
      description: "Significant water accumulation covering approximately 60% of the roadway. Potential drainage blockage detected.",
      recommendation: "Urgent attention required. Road closure may be necessary. Contact drainage maintenance team immediately.",
      estimatedCost: "JMD $50,000 - $100,000"
    },
    debris: {
      severity: "Low",
      description: "Road debris detected, primarily loose gravel and vegetation. No obstruction to traffic flow.",
      recommendation: "Routine cleanup recommended within 24 hours.",
      estimatedCost: "JMD $3,000 - $5,000"
    },
    default: {
      severity: "Unknown",
      description: "Image received. Initial assessment suggests further inspection required by field officer.",
      recommendation: "Submit for field verification. An officer will assess within 24-48 hours.",
      estimatedCost: "To be determined after inspection"
    }
  },
  satelliteAnalysis: {
    northern: {
      overallCondition: "Good",
      coverage: "85% of northern zone roads in acceptable condition",
      issues: [
        { type: "Minor cracking", locations: ["Main Road - North", "Urban Road 5"], severity: "Low" },
        { type: "Drainage concern", locations: ["Zone A intersection"], severity: "Moderate" }
      ],
      recommendation: "Continue routine maintenance schedule. Priority areas: Zone A drainage"
    },
    central: {
      overallCondition: "Fair",
      coverage: "70% of central zone roads in acceptable condition",
      issues: [
        { type: "Potholes", locations: ["Highway A1", "Market Street"], severity: "Moderate" },
        { type: "Surface wear", locations: ["Downtown stretch"], severity: "Moderate" }
      ],
      recommendation: "Accelerated maintenance recommended. Consider resurfacing for Highway A1 within 6 months."
    },
    southern: {
      overallCondition: "Poor",
      coverage: "55% of southern zone roads in acceptable condition",
      issues: [
        { type: "Significant damage", locations: ["Rural Route 200", "Southern Cross Road"], severity: "High" },
        { type: "Flooding risk", locations: ["Low-lying areas"], severity: "High" }
      ],
      recommendation: "Immediate attention required. Budget allocation needed for major repairs in southern zone."
    }
  }
};

// Detect the type of issue from user message
const detectIssueType = (message) => {
  const lower = message.toLowerCase();
  if (lower.includes('pothole') || lower.includes('hole')) return 'pothole';
  if (lower.includes('flood') || lower.includes('water') || lower.includes('drain')) return 'flooding';
  if (lower.includes('crack') || lower.includes('break')) return 'crack';
  if (lower.includes('debris') || lower.includes('trash') || lower.includes('garbage')) return 'debris';
  if (lower.includes('sign') || lower.includes('signal') || lower.includes('light')) return 'signage';
  if (lower.includes('status') || lower.includes('track') || lower.includes('check')) return 'status';
  return 'default';
};

// Generate chat response using mock or real API
export const generateChatResponse = async (message, conversationHistory = []) => {
  if (USE_MOCK_MODE) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const issueType = detectIssueType(message);
    const lower = message.toLowerCase();
    
    // Check for greeting
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('good morning') || lower.includes('good afternoon')) {
      return {
        success: true,
        message: MOCK_RESPONSES.chat.greeting,
        context: 'greeting'
      };
    }
    
    // Check for thanks
    if (lower.includes('thank') || lower.includes('thanks')) {
      return {
        success: true,
        message: "You're welcome! I'm here to help. Is there anything else you'd like to know about road conditions or reporting issues?",
        context: 'thanks'
      };
    }
    
    // Return issue-specific response
    if (MOCK_RESPONDS.chat[issueType]) {
      return {
        success: true,
        message: MOCK_RESPONSES.chat[issueType],
        context: issueType
      };
    }
    
    return {
      success: true,
      message: MOCK_RESPONSES.chat.default,
      context: 'default'
    };
  }
  
  // Real Gemini API call
  try {
    const response = await fetch(`${BASE_URL}/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an AI assistant for Sentinel Terrain Management in Jamaica. You're helping citizens report and track road issues. Keep responses helpful, concise, and specific to Jamaican road infrastructure. User message: ${message}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      })
    });
    
    const data = await response.json();
    return {
      success: true,
      message: data.candidates?.[0]?.content?.parts?.[0]?.text || MOCK_RESPONSES.chat.default,
      context: 'api'
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      success: false,
      message: MOCK_RESPONSES.chat.default,
      error: error.message
    };
  }
};

// Analyze uploaded image
export const analyzeImage = async (imageUri, issueType = null) => {
  if (USE_MOCK_MODE) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Determine issue type from image or use provided type
    const type = issueType || Object.keys(MOCK_RESPONSES.imageAnalysis)[Math.floor(Math.random() * 4)];
    const analysis = MOCK_RESPONSES.imageAnalysis[type] || MOCK_RESPONSES.imageAnalysis.default;
    
    return {
      success: true,
      analysis: {
        ...analysis,
        type: type,
        timestamp: new Date().toISOString(),
        location: "St. Catherine Parish",
        confidence: 0.85 + Math.random() * 0.1
      }
    };
  }
  
  // Real Gemini Vision API call
  try {
    // In production, you would convert the image to base64 here
    const response = await fetch(`${BASE_URL}/models/gemini-pro-vision:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Analyze this road/traffic image and provide: 1) Issue type 2) Severity (Low/Moderate/High) 3) Description 4) Recommendation 5) Estimated repair cost in JMD" },
            { inline_data: { mime_type: "image/jpeg", data: "" } } // Would need base64 conversion
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 800,
        }
      })
    });
    
    const data = await response.json();
    return {
      success: true,
      analysis: {
        rawResponse: data.candidates?.[0]?.content?.parts?.[0]?.text,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Gemini Vision API error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Analyze satellite imagery for a zone
export const analyzeSatelliteImagery = async (zone = 'central') => {
  if (USE_MOCK_MODE) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const zoneData = MOCK_RESPONSES.satelliteAnalysis[zone] || MOCK_RESPONSES.satelliteAnalysis.central;
    
    return {
      success: true,
      analysis: {
        ...zoneData,
        zone: zone,
        timestamp: new Date().toISOString(),
        satelliteProvider: "Sentinel-2 (ESA)",
        cloudCover: Math.floor(Math.random() * 30),
        lastUpdated: new Date(Date.now() - 86400000).toISOString()
      }
    };
  }
  
  // Real Gemini API call for satellite analysis
  try {
    const response = await fetch(`${BASE_URL}/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this satellite imagery of ${zone} zone in St. Catherine Parish, Jamaica. Provide: 1) Overall road condition 2) Specific issues detected 3) Recommended maintenance priority 4) Budget estimate for repairs`
          }]
        }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1000,
        }
      })
    });
    
    const data = await response.json();
    return {
      success: true,
      analysis: {
        rawResponse: data.candidates?.[0]?.content?.parts?.[0]?.text,
        timestamp: new Date().toISOString(),
        zone: zone
      }
    };
  } catch (error) {
    console.error('Satellite analysis error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get road health assessment using AI
export const getRoadHealthAssessment = async (location) => {
  if (USE_MOCK_MODE) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const conditions = ['Good', 'Fair', 'Poor'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
      success: true,
      assessment: {
        location: location || "St. Catherine Parish",
        overallScore: condition === 'Good' ? 75 + Math.random() * 20 : condition === 'Fair' ? 55 + Math.random() * 15 : 30 + Math.random() * 20,
        condition: condition,
        factors: {
          trafficVolume: "Moderate",
          weatherImpact: "Low to Moderate",
          maintenanceHistory: condition === 'Good' ? 'Recent' : condition === 'Fair' ? 'Overdue' : 'Neglected',
          roadAge: `${Math.floor(5 + Math.random() * 15)} years`
        },
        recommendedActions: condition === 'Good' ? 
          ["Continue routine maintenance"] :
          condition === 'Fair' ?
          ["Schedule resurfacing", "Inspect drainage"] :
          ["Immediate repair needed", "Consider road reconstruction"],
        timestamp: new Date().toISOString()
      }
    };
  }
  
  return { success: false, error: 'API key required' };
};

export default {
  generateChatResponse,
  analyzeImage,
  analyzeSatelliteImagery,
  getRoadHealthAssessment
};
