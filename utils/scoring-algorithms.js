/**
 * Scoring Algorithms Utilities
 * Multiple scoring methodologies and weighted scoring systems
 */

// Different scoring algorithm implementations
const SCORING_ALGORITHMS = {
  weighted: 'weighted_average',
  rubric: 'rubric_based',
  machine_learning: 'ml_prediction',
  composite: 'composite_score',
  percentile: 'percentile_ranking'
};

// Algorithm-specific configurations
const ALGORITHM_CONFIGS = {
  weighted_average: {
    weights: {
      content_quality: 0.25,
      technical_skills: 0.20,
      experience_relevance: 0.20,
      achievement_impact: 0.15,
      structure_format: 0.10,
      language_clarity: 0.10
    },
    scaling: 'linear',
    normalization: true
  },
  rubric_based: {
    criteria: {
      excellent: { min: 90, weight: 1.0 },
      good: { min: 75, weight: 0.8 },
      satisfactory: { min: 60, weight: 0.6 },
      needs_improvement: { min: 40, weight: 0.4 },
      poor: { min: 0, weight: 0.2 }
    },
    category_weights: {
      essential: 0.5,
      important: 0.3,
      desirable: 0.2
    }
  },
  composite_score: {
    components: {
      ats_compatibility: 0.30,
      human_readability: 0.25,
      content_relevance: 0.25,
      professional_presentation: 0.20
    },
    boost_factors: {
      industry_match: 1.1,
      level_appropriate: 1.05,
      recent_update: 1.02
    }
  }
};

// Weighted average scoring algorithm
const calculateWeightedScore = (metrics, weights = null, options = {}) => {
  const defaultWeights = ALGORITHM_CONFIGS.weighted_average.weights;
  const finalWeights = weights || defaultWeights;
  
  let totalScore = 0;
  let totalWeight = 0;
  const componentScores = {};

  Object.entries(finalWeights).forEach(([component, weight]) => {
    if (metrics[component] !== undefined) {
      const score = normalizeScore(metrics[component], options.normalization);
      componentScores[component] = score;
      totalScore += score * weight;
      totalWeight += weight;
    }
  });

  const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
  
  return {
    algorithm: 'weighted_average',
    overall: Math.round(finalScore * 100) / 100,
    components: componentScores,
    weights: finalWeights,
    confidence: calculateConfidence(componentScores, finalWeights)
  };
};

// Rubric-based scoring algorithm
const calculateRubricScore = (resumeData, rubric, options = {}) => {
  const { industry = 'general', position = 'mid' } = options;
  const criteriaScores = {};
  let totalScore = 0;
  let maxPossibleScore = 0;

  // Evaluate each rubric criterion
  Object.entries(rubric.criteria).forEach(([criterion, config]) => {
    const criterionScore = evaluateRubricCriterion(resumeData, criterion, config, industry);
    criteriaScores[criterion] = criterionScore;
    
    const weightedScore = criterionScore.score * (config.category_weight || 1);
    totalScore += weightedScore;
    maxPossibleScore += 100 * (config.category_weight || 1);
  });

  const normalizedScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

  return {
    algorithm: 'rubric_based',
    overall: Math.round(normalizedScore * 100) / 100,
    criteria: criteriaScores,
    rubric_summary: generateRubricSummary(criteriaScores),
    recommendations: generateRubricRecommendations(criteriaScores)
  };
};

// Evaluate individual rubric criterion
const evaluateRubricCriterion = (resumeData, criterion, config, industry) => {
  const evaluators = {
    contact_completeness: evaluateContactCompleteness,
    experience_quality: evaluateExperienceQuality,
    skills_relevance: evaluateSkillsRelevance,
    achievement_quantification: evaluateAchievementQuantification,
    education_appropriateness: evaluateEducationAppropriateness,
    language_professionalism: evaluateLanguageProfessionalism,
    format_consistency: evaluateFormatConsistency,
    industry_alignment: evaluateIndustryAlignment
  };

  const evaluator = evaluators[criterion];
  if (!evaluator) {
    return { score: 0, level: 'poor', feedback: 'Unknown criterion' };
  }

  return evaluator(resumeData, config, industry);
};

// Contact completeness evaluator
const evaluateContactCompleteness = (resumeData, config, industry) => {
  const personal = resumeData.personal || {};
  let score = 0;
  const feedback = [];

  // Essential fields
  const essentialFields = ['name', 'email', 'phone'];
  const essentialPresent = essentialFields.filter(field => personal[field]).length;
  score += (essentialPresent / essentialFields.length) * 60;

  // Professional fields
  const professionalFields = ['linkedin', 'location'];
  const professionalPresent = professionalFields.filter(field => personal[field]).length;
  score += (professionalPresent / professionalFields.length) * 25;

  // Industry-specific fields
  if (industry === 'technology' && personal.github) {
    score += 10;
    feedback.push('GitHub profile enhances tech industry relevance');
  } else if (industry === 'design' && personal.portfolio) {
    score += 10;
    feedback.push('Portfolio link valuable for design roles');
  } else if (personal.website) {
    score += 5;
    feedback.push('Personal website shows professional presence');
  }

  // Professional email check
  if (personal.email && !isPersonalEmail(personal.email)) {
    score += 5;
    feedback.push('Professional email address used');
  }

  return {
    score: Math.min(score, 100),
    level: getScoreLevel(score),
    feedback: feedback.join('; '),
    details: {
      essential_complete: `${essentialPresent}/${essentialFields.length}`,
      professional_complete: `${professionalPresent}/${professionalFields.length}`
    }
  };
};

// Experience quality evaluator
const evaluateExperienceQuality = (resumeData, config, industry) => {
  const experience = resumeData.experience || [];
  let score = 0;
  const feedback = [];

  if (experience.length === 0) {
    return { score: 0, level: 'poor', feedback: 'No work experience provided' };
  }

  // Number of positions
  const positionScore = Math.min((experience.length / 3) * 30, 30);
  score += positionScore;

  // Completeness of each position
  let completenessTotal = 0;
  experience.forEach((exp, index) => {
    let positionCompleteness = 0;
    
    if (exp.company) positionCompleteness += 20;
    if (exp.position) positionCompleteness += 20;
    if (exp.startDate) positionCompleteness += 15;
    if (exp.description || (exp.achievements && exp.achievements.length > 0)) positionCompleteness += 25;
    if (exp.achievements && exp.achievements.length >= 2) positionCompleteness += 20;
    
    completenessTotal += positionCompleteness;
  });
  
  const avgCompleteness = completenessTotal / experience.length;
  score += (avgCompleteness / 100) * 40;

  // Recent experience
  const hasRecentExperience = experience.some(exp => {
    if (!exp.startDate) return false;
    const startYear = parseInt(exp.startDate.split('-')[0]);
    return startYear >= new Date().getFullYear() - 2;
  });
  
  if (hasRecentExperience) {
    score += 15;
    feedback.push('Recent work experience included');
  }

  // Career progression
  if (experience.length > 1 && showsProgression(experience)) {
    score += 15;
    feedback.push('Demonstrates career progression');
  }

  return {
    score: Math.min(score, 100),
    level: getScoreLevel(score),
    feedback: feedback.join('; '),
    details: {
      positions_count: experience.length,
      avg_completeness: Math.round(avgCompleteness),
      has_recent: hasRecentExperience,
      shows_progression: experience.length > 1 ? showsProgression(experience) : false
    }
  };
};

// Skills relevance evaluator
const evaluateSkillsRelevance = (resumeData, config, industry) => {
  const skills = resumeData.skills || [];
  let score = 0;
  const feedback = [];

  if (skills.length === 0) {
    return { score: 0, level: 'poor', feedback: 'No skills section provided' };
  }

  // Skill diversity
  const categories = [...new Set(skills.map(skill => skill.category))];
  const diversityScore = Math.min((categories.length / 3) * 25, 25);
  score += diversityScore;

  // Total skill count
  const totalSkills = skills.reduce((sum, skill) => sum + (skill.items?.length || 0), 0);
  const countScore = Math.min((totalSkills / 15) * 25, 25);
  score += countScore;

  // Industry relevance
  const relevanceScore = calculateIndustrySkillRelevance(skills, industry);
  score += relevanceScore * 0.3;

  // Technical vs soft skills balance
  const hasTechnical = skills.some(skill => 
    skill.category.toLowerCase().includes('technical') || 
    skill.category.toLowerCase().includes('programming')
  );
  const hasSoft = skills.some(skill =>
    skill.category.toLowerCase().includes('soft') ||
    skill.category.toLowerCase().includes('interpersonal')
  );

  if (hasTechnical && hasSoft) {
    score += 20;
    feedback.push('Good balance of technical and soft skills');
  } else if (hasTechnical) {
    score += 15;
    feedback.push('Strong technical skills, consider adding soft skills');
  } else if (hasSoft) {
    score += 10;
    feedback.push('Soft skills included, consider adding technical skills');
  }

  return {
    score: Math.min(score, 100),
    level: getScoreLevel(score),
    feedback: feedback.join('; '),
    details: {
      categories_count: categories.length,
      total_skills: totalSkills,
      industry_relevance: relevanceScore,
      has_technical: hasTechnical,
      has_soft: hasSoft
    }
  };
};

// Achievement quantification evaluator
const evaluateAchievementQuantification = (resumeData, config, industry) => {
  const experience = resumeData.experience || [];
  let score = 0;
  const feedback = [];

  let totalAchievements = 0;
  let quantifiedAchievements = 0;
  let impactfulAchievements = 0;

  experience.forEach(exp => {
    if (exp.achievements && exp.achievements.length > 0) {
      totalAchievements += exp.achievements.length;
      
      exp.achievements.forEach(achievement => {
        // Check for quantification
        if (hasQuantifiableMetrics(achievement)) {
          quantifiedAchievements++;
        }
        
        // Check for impact keywords
        if (hasImpactKeywords(achievement)) {
          impactfulAchievements++;
        }
      });
    }
  });

  if (totalAchievements === 0) {
    return { score: 0, level: 'poor', feedback: 'No achievements listed' };
  }

  // Base score for having achievements
  score += 30;

  // Quantification ratio
  const quantificationRatio = quantifiedAchievements / totalAchievements;
  score += quantificationRatio * 40;

  // Impact ratio
  const impactRatio = impactfulAchievements / totalAchievements;
  score += impactRatio * 30;

  // Feedback generation
  if (quantificationRatio >= 0.7) {
    feedback.push('Excellent use of quantifiable metrics');
  } else if (quantificationRatio >= 0.4) {
    feedback.push('Good quantification, could add more metrics');
  } else {
    feedback.push('Add more specific numbers and metrics');
  }

  return {
    score: Math.min(score, 100),
    level: getScoreLevel(score),
    feedback: feedback.join('; '),
    details: {
      total_achievements: totalAchievements,
      quantified_count: quantifiedAchievements,
      quantification_ratio: Math.round(quantificationRatio * 100),
      impact_count: impactfulAchievements
    }
  };
};

// Education appropriateness evaluator
const evaluateEducationAppropriateness = (resumeData, config, industry) => {
  const education = resumeData.education || [];
  let score = 50; // Base score
  const feedback = [];

  // Industries where education is critical
  const educationCriticalIndustries = ['healthcare', 'law', 'finance', 'education', 'engineering'];
  const isEducationCritical = educationCriticalIndustries.includes(industry);

  if (education.length === 0) {
    if (isEducationCritical) {
      return { score: 20, level: 'poor', feedback: 'Education typically required for this industry' };
    } else {
      return { score: 60, level: 'satisfactory', feedback: 'Education not critical for this role' };
    }
  }

  // Evaluate each education entry
  education.forEach((edu, index) => {
    let eduScore = 0;
    
    if (edu.institution && edu.degree) {
      eduScore += 20;
    }
    
    if (edu.field) {
      eduScore += 10;
      
      // Field relevance to industry
      if (isFieldRelevant(edu.field, industry)) {
        eduScore += 10;
        feedback.push(`Relevant field: ${edu.field}`);
      }
    }
    
    if (edu.gpa && parseFloat(edu.gpa) >= 3.5) {
      eduScore += 5;
      feedback.push('Strong academic performance');
    }
    
    if (edu.honors) {
      eduScore += 5;
      feedback.push('Academic recognition included');
    }
    
    score += eduScore * (index === 0 ? 1 : 0.5); // Weight first degree higher
  });

  return {
    score: Math.min(score, 100),
    level: getScoreLevel(score),
    feedback: feedback.join('; '),
    details: {
      education_count: education.length,
      is_critical_industry: isEducationCritical,
      relevant_field: education.some(edu => isFieldRelevant(edu.field, industry))
    }
  };
};

// Language professionalism evaluator
const evaluateLanguageProfessionalism = (resumeData, config, industry) => {
  let score = 70; // Base score
  const feedback = [];
  
  // Extract all text for analysis
  const allText = extractAllText(resumeData);
  
  if (!allText || allText.trim().length === 0) {
    return { score: 0, level: 'poor', feedback: 'No content to evaluate' };
  }

  // Check for professional language
  const unprofessionalWords = ['awesome', 'cool', 'stuff', 'things', 'a lot', 'really good'];
  const hasUnprofessional = unprofessionalWords.some(word => 
    allText.toLowerCase().includes(word)
  );
  
  if (hasUnprofessional) {
    score -= 15;
    feedback.push('Consider using more professional language');
  } else {
    score += 10;
    feedback.push('Professional tone maintained');
  }

  // Check for action verbs
  const actionVerbs = ['achieved', 'managed', 'led', 'developed', 'implemented', 'created'];
  const actionVerbCount = actionVerbs.filter(verb => 
    allText.toLowerCase().includes(verb)
  ).length;
  
  if (actionVerbCount >= 3) {
    score += 15;
    feedback.push('Strong action verbs used effectively');
  } else if (actionVerbCount >= 1) {
    score += 5;
    feedback.push('Some action verbs used');
  } else {
    score -= 10;
    feedback.push('Add more action verbs');
  }

  // Check for buzzwords overuse
  const buzzwords = ['synergy', 'leverage', 'paradigm', 'disruptive', 'ninja', 'rockstar'];
  const buzzwordCount = buzzwords.filter(word => 
    allText.toLowerCase().includes(word)
  ).length;
  
  if (buzzwordCount > 2) {
    score -= 10;
    feedback.push('Reduce buzzword usage');
  }

  return {
    score: Math.min(Math.max(score, 0), 100),
    level: getScoreLevel(score),
    feedback: feedback.join('; '),
    details: {
      has_unprofessional: hasUnprofessional,
      action_verb_count: actionVerbCount,
      buzzword_count: buzzwordCount
    }
  };
};

// Format consistency evaluator
const evaluateFormatConsistency = (resumeData, config, industry) => {
  let score = 80; // Base score
  const feedback = [];

  // Check date consistency
  const dateConsistency = checkDateConsistency(resumeData);
  if (dateConsistency.consistent) {
    score += 10;
    feedback.push('Consistent date formatting');
  } else {
    score -= 15;
    feedback.push('Inconsistent date formatting detected');
  }

  // Check section completeness
  const requiredSections = ['personal', 'experience'];
  const optionalSections = ['summary', 'education', 'skills'];
  
  const hasRequired = requiredSections.every(section => resumeData[section]);
  if (hasRequired) {
    score += 10;
  } else {
    score -= 20;
    feedback.push('Missing required sections');
  }

  const optionalPresent = optionalSections.filter(section => resumeData[section]).length;
  score += (optionalPresent / optionalSections.length) * 10;

  return {
    score: Math.min(Math.max(score, 0), 100),
    level: getScoreLevel(score),
    feedback: feedback.join('; '),
    details: {
      date_consistent: dateConsistency.consistent,
      required_complete: hasRequired,
      optional_sections: optionalPresent
    }
  };
};

// Industry alignment evaluator
const evaluateIndustryAlignment = (resumeData, config, industry) => {
  let score = 50; // Base score
  const feedback = [];

  // Industry-specific keyword check
  const industryKeywords = getIndustryKeywords(industry);
  const allText = extractAllText(resumeData).toLowerCase();
  
  const keywordMatches = industryKeywords.filter(keyword => 
    allText.includes(keyword.toLowerCase())
  ).length;
  
  const keywordScore = Math.min((keywordMatches / industryKeywords.length) * 50, 50);
  score += keywordScore;

  if (keywordMatches >= industryKeywords.length * 0.3) {
    feedback.push('Good industry keyword alignment');
  } else {
    feedback.push('Add more industry-specific terminology');
  }

  // Industry-specific sections check
  const industrySpecificSections = {
    technology: ['projects', 'github'],
    healthcare: ['certifications', 'licenses'],
    finance: ['certifications'],
    education: ['publications', 'research'],
    creative: ['portfolio']
  };

  const expectedSections = industrySpecificSections[industry] || [];
  const presentSections = expectedSections.filter(section => 
    resumeData[section] && 
    (Array.isArray(resumeData[section]) ? resumeData[section].length > 0 : resumeData[section])
  ).length;

  if (expectedSections.length > 0) {
    const sectionScore = (presentSections / expectedSections.length) * 25;
    score += sectionScore;
    
    if (presentSections > 0) {
      feedback.push(`Industry-relevant sections: ${presentSections}/${expectedSections.length}`);
    }
  } else {
    score += 25; // No specific requirements
  }

  return {
    score: Math.min(score, 100),
    level: getScoreLevel(score),
    feedback: feedback.join('; '),
    details: {
      keyword_matches: keywordMatches,
      total_keywords: industryKeywords.length,
      section_matches: presentSections,
      expected_sections: expectedSections.length
    }
  };
};

// Helper functions
const normalizeScore = (score, normalization = true) => {
  if (!normalization) return score;
  return Math.max(0, Math.min(100, score));
};

const calculateConfidence = (componentScores, weights) => {
  const completeness = Object.keys(componentScores).length / Object.keys(weights).length;
  const variance = calculateVariance(Object.values(componentScores));
  const confidence = completeness * (1 - variance / 10000); // Normalize variance
  return Math.max(0.1, Math.min(1, confidence));
};

const calculateVariance = (scores) => {
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  return variance;
};

const getScoreLevel = (score) => {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'satisfactory';
  if (score >= 40) return 'needs_improvement';
  return 'poor';
};

const isPersonalEmail = (email) => {
  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  return personalDomains.includes(domain);
};

const showsProgression = (experience) => {
  const progressionKeywords = ['senior', 'lead', 'manager', 'director', 'head', 'principal', 'vp'];
  
  for (let i = 1; i < experience.length; i++) {
    const currentTitle = experience[i].position?.toLowerCase() || '';
    const previousTitle = experience[i - 1].position?.toLowerCase() || '';
    
    const hasProgression = progressionKeywords.some(keyword =>
      currentTitle.includes(keyword) && !previousTitle.includes(keyword)
    );
    
    if (hasProgression) return true;
  }
  
  return false;
};

const hasQuantifiableMetrics = (achievement) => {
  const patterns = [
    /\d+%/,                           // Percentages
    /\$[\d,]+/,                       // Dollar amounts
    /\d+[\w\s]*(?:million|thousand|k|m)/i, // Large numbers
    /\b\d+\b.*(?:increased|decreased|improved|reduced|grew|saved|generated)/i,
    /(?:increased|decreased|improved|reduced|grew|saved|generated)\b.*\b\d+/i
  ];
  
  return patterns.some(pattern => pattern.test(achievement));
};

const hasImpactKeywords = (achievement) => {
  const impactKeywords = [
    'increased', 'decreased', 'improved', 'reduced', 'grew', 'saved', 'generated',
    'achieved', 'exceeded', 'delivered', 'optimized', 'streamlined', 'enhanced'
  ];
  
  return impactKeywords.some(keyword => 
    achievement.toLowerCase().includes(keyword)
  );
};

const isFieldRelevant = (field, industry) => {
  const relevantFields = {
    technology: ['computer science', 'software engineering', 'information technology', 'data science'],
    finance: ['finance', 'economics', 'accounting', 'business', 'mathematics'],
    healthcare: ['medicine', 'nursing', 'biology', 'chemistry', 'health sciences'],
    marketing: ['marketing', 'communications', 'advertising', 'business', 'psychology'],
    education: ['education', 'teaching', 'curriculum', 'pedagogy']
  };
  
  const fields = relevantFields[industry] || [];
  return fields.some(relevantField => 
    field?.toLowerCase().includes(relevantField.toLowerCase())
  );
};

const extractAllText = (resumeData) => {
  const textParts = [
    resumeData.summary || '',
    ...(resumeData.experience || []).map(exp => 
      `${exp.description || ''} ${(exp.achievements || []).join(' ')}`
    ),
    ...(resumeData.education || []).map(edu => edu.description || ''),
    JSON.stringify(resumeData.skills || [])
  ];
  
  return textParts.join(' ');
};

const checkDateConsistency = (resumeData) => {
  const dates = [];
  
  if (resumeData.experience) {
    resumeData.experience.forEach(exp => {
      if (exp.startDate) dates.push(exp.startDate);
      if (exp.endDate) dates.push(exp.endDate);
    });
  }
  
  if (resumeData.education) {
    resumeData.education.forEach(edu => {
      if (edu.startDate) dates.push(edu.startDate);
      if (edu.endDate) dates.push(edu.endDate);
    });
  }
  
  if (dates.length <= 1) return { consistent: true, pattern: 'none' };
  
  // Check for consistent patterns
  const patterns = {
    'YYYY-MM': /^\d{4}-\d{2}$/,
    'YYYY': /^\d{4}$/,
    'MM/YYYY': /^\d{2}\/\d{4}$/,
    'Month YYYY': /^[A-Za-z]+ \d{4}$/
  };
  
  let detectedPattern = null;
  let consistent = true;
  
  for (const [patternName, regex] of Object.entries(patterns)) {
    if (dates.every(date => regex.test(date))) {
      detectedPattern = patternName;
      break;
    }
  }
  
  if (!detectedPattern) {
    consistent = false;
  }
  
  return { consistent, pattern: detectedPattern };
};

const getIndustryKeywords = (industry) => {
  const keywords = {
    technology: [
      'software', 'development', 'programming', 'coding', 'javascript', 'python',
      'react', 'api', 'database', 'cloud', 'agile', 'git', 'technical'
    ],
    finance: [
      'financial', 'investment', 'portfolio', 'risk', 'analysis', 'market',
      'trading', 'banking', 'accounting', 'budget', 'revenue', 'profit'
    ],
    healthcare: [
      'patient', 'clinical', 'medical', 'healthcare', 'treatment', 'diagnosis',
      'nursing', 'therapy', 'medicine', 'hospital', 'care', 'health'
    ],
    marketing: [
      'marketing', 'brand', 'campaign', 'digital', 'social media', 'seo',
      'content', 'advertising', 'customer', 'engagement', 'conversion'
    ],
    sales: [
      'sales', 'revenue', 'client', 'customer', 'deal', 'quota', 'pipeline',
      'negotiation', 'relationship', 'account', 'business development'
    ]
  };
  
  return keywords[industry] || [];
};

const generateRubricSummary = (criteriaScores) => {
  const summary = {
    totalCriteria: Object.keys(criteriaScores).length,
    excellent: 0,
    good: 0,
    satisfactory: 0,
    needsImprovement: 0,
    poor: 0
  };
  
  Object.values(criteriaScores).forEach(criterion => {
    summary[criterion.level.replace('_', '')]++;
  });
  
  return summary;
};

const generateRubricRecommendations = (criteriaScores) => {
  const recommendations = [];
  
  Object.entries(criteriaScores).forEach(([criterion, data]) => {
    if (data.level === 'poor' || data.level === 'needs_improvement') {
      recommendations.push({
        criterion,
        priority: data.level === 'poor' ? 'high' : 'medium',
        message: data.feedback,
        score: data.score
      });
    }
  });
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority] || a.score - b.score;
  });
};

// Composite scoring algorithm
const calculateCompositeScore = (resumeData, jobDescription, options = {}) => {
  const { industry = 'general', position = 'mid' } = options;
  const config = ALGORITHM_CONFIGS.composite_score;
  
  // Calculate component scores
  const components = {
    ats_compatibility: calculateATSCompatibility(resumeData, jobDescription),
    human_readability: calculateReadability(resumeData),
    content_relevance: calculateContentRelevance(resumeData, jobDescription, industry),
    professional_presentation: calculatePresentationScore(resumeData)
  };
  
  // Apply weights
  let compositeScore = 0;
  Object.entries(config.components).forEach(([component, weight]) => {
    compositeScore += components[component] * weight;
  });
  
  // Apply boost factors
  let boostMultiplier = 1;
  Object.entries(config.boost_factors).forEach(([factor, multiplier]) => {
    if (shouldApplyBoost(resumeData, factor, industry, position)) {
      boostMultiplier *= multiplier;
    }
  });
  
  const finalScore = Math.min(compositeScore * boostMultiplier, 100);
  
  return {
    algorithm: 'composite_score',
    overall: Math.round(finalScore * 100) / 100,
    components,
    boosts_applied: getAppliedBoosts(resumeData, config.boost_factors, industry, position),
    boost_multiplier: boostMultiplier
  };
};

// Helper functions for composite scoring
const calculateATSCompatibility = (resumeData, jobDescription) => {
  // Simplified ATS compatibility check
  let score = 70; // Base score
  
  // Check for standard sections
  const standardSections = ['personal', 'experience', 'education', 'skills'];
  const presentSections = standardSections.filter(section => resumeData[section]).length;
  score += (presentSections / standardSections.length) * 20;
  
  // Check for keyword relevance (simplified)
  if (jobDescription) {
    const hasKeywords = jobDescription.toLowerCase().split(' ').some(word => 
      JSON.stringify(resumeData).toLowerCase().includes(word)
    );
    if (hasKeywords) score += 10;
  }
  
  return Math.min(score, 100);
};

const calculateReadability = (resumeData) => {
  const allText = extractAllText(resumeData);
  if (!allText) return 0;
  
  let score = 70; // Base score
  
  // Word count check
  const wordCount = allText.split(/\s+/).length;
  if (wordCount >= 200 && wordCount <= 600) {
    score += 15;
  } else if (wordCount < 200) {
    score -= 10;
  }
  
  // Professional language check
  const unprofessionalWords = ['awesome', 'cool', 'stuff'];
  const hasUnprofessional = unprofessionalWords.some(word => 
    allText.toLowerCase().includes(word)
  );
  
  if (!hasUnprofessional) score += 15;
  
  return Math.min(score, 100);
};

const calculateContentRelevance = (resumeData, jobDescription, industry) => {
  let score = 60; // Base score
  
  // Industry alignment
  const industryKeywords = getIndustryKeywords(industry);
  const allText = extractAllText(resumeData).toLowerCase();
  const keywordMatches = industryKeywords.filter(keyword => 
    allText.includes(keyword)
  ).length;
  
  score += (keywordMatches / industryKeywords.length) * 40;
  
  return Math.min(score, 100);
};

const calculatePresentationScore = (resumeData) => {
  let score = 70; // Base score
  
  // Contact completeness
  const personal = resumeData.personal || {};
  const essentialFields = ['name', 'email', 'phone'];
  const presentFields = essentialFields.filter(field => personal[field]).length;
  score += (presentFields / essentialFields.length) * 20;
  
  // Section organization
  const recommendedSections = ['summary', 'experience', 'education', 'skills'];
  const presentSections = recommendedSections.filter(section => resumeData[section]).length;
  score += (presentSections / recommendedSections.length) * 10;
  
  return Math.min(score, 100);
};

const shouldApplyBoost = (resumeData, factor, industry, position) => {
  switch (factor) {
    case 'industry_match':
      return hasIndustryAlignment(resumeData, industry);
    case 'level_appropriate':
      return hasLevelAppropriateLanguage(resumeData, position);
    case 'recent_update':
      return hasRecentContent(resumeData);
    default:
      return false;
  }
};

const getAppliedBoosts = (resumeData, boostFactors, industry, position) => {
  const applied = [];
  
  Object.keys(boostFactors).forEach(factor => {
    if (shouldApplyBoost(resumeData, factor, industry, position)) {
      applied.push(factor);
    }
  });
  
  return applied;
};

const hasIndustryAlignment = (resumeData, industry) => {
  const keywords = getIndustryKeywords(industry);
  const allText = extractAllText(resumeData).toLowerCase();
  const matches = keywords.filter(keyword => allText.includes(keyword)).length;
  return matches >= keywords.length * 0.3;
};

const hasLevelAppropriateLanguage = (resumeData, position) => {
  const allText = extractAllText(resumeData).toLowerCase();
  const levelKeywords = {
    entry: ['eager', 'learning', 'motivated', 'recent graduate'],
    mid: ['experienced', 'skilled', 'proficient', 'demonstrated'],
    senior: ['expert', 'leadership', 'strategic', 'extensive'],
    executive: ['visionary', 'transformational', 'executive']
  };
  
  const appropriate = levelKeywords[position] || levelKeywords.mid;
  return appropriate.some(keyword => allText.includes(keyword));
};

const hasRecentContent = (resumeData) => {
  const currentYear = new Date().getFullYear();
  
  if (resumeData.experience) {
    return resumeData.experience.some(exp => {
      const startYear = parseInt(exp.startDate?.split('-')[0]);
      return startYear >= currentYear - 1;
    });
  }
  
  return false;
};

// Machine learning-inspired scoring (simplified heuristic version)
const calculateMLInspiredScore = (resumeData, trainingData = null, options = {}) => {
  // This is a simplified version - real ML would require training data
  const features = extractFeatures(resumeData);
  const weights = trainingData?.weights || getDefaultMLWeights();
  
  let score = 0;
  Object.entries(features).forEach(([feature, value]) => {
    const weight = weights[feature] || 0;
    score += value * weight;
  });
  
  // Normalize to 0-100 scale
  const normalizedScore = Math.max(0, Math.min(100, score * 10));
  
  return {
    algorithm: 'ml_inspired',
    overall: Math.round(normalizedScore * 100) / 100,
    features,
    feature_importance: weights,
    confidence: calculateMLConfidence(features, weights)
  };
};

const extractFeatures = (resumeData) => {
  return {
    experience_count: resumeData.experience?.length || 0,
    total_achievements: (resumeData.experience || []).reduce((sum, exp) => 
      sum + (exp.achievements?.length || 0), 0),
    quantified_achievements: countQuantifiedAchievements(resumeData),
    skills_count: (resumeData.skills || []).reduce((sum, skill) => 
      sum + (skill.items?.length || 0), 0),
    education_count: resumeData.education?.length || 0,
    has_summary: resumeData.summary ? 1 : 0,
    summary_length: resumeData.summary?.split(' ').length || 0,
    action_verb_count: countActionVerbs(resumeData),
    professional_email: resumeData.personal?.email && 
      !isPersonalEmail(resumeData.personal.email) ? 1 : 0,
    has_linkedin: resumeData.personal?.linkedin ? 1 : 0,
    recent_experience: hasRecentExperience(resumeData) ? 1 : 0
  };
};

const getDefaultMLWeights = () => {
  return {
    experience_count: 0.8,
    total_achievements: 0.6,
    quantified_achievements: 1.2,
    skills_count: 0.4,
    education_count: 0.5,
    has_summary: 0.7,
    summary_length: 0.02,
    action_verb_count: 0.3,
    professional_email: 0.5,
    has_linkedin: 0.3,
    recent_experience: 0.8
  };
};

const calculateMLConfidence = (features, weights) => {
  const totalFeatures = Object.keys(features).length;
  const weightedFeatures = Object.keys(weights).length;
  const coverage = weightedFeatures / totalFeatures;
  
  const featureVariance = calculateVariance(Object.values(features));
  const normalizedVariance = Math.min(featureVariance / 100, 1);
  
  return coverage * (1 - normalizedVariance);
};

const countQuantifiedAchievements = (resumeData) => {
  let count = 0;
  (resumeData.experience || []).forEach(exp => {
    if (exp.achievements) {
      count += exp.achievements.filter(achievement => 
        hasQuantifiableMetrics(achievement)
      ).length;
    }
  });
  return count;
};

const countActionVerbs = (resumeData) => {
  const actionVerbs = ['managed', 'led', 'developed', 'implemented', 'created', 'improved'];
  const allText = extractAllText(resumeData).toLowerCase();
  return actionVerbs.filter(verb => allText.includes(verb)).length;
};

const hasRecentExperience = (resumeData) => {
  const currentYear = new Date().getFullYear();
  return (resumeData.experience || []).some(exp => {
    const startYear = parseInt(exp.startDate?.split('-')[0]);
    return startYear >= currentYear - 2;
  });
};

// Export all functions
export {
  // Main scoring functions
  calculateWeightedScore,
  calculateRubricScore,
  calculateCompositeScore,
  calculateMLInspiredScore,
  
  // Rubric evaluators
  evaluateRubricCriterion,
  evaluateContactCompleteness,
  evaluateExperienceQuality,
  evaluateSkillsRelevance,
  evaluateAchievementQuantification,
  evaluateEducationAppropriateness,
  evaluateLanguageProfessionalism,
  evaluateFormatConsistency,
  evaluateIndustryAlignment,
  
  // Helper functions
  normalizeScore,
  calculateConfidence,
  calculateVariance,
  getScoreLevel,
  generateRubricSummary,
  generateRubricRecommendations,
  
  // Composite scoring helpers
  calculateATSCompatibility,
  calculateReadability,
  calculateContentRelevance,
  calculatePresentationScore,
  
  // ML helpers
  extractFeatures,
  getDefaultMLWeights,
  calculateMLConfidence,
  
  // Utility functions
  isPersonalEmail,
  showsProgression,
  hasQuantifiableMetrics,
  hasImpactKeywords,
  isFieldRelevant,
  extractAllText,
  checkDateConsistency,
  getIndustryKeywords,
  
  // Constants
  SCORING_ALGORITHMS,
  ALGORITHM_CONFIGS
};
