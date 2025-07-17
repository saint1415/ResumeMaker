/**
 * Template Selector Utilities
 * Intelligent template recommendation and industry/role matching algorithms
 */

// Template selection weights
const SELECTION_WEIGHTS = {
  industry_match: 0.4,
  role_alignment: 0.3,
  experience_level: 0.2,
  content_completeness: 0.1
};

// Industry template mapping
const INDUSTRY_TEMPLATES = {
  technology: ['technology', 'modern', 'minimal'],
  finance: ['finance', 'classic', 'executive'],
  healthcare: ['healthcare', 'professional', 'classic'],
  creative: ['creative', 'modern', 'portfolio'],
  marketing: ['marketing', 'creative', 'modern'],
  sales: ['sales', 'executive', 'modern'],
  general: ['modern', 'classic', 'minimal']
};

// Role-specific template preferences
const ROLE_TEMPLATE_PREFERENCES = {
  // Technology roles
  'software_engineer': { 
    primary: 'technology', 
    alternatives: ['modern', 'minimal'],
    emphasis: ['technical_skills', 'projects', 'github_integration']
  },
  'data_scientist': { 
    primary: 'technology', 
    alternatives: ['modern', 'academic'],
    emphasis: ['analytical_skills', 'research', 'quantitative_results']
  },
  'product_manager': { 
    primary: 'technology', 
    alternatives: ['modern', 'executive'],
    emphasis: ['strategic_thinking', 'cross_functional', 'business_impact']
  },
  
  // Finance roles
  'investment_banker': { 
    primary: 'finance', 
    alternatives: ['executive', 'classic'],
    emphasis: ['deal_experience', 'quantitative_results', 'education']
  },
  'financial_analyst': { 
    primary: 'finance', 
    alternatives: ['classic', 'modern'],
    emphasis: ['analytical_skills', 'modeling', 'certifications']
  },
  'portfolio_manager': { 
    primary: 'finance', 
    alternatives: ['executive', 'classic'],
    emphasis: ['investment_performance', 'client_management', 'risk_management']
  },
  
  // Healthcare roles
  'physician': { 
    primary: 'healthcare', 
    alternatives: ['professional', 'academic'],
    emphasis: ['medical_education', 'clinical_experience', 'board_certifications']
  },
  'nurse': { 
    primary: 'healthcare', 
    alternatives: ['professional', 'classic'],
    emphasis: ['clinical_skills', 'patient_care', 'certifications']
  },
  
  // Creative roles
  'graphic_designer': { 
    primary: 'creative', 
    alternatives: ['modern', 'portfolio'],
    emphasis: ['portfolio', 'design_skills', 'creative_process']
  },
  'ui_ux_designer': { 
    primary: 'creative', 
    alternatives: ['technology', 'modern'],
    emphasis: ['user_research', 'design_thinking', 'prototyping']
  },
  
  // Marketing roles
  'digital_marketing_manager': { 
    primary: 'marketing', 
    alternatives: ['modern', 'creative'],
    emphasis: ['digital_campaigns', 'analytics', 'performance_metrics']
  },
  'brand_manager': { 
    primary: 'marketing', 
    alternatives: ['creative', 'modern'],
    emphasis: ['brand_strategy', 'campaign_development', 'market_research']
  },
  
  // Sales roles
  'account_executive': { 
    primary: 'sales', 
    alternatives: ['modern', 'executive'],
    emphasis: ['sales_performance', 'client_relationships', 'quota_attainment']
  },
  'business_development': { 
    primary: 'sales', 
    alternatives: ['executive', 'modern'],
    emphasis: ['partnership_development', 'strategic_thinking', 'revenue_growth']
  }
};

// Experience level considerations
const EXPERIENCE_LEVEL_PREFERENCES = {
  entry: {
    template_preferences: ['modern', 'minimal', 'academic'],
    section_emphasis: ['education', 'skills', 'projects', 'internships'],
    avoid_templates: ['executive'],
    customizations: {
      education_prominence: 'high',
      projects_emphasis: 'high',
      experience_depth: 'moderate'
    }
  },
  mid: {
    template_preferences: ['modern', 'professional', 'industry_specific'],
    section_emphasis: ['experience', 'skills', 'achievements'],
    customizations: {
      experience_prominence: 'high',
      achievements_focus: 'high',
      leadership_indicators: 'moderate'
    }
  },
  senior: {
    template_preferences: ['executive', 'professional', 'industry_specific'],
    section_emphasis: ['leadership', 'strategic_impact', 'achievements'],
    customizations: {
      leadership_prominence: 'high',
      strategic_thinking: 'high',
      team_impact: 'high'
    }
  },
  executive: {
    template_preferences: ['executive', 'professional'],
    section_emphasis: ['strategic_leadership', 'organizational_impact', 'vision'],
    customizations: {
      executive_summary: 'required',
      board_experience: 'highlighted',
      thought_leadership: 'emphasized'
    }
  }
};

// Main template selection function
const selectOptimalTemplate = (resumeData, preferences = {}) => {
  try {
    const {
      target_industry,
      target_role,
      experience_level,
      style_preference,
      custom_weights
    } = preferences;

    const weights = { ...SELECTION_WEIGHTS, ...custom_weights };
    
    // Get available templates
    const availableTemplates = getAvailableTemplates();
    
    // Score each template
    const templateScores = availableTemplates.map(template => ({
      template,
      score: calculateTemplateScore(template, resumeData, preferences, weights),
      reasoning: generateSelectionReasoning(template, resumeData, preferences)
    }));

    // Sort by score and return recommendations
    const rankedTemplates = templateScores.sort((a, b) => b.score - a.score);
    
    return {
      recommended: rankedTemplates[0],
      alternatives: rankedTemplates.slice(1, 4),
      all_scores: rankedTemplates,
      selection_criteria: generateSelectionCriteria(preferences, weights)
    };
  } catch (error) {
    console.error('Template selection error:', error);
    return getFallbackRecommendation(resumeData, preferences);
  }
};

// Calculate template score based on multiple factors
const calculateTemplateScore = (template, resumeData, preferences, weights) => {
  let totalScore = 0;

  // Industry alignment score
  const industryScore = calculateIndustryAlignment(template, preferences.target_industry);
  totalScore += industryScore * weights.industry_match;

  // Role alignment score
  const roleScore = calculateRoleAlignment(template, preferences.target_role);
  totalScore += roleScore * weights.role_alignment;

  // Experience level fit
  const experienceScore = calculateExperienceLevelFit(template, preferences.experience_level);
  totalScore += experienceScore * weights.experience_level;

  // Content completeness match
  const contentScore = calculateContentMatch(template, resumeData);
  totalScore += contentScore * weights.content_completeness;

  return Math.min(totalScore, 100);
};

// Calculate industry alignment score
const calculateIndustryAlignment = (templateName, targetIndustry) => {
  if (!targetIndustry) return 50; // Neutral score if no industry specified

  const industryTemplates = INDUSTRY_TEMPLATES[targetIndustry] || INDUSTRY_TEMPLATES.general;
  
  if (industryTemplates[0] === templateName) return 100; // Perfect match
  if (industryTemplates.includes(templateName)) return 80; // Good match
  if (templateName === 'modern' || templateName === 'professional') return 60; // Universal templates
  
  return 30; // Poor match
};

// Calculate role alignment score
const calculateRoleAlignment = (templateName, targetRole) => {
  if (!targetRole) return 50; // Neutral score if no role specified

  const rolePreferences = ROLE_TEMPLATE_PREFERENCES[targetRole];
  if (!rolePreferences) return 50;

  if (rolePreferences.primary === templateName) return 100;
  if (rolePreferences.alternatives && rolePreferences.alternatives.includes(templateName)) return 75;
  
  return 40;
};

// Calculate experience level fit
const calculateExperienceLevelFit = (templateName, experienceLevel) => {
  if (!experienceLevel) return 50;

  const levelPreferences = EXPERIENCE_LEVEL_PREFERENCES[experienceLevel];
  if (!levelPreferences) return 50;

  if (levelPreferences.template_preferences.includes(templateName)) return 90;
  if (levelPreferences.avoid_templates && levelPreferences.avoid_templates.includes(templateName)) return 20;
  
  return 60;
};

// Calculate content match score
const calculateContentMatch = (templateName, resumeData) => {
  const template = getTemplateConfig(templateName);
  if (!template) return 50;

  let matchScore = 0;
  let totalSections = 0;

  // Check if resume has sections that template emphasizes
  Object.entries(template.sections || {}).forEach(([sectionName, sectionConfig]) => {
    totalSections++;
    
    if (resumeData[sectionName]) {
      if (sectionConfig.priority === 'high') {
        matchScore += 3;
      } else if (sectionConfig.priority === 'medium') {
        matchScore += 2;
      } else {
        matchScore += 1;
      }
    }
  });

  return totalSections > 0 ? (matchScore / (totalSections * 3)) * 100 : 50;
};

// Generate selection reasoning
const generateSelectionReasoning = (templateName, resumeData, preferences) => {
  const reasons = [];

  // Industry reasoning
  if (preferences.target_industry) {
    const industryTemplates = INDUSTRY_TEMPLATES[preferences.target_industry];
    if (industryTemplates && industryTemplates[0] === templateName) {
      reasons.push(`Optimized for ${preferences.target_industry} industry standards`);
    }
  }

  // Role reasoning
  if (preferences.target_role) {
    const rolePrefs = ROLE_TEMPLATE_PREFERENCES[preferences.target_role];
    if (rolePrefs && rolePrefs.primary === templateName) {
      reasons.push(`Designed specifically for ${preferences.target_role} positions`);
    }
  }

  // Experience level reasoning
  if (preferences.experience_level) {
    const levelPrefs = EXPERIENCE_LEVEL_PREFERENCES[preferences.experience_level];
    if (levelPrefs && levelPrefs.template_preferences.includes(templateName)) {
      reasons.push(`Appropriate for ${preferences.experience_level} level professionals`);
    }
  }

  // Content reasoning
  const template = getTemplateConfig(templateName);
  if (template) {
    const hasPortfolio = resumeData.projects || resumeData.portfolio;
    const hasTechnicalSkills = resumeData.skills?.some(skill => 
      skill.category.toLowerCase().includes('technical')
    );

    if (template.name.includes('Creative') && hasPortfolio) {
      reasons.push('Showcases portfolio and creative work effectively');
    }
    
    if (template.name.includes('Technology') && hasTechnicalSkills) {
      reasons.push('Emphasizes technical skills and project experience');
    }
  }

  return reasons.length > 0 ? reasons : ['General compatibility with your background'];
};

// Get template customization recommendations
const getTemplateCustomizations = (templateName, resumeData, preferences) => {
  const customizations = [];

  // Industry-specific customizations
  if (preferences.target_industry) {
    const industryCustomizations = getIndustryCustomizations(preferences.target_industry, resumeData);
    customizations.push(...industryCustomizations);
  }

  // Role-specific customizations
  if (preferences.target_role) {
    const roleCustomizations = getRoleCustomizations(preferences.target_role, resumeData);
    customizations.push(...roleCustomizations);
  }

  // Experience level customizations
  if (preferences.experience_level) {
    const levelCustomizations = getExperienceLevelCustomizations(preferences.experience_level, resumeData);
    customizations.push(...levelCustomizations);
  }

  return customizations;
};

// Get industry-specific customizations
const getIndustryCustomizations = (industry, resumeData) => {
  const customizations = [];

  switch (industry) {
    case 'technology':
      customizations.push({
        type: 'section_emphasis',
        target: 'technical_skills',
        action: 'prioritize',
        reason: 'Technical skills are critical in technology roles'
      });
      
      if (resumeData.projects) {
        customizations.push({
          type: 'section_addition',
          target: 'github_integration',
          action: 'add',
          reason: 'GitHub presence is valuable for tech professionals'
        });
      }
      break;

    case 'finance':
      customizations.push({
        type: 'content_emphasis',
        target: 'quantifiable_results',
        action: 'highlight',
        reason: 'Financial industry values quantifiable performance metrics'
      });
      
      if (resumeData.certifications) {
        customizations.push({
          type: 'section_prominence',
          target: 'certifications',
          action: 'emphasize',
          reason: 'Professional certifications are highly valued in finance'
        });
      }
      break;

    case 'healthcare':
      customizations.push({
        type: 'section_requirement',
        target: 'licenses_certifications',
        action: 'require',
        reason: 'Licenses and certifications are mandatory in healthcare'
      });
      
      customizations.push({
        type: 'content_focus',
        target: 'patient_outcomes',
        action: 'emphasize',
        reason: 'Patient care and outcomes are central to healthcare roles'
      });
      break;

    case 'creative':
      customizations.push({
        type: 'section_priority',
        target: 'portfolio',
        action: 'prioritize',
        reason: 'Portfolio is the most important element for creative roles'
      });
      
      customizations.push({
        type: 'visual_approach',
        target: 'creative_expression',
        action: 'allow',
        reason: 'Creative roles benefit from visual appeal while maintaining professionalism'
      });
      break;

    case 'marketing':
      customizations.push({
        type: 'metrics_emphasis',
        target: 'campaign_performance',
        action: 'highlight',
        reason: 'Marketing success is measured through campaign performance metrics'
      });
      
      customizations.push({
        type: 'skills_focus',
        target: 'digital_marketing',
        action: 'emphasize',
        reason: 'Digital marketing skills are essential in modern marketing roles'
      });
      break;
  }

  return customizations;
};

// Get role-specific customizations
const getRoleCustomizations = (role, resumeData) => {
  const customizations = [];
  const rolePrefs = ROLE_TEMPLATE_PREFERENCES[role];

  if (rolePrefs && rolePrefs.emphasis) {
    rolePrefs.emphasis.forEach(emphasis => {
      customizations.push({
        type: 'content_emphasis',
        target: emphasis,
        action: 'highlight',
        reason: `${emphasis.replace('_', ' ')} is critical for ${role} positions`
      });
    });
  }

  return customizations;
};

// Get experience level customizations
const getExperienceLevelCustomizations = (level, resumeData) => {
  const customizations = [];
  const levelPrefs = EXPERIENCE_LEVEL_PREFERENCES[level];

  if (levelPrefs) {
    levelPrefs.section_emphasis.forEach(section => {
      customizations.push({
        type: 'section_emphasis',
        target: section,
        action: 'emphasize',
        reason: `${section} is important for ${level} level professionals`
      });
    });

    Object.entries(levelPrefs.customizations || {}).forEach(([customization, value]) => {
      customizations.push({
        type: 'layout_adjustment',
        target: customization,
        action: 'set',
        value: value,
        reason: `Optimized for ${level} level presentation`
      });
    });
  }

  return customizations;
};

// Template comparison functionality
const compareTemplates = (templateNames, resumeData, preferences) => {
  const comparisons = templateNames.map(templateName => {
    const score = calculateTemplateScore(templateName, resumeData, preferences, SELECTION_WEIGHTS);
    const customizations = getTemplateCustomizations(templateName, resumeData, preferences);
    const reasoning = generateSelectionReasoning(templateName, resumeData, preferences);

    return {
      template: templateName,
      score,
      customizations,
      reasoning,
      strengths: getTemplateStrengths(templateName, preferences),
      considerations: getTemplateConsiderations(templateName, preferences)
    };
  });

  return {
    comparisons,
    recommendation: comparisons.reduce((best, current) => 
      current.score > best.score ? current : best
    ),
    summary: generateComparisonSummary(comparisons)
  };
};

// Get template strengths
const getTemplateStrengths = (templateName, preferences) => {
  const template = getTemplateConfig(templateName);
  const strengths = [];

  if (template) {
    // Industry-specific strengths
    if (preferences.target_industry && template.industry === preferences.target_industry) {
      strengths.push('Industry-optimized design and sections');
    }

    // Template-specific strengths
    switch (templateName) {
      case 'modern':
        strengths.push('Clean, contemporary design', 'ATS-friendly format', 'Versatile for multiple industries');
        break;
      case 'creative':
        strengths.push('Visually appealing', 'Portfolio-focused', 'Creative expression balanced with professionalism');
        break;
      case 'executive':
        strengths.push('Senior-level appropriate', 'Leadership emphasis', 'Strategic focus');
        break;
      case 'technology':
        strengths.push('Technical skills emphasis', 'Project showcase', 'GitHub integration');
        break;
      case 'finance':
        strengths.push('Conservative professional design', 'Quantitative results focus', 'Education prominence');
        break;
      case 'healthcare':
        strengths.push('Credentials emphasis', 'Patient care focus', 'Regulatory compliance awareness');
        break;
    }
  }

  return strengths;
};

// Get template considerations
const getTemplateConsiderations = (templateName, preferences) => {
  const considerations = [];

  switch (templateName) {
    case 'creative':
      considerations.push('May not be suitable for conservative industries');
      considerations.push('Requires strong portfolio content');
      break;
    case 'executive':
      considerations.push('Best for senior-level positions');
      considerations.push('May be too formal for some industries');
      break;
    case 'minimal':
      considerations.push('Limited space for extensive content');
      considerations.push('Best for experienced professionals');
      break;
    case 'academic':
      considerations.push('Primarily for academic or research positions');
      considerations.push('Publication and research emphasis');
      break;
  }

  return considerations;
};

// Utility functions
const getAvailableTemplates = () => {
  return ['modern', 'classic', 'minimal', 'executive', 'creative', 'technology', 'finance', 'healthcare'];
};

const getTemplateConfig = (templateName) => {
  // This would typically load from the template files
  // Simplified for this implementation
  const configs = {
    modern: { name: 'Modern', industry: 'general' },
    classic: { name: 'Classic', industry: 'general' },
    minimal: { name: 'Minimal', industry: 'general' },
    executive: { name: 'Executive', industry: 'general' },
    creative: { name: 'Creative Professional', industry: 'creative' },
    technology: { name: 'Technology Professional', industry: 'technology' },
    finance: { name: 'Finance Professional', industry: 'finance' },
    healthcare: { name: 'Healthcare Professional', industry: 'healthcare' }
  };
  
  return configs[templateName];
};

const generateSelectionCriteria = (preferences, weights) => {
  return {
    primary_factors: Object.entries(weights)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([factor, weight]) => ({ factor, weight })),
    preferences_considered: Object.keys(preferences).filter(key => preferences[key]),
    selection_approach: 'data_driven_scoring'
  };
};

const generateComparisonSummary = (comparisons) => {
  const topScore = Math.max(...comparisons.map(c => c.score));
  const scoreRange = Math.max(...compar
