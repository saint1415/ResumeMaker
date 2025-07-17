/**
 * Resume Scoring Utilities
 * Comprehensive resume quality assessment and scoring algorithms
 */

// Scoring weights for different resume aspects
const SCORING_WEIGHTS = {
  content: 0.35,        // Content quality and completeness
  structure: 0.20,      // Organization and formatting
  keywords: 0.20,       // Relevant keywords and terminology
  achievements: 0.15,   // Quantifiable accomplishments
  readability: 0.10     // Language quality and clarity
};

// Industry-specific scoring adjustments
const INDUSTRY_ADJUSTMENTS = {
  technology: {
    technical_skills: 1.3,
    projects: 1.2,
    certifications: 1.1
  },
  finance: {
    quantifiable_results: 1.4,
    certifications: 1.2,
    education: 1.1
  },
  healthcare: {
    certifications: 1.5,
    education: 1.2,
    compliance: 1.3
  },
  marketing: {
    achievements: 1.3,
    creativity: 1.2,
    portfolio: 1.4
  },
  sales: {
    achievements: 1.4,
    quantifiable_results: 1.5,
    communication: 1.2
  }
};

// Main resume scoring function
const scoreResume = (resumeData, options = {}) => {
  const {
    industry = 'general',
    jobLevel = 'mid',
    includeDetails = true,
    customWeights = {}
  } = options;

  try {
    const weights = { ...SCORING_WEIGHTS, ...customWeights };
    
    // Calculate individual scores
    const contentScore = evaluateContent(resumeData, industry, jobLevel);
    const structureScore = evaluateStructure(resumeData);
    const keywordScore = evaluateKeywords(resumeData, industry);
    const achievementScore = evaluateAchievements(resumeData);
    const readabilityScore = evaluateReadability(resumeData);

    // Calculate weighted overall score
    const overallScore = Math.round(
      contentScore.score * weights.content +
      structureScore.score * weights.structure +
      keywordScore.score * weights.keywords +
      achievementScore.score * weights.achievements +
      readabilityScore.score * weights.readability
    );

    const result = {
      overall: Math.min(overallScore, 100),
      breakdown: {
        content: contentScore.score,
        structure: structureScore.score,
        keywords: keywordScore.score,
        achievements: achievementScore.score,
        readability: readabilityScore.score
      },
      grade: calculateGrade(overallScore),
      strengths: [],
      weaknesses: [],
      recommendations: [],
      detailedAnalysis: includeDetails ? {
        content: contentScore.details,
        structure: structureScore.details,
        keywords: keywordScore.details,
        achievements: achievementScore.details,
        readability: readabilityScore.details
      } : null
    };

    // Analyze strengths and weaknesses
    result.strengths = identifyStrengths(result.breakdown);
    result.weaknesses = identifyWeaknesses(result.breakdown);
    result.recommendations = generateRecommendations(result.breakdown, result.detailedAnalysis, industry);

    return result;
  } catch (error) {
    console.error('Resume scoring error:', error);
    throw new Error('Failed to score resume');
  }
};

// Evaluate content quality and completeness
const evaluateContent = (resumeData, industry, jobLevel) => {
  let score = 0;
  const details = [];
  const maxScore = 100;

  // Personal information completeness (20 points)
  const personalScore = evaluatePersonalInfo(resumeData.personal);
  score += personalScore.points;
  details.push(...personalScore.details);

  // Professional summary (15 points)
  const summaryScore = evaluateSummary(resumeData.summary, jobLevel);
  score += summaryScore.points;
  details.push(...summaryScore.details);

  // Experience section (35 points)
  const experienceScore = evaluateExperience(resumeData.experience, jobLevel);
  score += experienceScore.points;
  details.push(...experienceScore.details);

  // Education section (15 points)
  const educationScore = evaluateEducation(resumeData.education, industry);
  score += educationScore.points;
  details.push(...educationScore.details);

  // Skills section (15 points)
  const skillsScore = evaluateSkills(resumeData.skills, industry);
  score += skillsScore.points;
  details.push(...skillsScore.details);

  return {
    score: Math.min(Math.round(score), maxScore),
    details
  };
};

// Evaluate personal information completeness
const evaluatePersonalInfo = (personal) => {
  let points = 0;
  const details = [];

  if (!personal) {
    return { points: 0, details: [{ issue: 'Missing personal information section', impact: -20 }] };
  }

  // Essential fields
  if (personal.name) {
    points += 5;
    details.push({ strength: 'Name provided', points: 5 });
  } else {
    details.push({ issue: 'Missing name', impact: -5 });
  }

  if (personal.email) {
    points += 5;
    details.push({ strength: 'Email provided', points: 5 });
  } else {
    details.push({ issue: 'Missing email address', impact: -5 });
  }

  if (personal.phone) {
    points += 3;
    details.push({ strength: 'Phone number provided', points: 3 });
  } else {
    details.push({ suggestion: 'Consider adding phone number', impact: -3 });
  }

  // Additional contact methods
  if (personal.linkedin) {
    points += 2;
    details.push({ strength: 'LinkedIn profile included', points: 2 });
  }

  if (personal.github) {
    points += 2;
    details.push({ strength: 'GitHub profile included', points: 2 });
  }

  if (personal.website || personal.portfolio) {
    points += 2;
    details.push({ strength: 'Portfolio/website included', points: 2 });
  }

  if (personal.location) {
    points += 1;
    details.push({ strength: 'Location provided', points: 1 });
  }

  return { points: Math.min(points, 20), details };
};

// Evaluate professional summary
const evaluateSummary = (summary, jobLevel) => {
  let points = 0;
  const details = [];

  if (!summary || summary.trim().length === 0) {
    details.push({ issue: 'Missing professional summary', impact: -15 });
    return { points: 0, details };
  }

  const wordCount = summary.trim().split(/\s+/).length;
  
  // Word count evaluation
  if (wordCount >= 30 && wordCount <= 80) {
    points += 8;
    details.push({ strength: 'Appropriate summary length', points: 8 });
  } else if (wordCount < 30) {
    points += 4;
    details.push({ suggestion: 'Summary could be more detailed', impact: -4 });
  } else {
    points += 6;
    details.push({ suggestion: 'Summary might be too long', impact: -2 });
  }

  // Level-appropriate language
  const levelKeywords = {
    entry: ['motivated', 'eager', 'recent graduate', 'learning'],
    mid: ['experienced', 'skilled', 'proficient', 'demonstrated'],
    senior: ['expert', 'leadership', 'strategic', 'extensive experience'],
    executive: ['visionary', 'transformational', 'executive', 'board']
  };

  const appropriateKeywords = levelKeywords[jobLevel] || levelKeywords.mid;
  const hasLevelLanguage = appropriateKeywords.some(keyword => 
    summary.toLowerCase().includes(keyword)
  );

  if (hasLevelLanguage) {
    points += 4;
    details.push({ strength: 'Level-appropriate language used', points: 4 });
  } else {
    details.push({ suggestion: 'Include more level-appropriate terminology', impact: -2 });
  }

  // Value proposition clarity
  const hasValueProposition = /\b(results?|achievements?|improved?|increased?|decreased?|led|managed)\b/i.test(summary);
  if (hasValueProposition) {
    points += 3;
    details.push({ strength: 'Clear value proposition', points: 3 });
  } else {
    details.push({ suggestion: 'Strengthen value proposition with specific achievements', impact: -3 });
  }

  return { points: Math.min(points, 15), details };
};

// Evaluate experience section
const evaluateExperience = (experience, jobLevel) => {
  let points = 0;
  const details = [];

  if (!experience || experience.length === 0) {
    details.push({ issue: 'Missing work experience', impact: -35 });
    return { points: 0, details };
  }

  // Number of positions based on level
  const expectedPositions = {
    entry: 1,
    mid: 2,
    senior: 3,
    executive: 4
  };

  const expected = expectedPositions[jobLevel] || 2;
  if (experience.length >= expected) {
    points += 10;
    details.push({ strength: `Appropriate number of positions (${experience.length})`, points: 10 });
  } else {
    points += 5;
    details.push({ suggestion: 'Consider including more work experience', impact: -5 });
  }

  // Evaluate each position
  experience.forEach((exp, index) => {
    const positionScore = evaluatePosition(exp, index === 0);
    points += positionScore.points;
    details.push(...positionScore.details);
  });

  // Career progression
  if (experience.length > 1) {
    const hasProgression = checkCareerProgression(experience);
    if (hasProgression) {
      points += 5;
      details.push({ strength: 'Shows career progression', points: 5 });
    }
  }

  return { points: Math.min(points, 35), details };
};

// Evaluate individual position
const evaluatePosition = (position, isCurrent) => {
  let points = 0;
  const details = [];

  // Required fields
  if (position.company) {
    points += 2;
  } else {
    details.push({ issue: 'Missing company name', impact: -2 });
  }

  if (position.position) {
    points += 2;
  } else {
    details.push({ issue: 'Missing job title', impact: -2 });
  }

  if (position.startDate) {
    points += 1;
  } else {
    details.push({ issue: 'Missing start date', impact: -1 });
  }

  // Description or achievements
  if (position.description || (position.achievements && position.achievements.length > 0)) {
    points += 3;
    details.push({ strength: 'Includes job description/achievements', points: 3 });
  } else {
    details.push({ issue: 'Missing job description or achievements', impact: -3 });
  }

  // Achievement quality
  if (position.achievements && position.achievements.length > 0) {
    const achievementQuality = evaluateAchievementQuality(position.achievements);
    points += achievementQuality.points;
    details.push(...achievementQuality.details);
  }

  return { points: Math.min(points, 8), details };
};

// Evaluate achievement quality
const evaluateAchievementQuality = (achievements) => {
  let points = 0;
  const details = [];

  const quantifiableCount = achievements.filter(achievement => 
    /\d+[\d%$]|\b(increased|decreased|improved|reduced|grew|saved|generated)\b.*\d+/i.test(achievement)
  ).length;

  if (quantifiableCount > 0) {
    points += Math.min(quantifiableCount * 1, 3);
    details.push({ strength: `${quantifiableCount} quantifiable achievements`, points: Math.min(quantifiableCount * 1, 3) });
  }

  const actionVerbCount = achievements.filter(achievement =>
    /^(led|managed|developed|implemented|created|improved|increased|reduced|delivered|achieved)/i.test(achievement.trim())
  ).length;

  if (actionVerbCount > 0) {
    points += 1;
    details.push({ strength: 'Uses strong action verbs', points: 1 });
  }

  return { points: Math.min(points, 4), details };
};

// Check career progression
const checkCareerProgression = (experience) => {
  const sortedExperience = experience
    .filter(exp => exp.startDate)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  if (sortedExperience.length < 2) return false;

  // Check for progression indicators
  const progressionIndicators = [
    'senior', 'lead', 'principal', 'manager', 'director', 'head', 'vp', 'chief'
  ];

  for (let i = 1; i < sortedExperience.length; i++) {
    const previousTitle = sortedExperience[i - 1].position?.toLowerCase() || '';
    const currentTitle = sortedExperience[i].position?.toLowerCase() || '';

    const hasProgressionKeyword = progressionIndicators.some(indicator =>
      currentTitle.includes(indicator) && !previousTitle.includes(indicator)
    );

    if (hasProgressionKeyword) return true;
  }

  return false;
};

// Evaluate education section
const evaluateEducation = (education, industry) => {
  let points = 0;
  const details = [];

  if (!education || education.length === 0) {
    if (['finance', 'healthcare', 'law'].includes(industry)) {
      details.push({ issue: 'Education typically required for this industry', impact: -10 });
      return { points: 5, details };
    } else {
      details.push({ suggestion: 'Consider adding education information', impact: -5 });
      return { points: 10, details };
    }
  }

  education.forEach((edu, index) => {
    if (edu.institution && edu.degree) {
      points += 8;
      details.push({ strength: `Education entry ${index + 1} complete`, points: 8 });
    } else {
      points += 4;
      details.push({ suggestion: `Education entry ${index + 1} incomplete`, impact: -4 });
    }

    if (edu.field) {
      points += 2;
    }

    if (edu.gpa && parseFloat(edu.gpa) >= 3.5) {
      points += 1;
      details.push({ strength: 'Strong GPA included', points: 1 });
    }

    if (edu.honors) {
      points += 2;
      details.push({ strength: 'Academic honors included', points: 2 });
    }
  });

  return { points: Math.min(points, 15), details };
};

// Evaluate skills section
const evaluateSkills = (skills, industry) => {
  let points = 0;
  const details = [];

  if (!skills || skills.length === 0) {
    details.push({ issue: 'Missing skills section', impact: -15 });
    return { points: 0, details };
  }

  // Skill diversity
  const categories = [...new Set(skills.map(skill => skill.category))];
  if (categories.length >= 3) {
    points += 5;
    details.push({ strength: 'Diverse skill categories', points: 5 });
  } else if (categories.length >= 2) {
    points += 3;
    details.push({ strength: 'Multiple skill categories', points: 3 });
  }

  // Total skill count
  const totalSkills = skills.reduce((sum, skill) => sum + (skill.items?.length || 0), 0);
  if (totalSkills >= 15) {
    points += 5;
    details.push({ strength: 'Comprehensive skills list', points: 5 });
  } else if (totalSkills >= 8) {
    points += 3;
    details.push({ strength: 'Good number of skills', points: 3 });
  } else {
    details.push({ suggestion: 'Consider adding more relevant skills', impact: -2 });
  }

  // Industry relevance
  const industryRelevant = checkIndustryRelevantSkills(skills, industry);
  if (industryRelevant) {
    points += 5;
    details.push({ strength: 'Industry-relevant skills included', points: 5 });
  } else {
    details.push({ suggestion: 'Add more industry-specific skills', impact: -3 });
  }

  return { points: Math.min(points, 15), details };
};

// Check for industry-relevant skills
const checkIndustryRelevantSkills = (skills, industry) => {
  const allSkills = skills.flatMap(skill => skill.items || []).map(s => s.toLowerCase());
  
  const industryKeywords = {
    technology: ['javascript', 'python', 'react', 'aws', 'git', 'sql', 'docker'],
    finance: ['excel', 'financial modeling', 'bloomberg', 'risk management', 'sql'],
    healthcare: ['patient care', 'medical records', 'hipaa', 'clinical', 'epic'],
    marketing: ['seo', 'google analytics', 'social media', 'content marketing', 'adobe'],
    sales: ['salesforce', 'crm', 'lead generation', 'negotiation', 'pipeline management']
  };

  const relevant = industryKeywords[industry] || [];
  return relevant.some(keyword => allSkills.some(skill => skill.includes(keyword)));
};

// Evaluate structure and formatting
const evaluateStructure = (resumeData) => {
  let score = 0;
  const details = [];

  // Section presence and order
  const expectedSections = ['personal', 'summary', 'experience', 'education', 'skills'];
  const presentSections = expectedSections.filter(section => resumeData[section]);
  
  score += (presentSections.length / expectedSections.length) * 40;
  details.push({ 
    strength: `${presentSections.length}/${expectedSections.length} key sections present`, 
    points: Math.round((presentSections.length / expectedSections.length) * 40)
  });

  // Content organization
  if (resumeData.experience && resumeData.experience.length > 0) {
    const hasConsistentDates = resumeData.experience.every(exp => exp.startDate);
    if (hasConsistentDates) {
      score += 20;
      details.push({ strength: 'Consistent date formatting', points: 20 });
    } else {
      details.push({ issue: 'Inconsistent or missing dates', impact: -10 });
    }
  }

  // Contact information accessibility
  if (resumeData.personal && resumeData.personal.email && resumeData.personal.phone) {
    score += 20;
    details.push({ strength: 'Complete contact information', points: 20 });
  }

  // Professional presentation
  if (resumeData.summary && resumeData.summary.length > 0) {
    score += 10;
    details.push({ strength: 'Professional summary included', points: 10 });
  }

  // Additional sections
  const bonusSections = ['projects', 'certifications', 'awards'];
  const bonusPresent = bonusSections.filter(section => resumeData[section] && resumeData[section].length > 0);
  if (bonusPresent.length > 0) {
    score += bonusPresent.length * 5;
    details.push({ strength: `Additional sections: ${bonusPresent.join(', ')}`, points: bonusPresent.length * 5 });
  }

  return {
    score: Math.min(Math.round(score), 100),
    details
  };
};

// Evaluate keyword usage
const evaluateKeywords = (resumeData, industry) => {
  // This would integrate with the ATS optimizer
  // For now, simplified evaluation
  let score = 70; // Base score
  const details = [];

  // Check for action verbs
  const allText = JSON.stringify(resumeData).toLowerCase();
  const actionVerbs = ['managed', 'led', 'developed', 'implemented', 'created', 'improved'];
  const verbCount = actionVerbs.filter(verb => allText.includes(verb)).length;
  
  if (verbCount >= 3) {
    score += 15;
    details.push({ strength: 'Strong action verbs used', points: 15 });
  } else {
    score -= 10;
    details.push({ suggestion: 'Add more action verbs', impact: -10 });
  }

  // Industry keywords (simplified check)
  const industryTerms = {
    technology: ['software', 'development', 'programming', 'technical'],
    finance: ['financial', 'analysis', 'investment', 'market'],
    healthcare: ['patient', 'clinical', 'medical', 'healthcare'],
    marketing: ['marketing', 'campaign', 'brand', 'digital'],
    sales: ['sales', 'revenue', 'client', 'business development']
  };

  const terms = industryTerms[industry] || [];
  const termCount = terms.filter(term => allText.includes(term)).length;
  
  if (termCount >= 2) {
    score += 15;
    details.push({ strength: 'Industry-relevant terminology', points: 15 });
  }

  return {
    score: Math.min(Math.round(score), 100),
    details
  };
};

// Evaluate achievements and quantifiable results
const evaluateAchievements = (resumeData) => {
  let score = 0;
  const details = [];

  if (!resumeData.experience) {
    return { score: 0, details: [{ issue: 'No experience to evaluate achievements', impact: -100 }] };
  }

  let totalAchievements = 0;
  let quantifiableAchievements = 0;

  resumeData.experience.forEach((exp, index) => {
    if (exp.achievements && exp.achievements.length > 0) {
      totalAchievements += exp.achievements.length;
      
      const quantifiable = exp.achievements.filter(achievement =>
        /\d+[\d%$]|\b(increased|decreased|improved|reduced|grew|saved|generated)\b.*\d+/i.test(achievement)
      ).length;
      
      quantifiableAchievements += quantifiable;
    }
  });

  // Score based on achievement presence
  if (totalAchievements >= 6) {
    score += 40;
    details.push({ strength: `${totalAchievements} achievements listed`, points: 40 });
  } else if (totalAchievements >= 3) {
    score += 25;
    details.push({ strength: `${totalAchievements} achievements listed`, points: 25 });
  } else if (totalAchievements > 0) {
    score += 15;
    details.push({ suggestion: 'Consider adding more achievements', impact: -10 });
  } else {
    details.push({ issue: 'No specific achievements listed', impact: -40 });
  }

  // Bonus for quantifiable achievements
  if (quantifiableAchievements > 0) {
    const bonus = Math.min(quantifiableAchievements * 15, 60);
    score += bonus;
    details.push({ strength: `${quantifiableAchievements} quantifiable achievements`, points: bonus });
  } else {
    details.push({ suggestion: 'Add quantifiable results and metrics', impact: -20 });
  }

  return {
    score: Math.min(Math.round(score), 100),
    details
  };
};

// Evaluate readability and language quality
const evaluateReadability = (resumeData) => {
  let score = 70; // Base score
  const details = [];

  // Get all text content
  const allText = [
    resumeData.summary || '',
    ...(resumeData.experience || []).map(exp => 
      `${exp.description || ''} ${(exp.achievements || []).join(' ')}`
    ),
    ...(resumeData.education || []).map(edu => edu.description || ''),
    JSON.stringify(resumeData.skills || [])
  ].join(' ');

  if (!allText.trim()) {
    return { score: 0, details: [{ issue: 'No content to evaluate', impact: -100 }] };
  }

  // Word count analysis
  const wordCount = allText.trim().split(/\s+/).length;
  if (wordCount >= 200 && wordCount <= 600) {
    score += 15;
    details.push({ strength: 'Appropriate content length', points: 15 });
  } else if (wordCount < 200) {
    score -= 10;
    details.push({ suggestion: 'Consider adding more detail', impact: -10 });
  } else {
    score -= 5;
    details.push({ suggestion: 'Content might be too lengthy', impact: -5 });
  }

  // Grammar and style (simplified)
  const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = wordCount / sentences.length;
  
  if (avgSentenceLength >= 10 && avgSentenceLength <= 20) {
    score += 10;
    details.push({ strength: 'Good sentence structure', points: 10 });
  }

  // Professional tone
  const informalWords = ['awesome', 'cool', 'stuff', 'things', 'a lot'];
  const hasInformalLanguage = informalWords.some(word => allText.toLowerCase().includes(word));
  
  if (!hasInformalLanguage) {
    score += 5;
    details.push({ strength: 'Professional tone maintained', points: 5 });
  } else {
    details.push({ suggestion: 'Use more professional language', impact: -5 });
  }

  return {
    score: Math.min(Math.round(score), 100),
    details
  };
};

// Calculate letter grade from score
const calculateGrade = (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

// Identify strengths based on scores
const identifyStrengths = (breakdown) => {
  const strengths = [];
  
  Object.entries(breakdown).forEach(([category, score]) => {
    if (score >= 85) {
      strengths.push({
        category,
        message: `Excellent ${category} quality`,
        score
      });
    } else if (score >= 75) {
      strengths.push({
        category,
        message: `Strong ${category}`,
        score
      });
    }
  });

  return strengths.sort((a, b) => b.score - a.score);
};

// Identify weaknesses based on scores
const identifyWeaknesses = (breakdown) => {
  const weaknesses = [];
  
  Object.entries(breakdown).forEach(([category, score]) => {
    if (score < 60) {
      weaknesses.push({
        category,
        message: `${category} needs significant improvement`,
        score,
        priority: 'high'
      });
    } else if (score < 75) {
      weaknesses.push({
        category,
        message: `${category} could be enhanced`,
        score,
        priority: 'medium'
      });
    }
  });

  return weaknesses.sort((a, b) => a.score - b.score);
};

// Generate improvement recommendations
const generateRecommendations = (breakdown, detailedAnalysis, industry) => {
  const recommendations = [];
  
  // Priority recommendations based on lowest scores
  const sortedCategories = Object.entries(breakdown)
    .sort(([,a], [,b]) => a - b)
    .slice(0, 3);

  sortedCategories.forEach(([category, score]) => {
    if (score < 70) {
      const categoryRecommendations = getCategoryRecommendations(category, score, industry);
      recommendations.push(...categoryRecommendations);
    }
  });

  // Add specific recommendations from detailed analysis
  if (detailedAnalysis) {
    Object.entries(detailedAnalysis).forEach(([category, details]) => {
      const issues = details.filter(detail => detail.issue || detail.suggestion);
      issues.slice(0, 2).forEach(issue => {
        recommendations.push({
          category,
          type: issue.issue ? 'critical' : 'improvement',
          message: issue.issue || issue.suggestion,
          impact: Math.abs(issue.impact || 0),
          priority: issue.issue ? 'high' : 'medium'
        });
      });
    });
  }

  return recommendations
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority] || b.impact - a.impact;
    })
    .slice(0, 8);
};

// Get category-specific recommendations
const getCategoryRecommendations = (category, score, industry) => {
  const recommendations = {
    content: [
      { message: 'Add more detailed work experience descriptions', priority: 'high' },
      { message: 'Include a compelling professional summary', priority: 'high' },
      { message: 'Expand skills section with relevant abilities', priority: 'medium' }
    ],
    structure: [
      { message: 'Use consistent formatting throughout', priority: 'high' },
      { message: 'Organize sections in logical order', priority: 'medium' },
      { message: 'Ensure all dates are properly formatted', priority: 'medium' }
    ],
    keywords: [
      { message: `Add more ${industry}-specific terminology`, priority: 'high' },
      { message: 'Include relevant action verbs', priority: 'medium' },
      { message: 'Optimize for applicant tracking systems', priority: 'medium' }
    ],
    achievements: [
      { message: 'Add quantifiable results and metrics', priority: 'high' },
      { message: 'Use specific numbers, percentages, and dollar amounts', priority: 'high' },
      { message: 'Focus on impact and outcomes', priority: 'medium' }
    ],
    readability: [
      { message: 'Use clear, concise language', priority: 'medium' },
      { message: 'Maintain professional tone throughout', priority: 'medium' },
      { message: 'Check for grammar and spelling errors', priority: 'high' }
    ]
  };

  return (recommendations[category] || []).slice(0, 2);
};

// Compare multiple resumes
const compareResumes = (resumes, options = {}) => {
  const scores = resumes.map((resume, index) => ({
    id: resume.id || index,
    name: resume.name || `Resume ${index + 1}`,
    score: scoreResume(resume, options),
    resumeData: resume
  }));

  const comparison = {
    resumes: scores,
    rankings: scores.sort((a, b) => b.score.overall - a.score.overall),
    averages: calculateAverages(scores),
    insights: generateComparisonInsights(scores)
  };

  return comparison;
};

// Calculate average scores across resumes
const calculateAverages = (scores) => {
  const categories = ['overall', 'content', 'structure', 'keywords', 'achievements', 'readability'];
  const averages = {};

  categories.forEach(category => {
    const sum = scores.reduce((total, score) => {
      return total + (category === 'overall' ? score.score.overall : score.score.breakdown[category]);
    }, 0);
    averages[category] = Math.round(sum / scores.length);
  });

  return averages;
};

// Generate comparison insights
const generateComparisonInsights = (scores) => {
  const insights = [];
  
  // Best and worst performers
  const sortedByOverall = scores.sort((a, b) => b.score.overall - a.score.overall);
  const best = sortedByOverall[0];
  const worst = sortedByOverall[sortedByOverall.length - 1];
  
  insights.push({
    type: 'performance',
    message: `${best.name} has the highest overall score (${best.score.overall})`,
    data: { best: best.name, score: best.score.overall }
  });

  if (scores.length > 1) {
    const scoreDifference = best.score.overall - worst.score.overall;
    insights.push({
      type: 'gap',
      message: `Score gap of ${scoreDifference} points between highest and lowest`,
      data: { gap: scoreDifference, best: best.name, worst: worst.name }
    });
  }

  // Category leaders
  const categories = ['content', 'structure', 'keywords', 'achievements', 'readability'];
  categories.forEach(category => {
    const leader = scores.reduce((best, current) => 
      current.score.breakdown[category] > best.score.breakdown[category] ? current : best
    );
    
    insights.push({
      type: 'category_leader',
      category,
      message: `${leader.name} leads in ${category} (${leader.score.breakdown[category]})`,
      data: { leader: leader.name, category, score: leader.score.breakdown[category] }
    });
  });

  return insights;
};

// Benchmark against industry standards
const benchmarkResume = (resumeData, industry, position) => {
  const score = scoreResume(resumeData, { industry });
  
  // Industry benchmarks (these would ideally come from real data)
  const benchmarks = {
    technology: {
      entry: { min: 65, good: 80, excellent: 90 },
      mid: { min: 70, good: 85, excellent: 95 },
      senior: { min: 75, good: 88, excellent: 95 }
    },
    finance: {
      entry: { min: 70, good: 82, excellent: 92 },
      mid: { min: 75, good: 87, excellent: 95 },
      senior: { min: 80, good: 90, excellent: 97 }
    },
    healthcare: {
      entry: { min: 68, good: 81, excellent: 91 },
      mid: { min: 73, good: 86, excellent: 94 },
      senior: { min: 78, good: 89, excellent: 96 }
    },
    general: {
      entry: { min: 65, good: 78, excellent: 88 },
      mid: { min: 70, good: 83, excellent: 93 },
      senior: { min: 75, good: 87, excellent: 95 }
    }
  };

  const industryBenchmark = benchmarks[industry] || benchmarks.general;
  const levelBenchmark = industryBenchmark[position] || industryBenchmark.mid;
  
  let performance = 'below';
  if (score.overall >= levelBenchmark.excellent) {
    performance = 'excellent';
  } else if (score.overall >= levelBenchmark.good) {
    performance = 'good';
  } else if (score.overall >= levelBenchmark.min) {
    performance = 'acceptable';
  }

  return {
    score: score.overall,
    benchmark: levelBenchmark,
    performance,
    percentile: calculatePercentile(score.overall, industry, position),
    comparison: {
      toMinimum: score.overall - levelBenchmark.min,
      toGood: score.overall - levelBenchmark.good,
      toExcellent: score.overall - levelBenchmark.excellent
    }
  };
};

// Calculate percentile ranking
const calculatePercentile = (score, industry, position) => {
  // Simplified percentile calculation
  // In practice, this would use actual distribution data
  const adjustedScore = Math.max(0, Math.min(100, score));
  
  if (adjustedScore >= 95) return 95;
  if (adjustedScore >= 90) return 90;
  if (adjustedScore >= 85) return 85;
  if (adjustedScore >= 80) return 80;
  if (adjustedScore >= 75) return 75;
  if (adjustedScore >= 70) return 70;
  if (adjustedScore >= 65) return 65;
  if (adjustedScore >= 60) return 60;
  return Math.round(adjustedScore);
};

// Track scoring improvements over time
const trackScoreImprovement = (previousScore, currentScore) => {
  const improvement = {
    overall: currentScore.overall - previousScore.overall,
    breakdown: {},
    significantChanges: [],
    recommendations: []
  };

  Object.keys(currentScore.breakdown).forEach(category => {
    const change = currentScore.breakdown[category] - previousScore.breakdown[category];
    improvement.breakdown[category] = change;
    
    if (Math.abs(change) >= 10) {
      improvement.significantChanges.push({
        category,
        change,
        direction: change > 0 ? 'improved' : 'declined',
        magnitude: Math.abs(change)
      });
    }
  });

  // Generate improvement-specific recommendations
  if (improvement.overall > 0) {
    improvement.recommendations.push({
      type: 'positive',
      message: `Great progress! Overall score improved by ${improvement.overall} points`,
      priority: 'info'
    });
  } else if (improvement.overall < -5) {
    improvement.recommendations.push({
      type: 'concern',
      message: `Score decreased by ${Math.abs(improvement.overall)} points. Review recent changes`,
      priority: 'high'
    });
  }

  return improvement;
};

// Generate score report
const generateScoreReport = (resumeData, options = {}) => {
  const score = scoreResume(resumeData, options);
  const benchmark = benchmarkResume(resumeData, options.industry, options.jobLevel);
  
  return {
    timestamp: new Date().toISOString(),
    score,
    benchmark,
    summary: {
      grade: score.grade,
      percentile: benchmark.percentile,
      performance: benchmark.performance,
      topStrength: score.strengths[0]?.category || 'N/A',
      mainWeakness: score.weaknesses[0]?.category || 'N/A'
    },
    actionItems: score.recommendations.slice(0, 5),
    nextSteps: generateNextSteps(score, benchmark)
  };
};

// Generate next steps based on score and benchmark
const generateNextSteps = (score, benchmark) => {
  const steps = [];
  
  if (score.overall < benchmark.benchmark.min) {
    steps.push({
      priority: 'immediate',
      action: 'Focus on basic resume requirements',
      description: 'Address fundamental issues before applying to positions'
    });
  } else if (score.overall < benchmark.benchmark.good) {
    steps.push({
      priority: 'high',
      action: 'Enhance content quality',
      description: 'Improve resume to competitive level for target positions'
    });
  } else if (score.overall < benchmark.benchmark.excellent) {
    steps.push({
      priority: 'medium',
      action: 'Polish and optimize',
      description: 'Fine-tune resume for premium opportunities'
    });
  } else {
    steps.push({
      priority: 'low',
      action: 'Maintain excellence',
      description: 'Keep resume updated and relevant'
    });
  }

  // Add specific category improvements
  score.weaknesses.slice(0, 2).forEach(weakness => {
    steps.push({
      priority: weakness.priority,
      action: `Improve ${weakness.category}`,
      description: weakness.message
    });
  });

  return steps;
};

// Export all functions
export {
  scoreResume,
  evaluateContent,
  evaluatePersonalInfo,
  evaluateSummary,
  evaluateExperience,
  evaluatePosition,
  evaluateAchievementQuality,
  checkCareerProgression,
  evaluateEducation,
  evaluateSkills,
  checkIndustryRelevantSkills,
  evaluateStructure,
  evaluateKeywords,
  evaluateAchievements,
  evaluateReadability,
  calculateGrade,
  identifyStrengths,
  identifyWeaknesses,
  generateRecommendations,
  getCategoryRecommendations,
  compareResumes,
  calculateAverages,
  generateComparisonInsights,
  benchmarkResume,
  calculatePercentile,
  trackScoreImprovement,
  generateScoreReport,
  generateNextSteps,
  SCORING_WEIGHTS,
  INDUSTRY_ADJUSTMENTS
};
