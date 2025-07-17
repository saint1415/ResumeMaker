/**
 * ATS Optimization Utilities
 * Analyzes and optimizes resumes for Applicant Tracking Systems
 */

// ATS scoring weights
const ATS_WEIGHTS = {
  keywords: 0.4,
  formatting: 0.2,
  skills: 0.2,
  experience: 0.1,
  education: 0.1
};

// Common ATS-friendly formatting rules
const ATS_FORMATTING_RULES = {
  fonts: ['Arial', 'Calibri', 'Times New Roman', 'Helvetica'],
  avoidElements: ['tables', 'graphics', 'images', 'text boxes'],
  preferredSections: ['Experience', 'Education', 'Skills', 'Summary'],
  fileFormats: ['pdf', 'docx', 'txt'],
  maxFileSize: 1024 * 1024 // 1MB
};

// Analyze resume for ATS compatibility
const analyzeATSCompatibility = (resumeData, jobDescription = '') => {
  const analysis = {
    overall: 0,
    scores: {
      keywords: 0,
      formatting: 0,
      skills: 0,
      experience: 0,
      education: 0
    },
    recommendations: [],
    keywordMatches: [],
    missingKeywords: [],
    improvements: []
  };

  try {
    // Analyze keywords
    const keywordAnalysis = analyzeKeywords(resumeData, jobDescription);
    analysis.scores.keywords = keywordAnalysis.score;
    analysis.keywordMatches = keywordAnalysis.matches;
    analysis.missingKeywords = keywordAnalysis.missing;

    // Analyze formatting
    analysis.scores.formatting = analyzeFormatting(resumeData);

    // Analyze skills
    analysis.scores.skills = analyzeSkills(resumeData, jobDescription);

    // Analyze experience
    analysis.scores.experience = analyzeExperience(resumeData);

    // Analyze education
    analysis.scores.education = analyzeEducation(resumeData);

    // Calculate overall score
    analysis.overall = calculateOverallScore(analysis.scores);

    // Generate recommendations
    analysis.recommendations = generateRecommendations(analysis);

    // Generate improvements
    analysis.improvements = generateImprovements(analysis, resumeData);

    return analysis;
  } catch (error) {
    console.error('ATS analysis error:', error);
    throw new Error('Failed to analyze ATS compatibility');
  }
};

// Analyze keyword optimization
const analyzeKeywords = (resumeData, jobDescription) => {
  const jobKeywords = extractJobKeywords(jobDescription);
  const resumeKeywords = extractResumeKeywords(resumeData);
  
  const matches = [];
  const missing = [];
  let matchScore = 0;

  jobKeywords.forEach(keyword => {
    const match = findKeywordMatch(keyword, resumeKeywords);
    if (match) {
      matches.push({
        keyword: keyword.word,
        frequency: match.frequency,
        importance: keyword.importance,
        score: match.frequency * keyword.importance
      });
      matchScore += match.frequency * keyword.importance;
    } else {
      missing.push({
        keyword: keyword.word,
        importance: keyword.importance,
        synonyms: getKeywordSynonyms(keyword.word)
      });
    }
  });

  const maxPossibleScore = jobKeywords.reduce((sum, kw) => sum + kw.importance, 0);
  const normalizedScore = maxPossibleScore > 0 ? (matchScore / maxPossibleScore) * 100 : 0;

  return {
    score: Math.min(normalizedScore, 100),
    matches,
    missing,
    density: calculateKeywordDensity(resumeKeywords)
  };
};

// Extract keywords from job description
const extractJobKeywords = (jobDescription) => {
  if (!jobDescription) return [];

  const keywords = [];
  const text = jobDescription.toLowerCase();
  
  // Technical skills patterns
  const techSkills = [
    'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'aws', 'docker',
    'kubernetes', 'git', 'agile', 'scrum', 'ci/cd', 'devops', 'machine learning',
    'artificial intelligence', 'data science', 'cloud computing', 'microservices'
  ];

  // Soft skills patterns
  const softSkills = [
    'leadership', 'communication', 'teamwork', 'problem solving', 'analytical',
    'creative', 'adaptable', 'detail-oriented', 'time management', 'collaboration'
  ];

  // Action verbs
  const actionVerbs = [
    'managed', 'led', 'developed', 'implemented', 'designed', 'created',
    'improved', 'optimized', 'analyzed', 'coordinated', 'supervised'
  ];

  // Industry terms
  const industryTerms = [
    'project management', 'business analysis', 'quality assurance',
    'user experience', 'customer service', 'sales', 'marketing'
  ];

  // Extract and score keywords
  [...techSkills, ...softSkills, ...actionVerbs, ...industryTerms].forEach(skill => {
    const regex = new RegExp(`\\b${skill}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      keywords.push({
        word: skill,
        frequency: matches.length,
        importance: getKeywordImportance(skill, text),
        category: categorizeKeyword(skill)
      });
    }
  });

  // Extract custom keywords from job description
  const customKeywords = extractCustomKeywords(text);
  keywords.push(...customKeywords);

  return keywords.sort((a, b) => b.importance - a.importance);
};

// Extract keywords from resume
const extractResumeKeywords = (resumeData) => {
  const allText = [
    resumeData.summary || '',
    resumeData.experience?.map(exp => `${exp.description} ${exp.achievements?.join(' ')}`).join(' ') || '',
    resumeData.skills?.map(skill => skill.items?.join(' ')).join(' ') || '',
    resumeData.education?.map(edu => `${edu.degree} ${edu.field}`).join(' ') || ''
  ].join(' ').toLowerCase();

  const wordFreq = {};
  const words = allText.match(/\b\w+\b/g) || [];
  
  words.forEach(word => {
    if (word.length > 2) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  return Object.entries(wordFreq).map(([word, freq]) => ({
    word,
    frequency: freq
  }));
};

// Find keyword match in resume
const findKeywordMatch = (jobKeyword, resumeKeywords) => {
  const directMatch = resumeKeywords.find(rk => rk.word === jobKeyword.word);
  if (directMatch) return directMatch;

  // Check for synonyms
  const synonyms = getKeywordSynonyms(jobKeyword.word);
  for (const synonym of synonyms) {
    const synonymMatch = resumeKeywords.find(rk => rk.word === synonym);
    if (synonymMatch) return synonymMatch;
  }

  return null;
};

// Get keyword synonyms
const getKeywordSynonyms = (keyword) => {
  const synonymMap = {
    'javascript': ['js', 'ecmascript', 'node.js', 'nodejs'],
    'python': ['py', 'python3', 'django', 'flask'],
    'leadership': ['management', 'supervision', 'team lead', 'director'],
    'communication': ['presentation', 'writing', 'speaking', 'interpersonal'],
    'problem solving': ['troubleshooting', 'debugging', 'analytical', 'critical thinking'],
    'project management': ['pm', 'scrum master', 'agile', 'coordination'],
    'machine learning': ['ml', 'ai', 'artificial intelligence', 'deep learning'],
    'database': ['sql', 'mysql', 'postgresql', 'mongodb', 'nosql'],
    'cloud computing': ['aws', 'azure', 'gcp', 'cloud', 'saas'],
    'user experience': ['ux', 'ui', 'user interface', 'usability'],
    'quality assurance': ['qa', 'testing', 'automation', 'selenium'],
    'customer service': ['support', 'help desk', 'client relations', 'customer success']
  };

  return synonymMap[keyword] || [];
};

// Calculate keyword importance
const getKeywordImportance = (keyword, jobText) => {
  let importance = 1;
  
  // Higher importance for keywords in job title or requirements
  if (jobText.includes('required') || jobText.includes('must have')) {
    importance += 2;
  }
  
  if (jobText.includes('preferred') || jobText.includes('nice to have')) {
    importance += 1;
  }
  
  // Technical skills generally more important
  const techKeywords = ['javascript', 'python', 'java', 'react', 'aws', 'sql'];
  if (techKeywords.includes(keyword)) {
    importance += 1;
  }
  
  return importance;
};

// Categorize keywords
const categorizeKeyword = (keyword) => {
  const categories = {
    technical: ['javascript', 'python', 'java', 'react', 'sql', 'aws', 'docker'],
    soft: ['leadership', 'communication', 'teamwork', 'problem solving'],
    industry: ['project management', 'business analysis', 'quality assurance'],
    tools: ['git', 'jira', 'slack', 'microsoft office', 'adobe'],
    certifications: ['aws certified', 'pmp', 'cissp', 'comptia']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.includes(keyword)) {
      return category;
    }
  }
  
  return 'general';
};

// Extract custom keywords using NLP techniques
const extractCustomKeywords = (text) => {
  const keywords = [];
  
  // Extract capitalized phrases (likely company names, technologies)
  const capitalizedPhrases = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  
  capitalizedPhrases.forEach(phrase => {
    if (phrase.length > 2 && !commonWords.includes(phrase.toLowerCase())) {
      keywords.push({
        word: phrase.toLowerCase(),
        frequency: 1,
        importance: 1,
        category: 'custom'
      });
    }
  });
  
  return keywords;
};

// Common words to exclude from keyword extraction
const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];

// Calculate keyword density
const calculateKeywordDensity = (keywords) => {
  const totalWords = keywords.reduce((sum, kw) => sum + kw.frequency, 0);
  return keywords.map(kw => ({
    ...kw,
    density: (kw.frequency / totalWords) * 100
  }));
};

// Analyze formatting for ATS compatibility
const analyzeFormatting = (resumeData) => {
  let score = 100;
  const issues = [];

  // Check for standard sections
  const requiredSections = ['personal', 'experience'];
  const recommendedSections = ['skills', 'education', 'summary'];
  
  requiredSections.forEach(section => {
    if (!resumeData[section]) {
      score -= 20;
      issues.push(`Missing required section: ${section}`);
    }
  });

  recommendedSections.forEach(section => {
    if (!resumeData[section]) {
      score -= 5;
      issues.push(`Missing recommended section: ${section}`);
    }
  });

  // Check for contact information
  if (!resumeData.personal?.email) {
    score -= 15;
    issues.push('Missing email address');
  }

  if (!resumeData.personal?.phone) {
    score -= 10;
    issues.push('Missing phone number');
  }

  return Math.max(score, 0);
};

// Analyze skills section
const analyzeSkills = (resumeData, jobDescription) => {
  if (!resumeData.skills || resumeData.skills.length === 0) {
    return 0;
  }

  let score = 50; // Base score for having skills section

  // Check for diverse skill categories
  const skillCategories = resumeData.skills.map(skill => skill.category);
  const uniqueCategories = [...new Set(skillCategories)];
  
  if (uniqueCategories.length >= 3) {
    score += 20;
  }

  // Check for technical skills
  const hasTechnicalSkills = resumeData.skills.some(skill => 
    skill.category.toLowerCase().includes('technical') ||
    skill.category.toLowerCase().includes('programming')
  );
  
  if (hasTechnicalSkills) {
    score += 20;
  }

  // Check skill relevance to job description
  if (jobDescription) {
    const jobKeywords = extractJobKeywords(jobDescription);
    const skillWords = resumeData.skills.flatMap(skill => skill.items || []);
    
    const relevantSkills = skillWords.filter(skill => 
      jobKeywords.some(jk => jk.word.includes(skill.toLowerCase()))
    );
    
    if (relevantSkills.length > 0) {
      score += 10;
    }
  }

  return Math.min(score, 100);
};

// Analyze experience section
const analyzeExperience = (resumeData) => {
  if (!resumeData.experience || resumeData.experience.length === 0) {
    return 0;
  }

  let score = 40; // Base score for having experience

  // Check for detailed experience entries
  const detailedEntries = resumeData.experience.filter(exp => 
    exp.company && exp.position && exp.startDate && 
    (exp.description || (exp.achievements && exp.achievements.length > 0))
  );

  score += (detailedEntries.length / resumeData.experience.length) * 30;

  // Check for recent experience
  const currentYear = new Date().getFullYear();
  const recentExperience = resumeData.experience.some(exp => {
    const startYear = parseInt(exp.startDate?.split('-')[0]);
    return startYear >= currentYear - 2;
  });

  if (recentExperience) {
    score += 15;
  }

  // Check for career progression
  if (resumeData.experience.length >= 2) {
    score += 15;
  }

  return Math.min(score, 100);
};

// Analyze education section
const analyzeEducation = (resumeData) => {
  if (!resumeData.education || resumeData.education.length === 0) {
    return 50; // Not always required
  }

  let score = 70; // Base score for having education

  // Check for complete education entries
  const completeEntries = resumeData.education.filter(edu => 
    edu.institution && edu.degree
  );

  score += (completeEntries.length / resumeData.education.length) * 30;

  return Math.min(score, 100);
};

// Calculate overall ATS score
const calculateOverallScore = (scores) => {
  return Object.entries(scores).reduce((total, [key, score]) => {
    return total + (score * ATS_WEIGHTS[key]);
  }, 0);
};

// Generate ATS recommendations
const generateRecommendations = (analysis) => {
  const recommendations = [];

  if (analysis.scores.keywords < 60) {
    recommendations.push({
      category: 'keywords',
      priority: 'high',
      message: 'Increase keyword matches with job description',
      action: 'Add relevant keywords to experience and skills sections'
    });
  }

  if (analysis.scores.formatting < 80) {
    recommendations.push({
      category: 'formatting',
      priority: 'medium',
      message: 'Improve ATS-friendly formatting',
      action: 'Use standard section headers and avoid complex formatting'
    });
  }

  if (analysis.scores.skills < 70) {
    recommendations.push({
      category: 'skills',
      priority: 'medium',
      message: 'Enhance skills section',
      action: 'Add more relevant technical and soft skills'
    });
  }

  if (analysis.missingKeywords.length > 5) {
    recommendations.push({
      category: 'keywords',
      priority: 'high',
      message: 'Many important keywords missing',
      action: 'Review job description and add missing keywords naturally'
    });
  }

  return recommendations;
};

// Generate specific improvements
const generateImprovements = (analysis, resumeData) => {
  const improvements = [];

  // Keyword improvements
  analysis.missingKeywords.slice(0, 5).forEach(missing => {
    improvements.push({
      type: 'keyword',
      suggestion: `Add "${missing.keyword}" to your resume`,
      section: suggestSectionForKeyword(missing.keyword),
      priority: missing.importance
    });
  });

  // Formatting improvements
  if (!resumeData.summary) {
    improvements.push({
      type: 'section',
      suggestion: 'Add a professional summary section',
      section: 'summary',
      priority: 3
    });
  }

  // Skills improvements
  if (!resumeData.skills || resumeData.skills.length === 0) {
    improvements.push({
      type: 'section',
      suggestion: 'Add a skills section with relevant technical and soft skills',
      section: 'skills',
      priority: 4
    });
  }

  return improvements.sort((a, b) => b.priority - a.priority);
};

// Suggest section for keyword placement
const suggestSectionForKeyword = (keyword) => {
  const technicalKeywords = ['javascript', 'python', 'sql', 'aws', 'react'];
  const softSkillKeywords = ['leadership', 'communication', 'teamwork'];
  
  if (technicalKeywords.includes(keyword)) {
    return 'skills';
  } else if (softSkillKeywords.includes(keyword)) {
    return 'experience';
  } else {
    return 'summary';
  }
};

// Optimize resume text for ATS
const optimizeResumeText = (text, targetKeywords) => {
  let optimizedText = text;
  
  targetKeywords.forEach(keyword => {
    if (!optimizedText.toLowerCase().includes(keyword.toLowerCase())) {
      // Suggest where to add the keyword naturally
      const suggestion = `Consider adding "${keyword}" to this section`;
      optimizedText += ` [${suggestion}]`;
    }
  });
  
  return optimizedText;
};

export {
  analyzeATSCompatibility,
  analyzeKeywords,
  extractJobKeywords,
  extractResumeKeywords,
  findKeywordMatch,
  getKeywordSynonyms,
  calculateKeywordDensity,
  analyzeFormatting,
  analyzeSkills,
  analyzeExperience,
  analyzeEducation,
  calculateOverallScore,
  generateRecommendations,
  generateImprovements,
  optimizeResumeText,
  ATS_WEIGHTS,
  ATS_FORMATTING_RULES
};
