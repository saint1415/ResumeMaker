/**
 * Keyword Analysis Utilities
 * Advanced keyword analysis and matching for resume optimization
 */

// Industry-specific keyword importance weights
const INDUSTRY_WEIGHTS = {
  technology: {
    technical: 0.4,
    soft: 0.2,
    tools: 0.2,
    certifications: 0.2
  },
  finance: {
    technical: 0.3,
    soft: 0.3,
    regulations: 0.2,
    certifications: 0.2
  },
  healthcare: {
    clinical: 0.4,
    soft: 0.3,
    certifications: 0.2,
    regulations: 0.1
  },
  marketing: {
    creative: 0.3,
    analytical: 0.3,
    soft: 0.2,
    tools: 0.2
  },
  default: {
    technical: 0.3,
    soft: 0.3,
    industry: 0.2,
    tools: 0.2
  }
};

// Comprehensive keyword database
const KEYWORD_DATABASE = {
  technology: {
    programming: ['javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift'],
    frameworks: ['react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel'],
    databases: ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb'],
    cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd'],
    tools: ['git', 'jira', 'confluence', 'slack', 'vs code', 'intellij', 'eclipse'],
    methodologies: ['agile', 'scrum', 'kanban', 'devops', 'tdd', 'microservices', 'api']
  },
  finance: {
    analysis: ['financial modeling', 'valuation', 'risk analysis', 'portfolio management', 'derivatives'],
    tools: ['excel', 'bloomberg', 'reuters', 'tableau', 'power bi', 'sas', 'r', 'python'],
    regulations: ['sox', 'basel', 'ifrs', 'gaap', 'cfa', 'frm', 'compliance'],
    products: ['equity', 'fixed income', 'commodities', 'fx', 'credit', 'structured products']
  },
  healthcare: {
    clinical: ['patient care', 'diagnosis', 'treatment', 'medical records', 'clinical trials'],
    specialties: ['cardiology', 'oncology', 'neurology', 'pediatrics', 'surgery', 'radiology'],
    systems: ['epic', 'cerner', 'meditech', 'allscripts', 'athenahealth', 'emr', 'ehr'],
    regulations: ['hipaa', 'fda', 'joint commission', 'osha', 'clinical governance']
  },
  marketing: {
    digital: ['seo', 'sem', 'social media', 'content marketing', 'email marketing', 'ppc'],
    analytics: ['google analytics', 'adobe analytics', 'mixpanel', 'segment', 'conversion tracking'],
    tools: ['hubspot', 'salesforce', 'marketo', 'mailchimp', 'hootsuite', 'canva', 'photoshop'],
    strategy: ['brand management', 'campaign management', 'market research', 'competitor analysis']
  },
  sales: {
    process: ['lead generation', 'prospecting', 'closing', 'negotiation', 'pipeline management'],
    tools: ['salesforce', 'hubspot', 'pipedrive', 'outreach', 'linkedin sales navigator'],
    metrics: ['quota attainment', 'conversion rates', 'average deal size', 'sales cycle', 'churn rate']
  }
};

// Analyze keyword relevance and importance
const analyzeKeywordRelevance = (keywords, industry = 'default', jobLevel = 'mid') => {
  const relevanceScores = keywords.map(keyword => {
    const baseScore = calculateBaseKeywordScore(keyword);
    const industryScore = calculateIndustryScore(keyword, industry);
    const levelScore = calculateLevelScore(keyword, jobLevel);
    
    return {
      keyword: keyword.word,
      baseScore,
      industryScore,
      levelScore,
      totalScore: (baseScore + industryScore + levelScore) / 3,
      category: categorizeKeyword(keyword.word),
      frequency: keyword.frequency || 1,
      importance: keyword.importance || 1
    };
  });

  return relevanceScores.sort((a, b) => b.totalScore - a.totalScore);
};

// Calculate base keyword score
const calculateBaseKeywordScore = (keyword) => {
  const word = keyword.word || keyword;
  let score = 1;

  // Technical terms generally score higher
  if (isTechnicalKeyword(word)) {
    score += 2;
  }

  // Industry-specific terms
  if (isIndustryKeyword(word)) {
    score += 1.5;
  }

  // Action verbs
  if (isActionVerb(word)) {
    score += 1;
  }

  // Certifications
  if (isCertification(word)) {
    score += 2;
  }

  return Math.min(score, 5);
};

// Calculate industry-specific score
const calculateIndustryScore = (keyword, industry) => {
  const word = keyword.word || keyword;
  const industryKeywords = KEYWORD_DATABASE[industry] || {};
  
  for (const [category, keywords] of Object.entries(industryKeywords)) {
    if (keywords.includes(word.toLowerCase())) {
      const weights = INDUSTRY_WEIGHTS[industry] || INDUSTRY_WEIGHTS.default;
      return (weights[category] || 0.2) * 5;
    }
  }
  
  return 1;
};

// Calculate job level score
const calculateLevelScore = (keyword, jobLevel) => {
  const word = keyword.word || keyword;
  const levelKeywords = {
    entry: ['internship', 'junior', 'assistant', 'trainee', 'associate', 'entry level'],
    mid: ['experienced', 'specialist', 'analyst', 'developer', 'coordinator', 'manager'],
    senior: ['senior', 'lead', 'principal', 'director', 'head', 'vp', 'chief', 'executive']
  };

  const currentLevelKeywords = levelKeywords[jobLevel] || levelKeywords.mid;
  
  if (currentLevelKeywords.some(lk => word.toLowerCase().includes(lk))) {
    return 3;
  }
  
  return 1;
};

// Check if keyword is technical
const isTechnicalKeyword = (word) => {
  const techPatterns = [
    /\b(javascript|python|java|sql|aws|react|node|api|database|cloud|docker|kubernetes)\b/i,
    /\b\w+\.(js|py|java|sql|html|css|php|rb|go|rs)\b/i,
    /\b(framework|library|sdk|ide|compiler|debugger)\b/i
  ];
  
  return techPatterns.some(pattern => pattern.test(word));
};

// Check if keyword is industry-specific
const isIndustryKeyword = (word) => {
  const allIndustryKeywords = Object.values(KEYWORD_DATABASE)
    .flatMap(industry => Object.values(industry))
    .flat();
  
  return allIndustryKeywords.includes(word.toLowerCase());
};

// Check if keyword is an action verb
const isActionVerb = (word) => {
  const actionVerbs = [
    'managed', 'led', 'developed', 'implemented', 'designed', 'created', 'built',
    'improved', 'optimized', 'analyzed', 'coordinated', 'supervised', 'executed',
    'delivered', 'launched', 'maintained', 'collaborated', 'facilitated', 'streamlined'
  ];
  
  return actionVerbs.includes(word.toLowerCase());
};

// Check if keyword is a certification
const isCertification = (word) => {
  const certifications = [
    'aws certified', 'azure certified', 'google cloud', 'cissp', 'cisa', 'cism',
    'pmp', 'scrum master', 'agile', 'itil', 'comptia', 'cisco', 'microsoft certified',
    'oracle certified', 'salesforce certified', 'tableau certified'
  ];
  
  return certifications.some(cert => word.toLowerCase().includes(cert));
};

// Advanced keyword matching with fuzzy logic
const findAdvancedKeywordMatches = (jobKeywords, resumeKeywords, threshold = 0.8) => {
  const matches = [];
  
  jobKeywords.forEach(jobKeyword => {
    const directMatch = resumeKeywords.find(rk => 
      rk.word.toLowerCase() === jobKeyword.word.toLowerCase()
    );
    
    if (directMatch) {
      matches.push({
        jobKeyword: jobKeyword.word,
        resumeKeyword: directMatch.word,
        matchType: 'exact',
        confidence: 1.0,
        frequency: directMatch.frequency
      });
      return;
    }

    // Fuzzy matching
    const fuzzyMatch = resumeKeywords.find(rk => 
      calculateSimilarity(rk.word, jobKeyword.word) >= threshold
    );
    
    if (fuzzyMatch) {
      matches.push({
        jobKeyword: jobKeyword.word,
        resumeKeyword: fuzzyMatch.word,
        matchType: 'fuzzy',
        confidence: calculateSimilarity(fuzzyMatch.word, jobKeyword.word),
        frequency: fuzzyMatch.frequency
      });
      return;
    }

    // Synonym matching
    const synonyms = getAdvancedSynonyms(jobKeyword.word);
    const synonymMatch = resumeKeywords.find(rk => 
      synonyms.some(synonym => rk.word.toLowerCase().includes(synonym.toLowerCase()))
    );
    
    if (synonymMatch) {
      matches.push({
        jobKeyword: jobKeyword.word,
        resumeKeyword: synonymMatch.word,
        matchType: 'synonym',
        confidence: 0.8,
        frequency: synonymMatch.frequency
      });
    }
  });

  return matches.sort((a, b) => b.confidence - a.confidence);
};

// Calculate string similarity using Levenshtein distance
const calculateSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

// Levenshtein distance calculation
const levenshteinDistance = (str1, str2) => {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};

// Get advanced synonyms with context
const getAdvancedSynonyms = (keyword) => {
  const synonymDatabase = {
    'javascript': ['js', 'ecmascript', 'node.js', 'nodejs', 'react', 'angular', 'vue'],
    'python': ['py', 'python3', 'django', 'flask', 'pandas', 'numpy', 'scipy'],
    'machine learning': ['ml', 'ai', 'artificial intelligence', 'deep learning', 'neural networks', 'data science'],
    'database': ['sql', 'mysql', 'postgresql', 'mongodb', 'nosql', 'data management', 'data storage'],
    'project management': ['pm', 'scrum master', 'agile', 'kanban', 'coordination', 'planning'],
    'user experience': ['ux', 'ui', 'user interface', 'usability', 'human-computer interaction', 'design'],
    'quality assurance': ['qa', 'testing', 'automation', 'selenium', 'test driven development', 'tdd'],
    'leadership': ['management', 'supervision', 'team lead', 'director', 'coordination', 'mentoring'],
    'communication': ['presentation', 'writing', 'speaking', 'interpersonal', 'collaboration'],
    'problem solving': ['troubleshooting', 'debugging', 'analytical', 'critical thinking', 'innovation'],
    'customer service': ['support', 'help desk', 'client relations', 'customer success', 'account management'],
    'data analysis': ['analytics', 'statistics', 'reporting', 'business intelligence', 'data visualization'],
    'cloud computing': ['aws', 'azure', 'gcp', 'cloud', 'saas', 'paas', 'iaas', 'serverless'],
    'cybersecurity': ['security', 'infosec', 'penetration testing', 'vulnerability assessment', 'incident response'],
    'devops': ['ci/cd', 'continuous integration', 'deployment', 'infrastructure', 'automation', 'docker', 'kubernetes'],
    'mobile development': ['ios', 'android', 'react native', 'flutter', 'swift', 'kotlin', 'xamarin'],
    'web development': ['frontend', 'backend', 'full stack', 'html', 'css', 'responsive design'],
    'digital marketing': ['seo', 'sem', 'social media', 'content marketing', 'email marketing', 'ppc', 'growth hacking'],
    'financial analysis': ['financial modeling', 'valuation', 'risk assessment', 'investment analysis', 'portfolio management'],
    'sales': ['business development', 'lead generation', 'account management', 'revenue generation', 'client acquisition']
  };

  return synonymDatabase[keyword.toLowerCase()] || [];
};

// Analyze keyword density and distribution
const analyzeKeywordDensity = (text, keywords) => {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const totalWords = words.length;
  
  const analysis = keywords.map(keyword => {
    const occurrences = words.filter(word => 
      word === keyword.toLowerCase() || 
      getAdvancedSynonyms(keyword).includes(word)
    ).length;
    
    const density = totalWords > 0 ? (occurrences / totalWords) * 100 : 0;
    
    return {
      keyword,
      occurrences,
      density: parseFloat(density.toFixed(2)),
      recommendation: getDensityRecommendation(density)
    };
  });

  return analysis.sort((a, b) => b.density - a.density);
};

// Get keyword density recommendation
const getDensityRecommendation = (density) => {
  if (density === 0) {
    return 'Add this keyword to your resume';
  } else if (density < 0.5) {
    return 'Consider increasing usage';
  } else if (density <= 2) {
    return 'Good keyword density';
  } else if (density <= 4) {
    return 'High density - ensure natural usage';
  } else {
    return 'Overused - reduce frequency to avoid keyword stuffing';
  }
};

// Generate keyword suggestions based on job description
const generateKeywordSuggestions = (jobDescription, currentKeywords, industry) => {
  const jobKeywords = extractJobKeywords(jobDescription);
  const currentKeywordWords = currentKeywords.map(kw => kw.word || kw);
  
  const suggestions = [];
  
  jobKeywords.forEach(jobKeyword => {
    const isPresent = currentKeywordWords.some(current => 
      current.toLowerCase() === jobKeyword.word.toLowerCase() ||
      getAdvancedSynonyms(jobKeyword.word).includes(current.toLowerCase())
    );
    
    if (!isPresent) {
      suggestions.push({
        keyword: jobKeyword.word,
        importance: jobKeyword.importance,
        category: jobKeyword.category,
        synonyms: getAdvancedSynonyms(jobKeyword.word),
        suggestedSection: suggestOptimalSection(jobKeyword.word),
        context: generateUsageContext(jobKeyword.word, industry)
      });
    }
  });

  return suggestions
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 15); // Top 15 suggestions
};

// Extract job keywords with advanced NLP
const extractJobKeywords = (jobDescription) => {
  const text = jobDescription.toLowerCase();
  const keywords = [];
  
  // Extract multi-word phrases first
  const phrases = extractKeyPhrases(text);
  phrases.forEach(phrase => {
    if (phrase.score > 0.5) {
      keywords.push({
        word: phrase.text,
        importance: phrase.score * 2,
        category: 'phrase',
        frequency: phrase.frequency
      });
    }
  });
  
  // Extract single keywords
  const singleKeywords = extractSingleKeywords(text);
  keywords.push(...singleKeywords);
  
  // Remove duplicates and sort by importance
  const uniqueKeywords = keywords.filter((keyword, index, self) => 
    index === self.findIndex(k => k.word === keyword.word)
  );
  
  return uniqueKeywords.sort((a, b) => b.importance - a.importance);
};

// Extract key phrases using simple n-gram analysis
const extractKeyPhrases = (text) => {
  const phrases = [];
  const words = text.match(/\b\w+\b/g) || [];
  
  // Extract 2-grams and 3-grams
  for (let n = 2; n <= 3; n++) {
    for (let i = 0; i <= words.length - n; i++) {
      const phrase = words.slice(i, i + n).join(' ');
      const existing = phrases.find(p => p.text === phrase);
      
      if (existing) {
        existing.frequency++;
      } else {
        phrases.push({
          text: phrase,
          frequency: 1,
          score: calculatePhraseScore(phrase)
        });
      }
    }
  }
  
  return phrases.filter(p => p.frequency > 1 && p.score > 0.3);
};

// Calculate phrase importance score
const calculatePhraseScore = (phrase) => {
  let score = 0;
  
  // Technical phrases score higher
  if (isTechnicalKeyword(phrase)) {
    score += 0.5;
  }
  
  // Industry-specific phrases
  if (isIndustryKeyword(phrase)) {
    score += 0.4;
  }
  
  // Phrases with action verbs
  if (phrase.split(' ').some(word => isActionVerb(word))) {
    score += 0.3;
  }
  
  // Avoid common phrases
  const commonPhrases = ['and the', 'of the', 'in the', 'to the', 'for the'];
  if (commonPhrases.includes(phrase)) {
    score -= 0.5;
  }
  
  return Math.max(score, 0);
};

// Extract single keywords with TF-IDF-like scoring
const extractSingleKeywords = (text) => {
  const words = text.match(/\b\w+\b/g) || [];
  const wordFreq = {};
  const totalWords = words.length;
  
  // Count word frequencies
  words.forEach(word => {
    if (word.length > 2 && !isStopWord(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  // Calculate TF-IDF-like scores
  return Object.entries(wordFreq).map(([word, freq]) => ({
    word,
    frequency: freq,
    importance: calculateWordImportance(word, freq, totalWords),
    category: categorizeKeyword(word)
  }));
};

// Check if word is a stop word
const isStopWord = (word) => {
  const stopWords = [
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'among', 'this', 'that', 'these', 'those', 'what', 'which',
    'who', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few',
    'more', 'most', 'other', 'some', 'such', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 'can', 'will', 'just', 'should', 'now'
  ];
  
  return stopWords.includes(word.toLowerCase());
};

// Calculate word importance
const calculateWordImportance = (word, frequency, totalWords) => {
  let importance = frequency / totalWords; // Base TF score
  
  // Boost technical terms
  if (isTechnicalKeyword(word)) {
    importance *= 2;
  }
  
  // Boost action verbs
  if (isActionVerb(word)) {
    importance *= 1.5;
  }
  
  // Boost industry keywords
  if (isIndustryKeyword(word)) {
    importance *= 1.8;
  }
  
  // Boost certifications
  if (isCertification(word)) {
    importance *= 2.5;
  }
  
  return importance;
};

// Suggest optimal section for keyword placement
const suggestOptimalSection = (keyword) => {
  if (isTechnicalKeyword(keyword)) {
    return 'skills';
  } else if (isActionVerb(keyword)) {
    return 'experience';
  } else if (isCertification(keyword)) {
    return 'certifications';
  } else {
    return 'summary';
  }
};

// Generate usage context for keywords
const generateUsageContext = (keyword, industry) => {
  const contexts = {
    technology: {
      'javascript': 'Developed web applications using JavaScript and modern frameworks',
      'python': 'Implemented data analysis solutions using Python and scientific libraries',
      'aws': 'Deployed and managed cloud infrastructure on AWS platform',
      'react': 'Built responsive user interfaces using React.js',
      'sql': 'Designed and optimized SQL databases for high-performance applications'
    },
    finance: {
      'financial modeling': 'Created comprehensive financial models for investment analysis',
      'risk analysis': 'Conducted thorough risk assessments for portfolio optimization',
      'excel': 'Developed advanced Excel models for financial reporting and analysis'
    },
    marketing: {
      'seo': 'Optimized website content for search engines, increasing organic traffic',
      'google analytics': 'Analyzed user behavior and conversion metrics using Google Analytics',
      'content marketing': 'Developed content marketing strategies to drive customer engagement'
    }
  };
  
  const industryContexts = contexts[industry] || contexts.technology;
  return industryContexts[keyword.toLowerCase()] || `Utilized ${keyword} in professional capacity`;
};

// Categorize keyword by type
const categorizeKeyword = (word) => {
  if (isTechnicalKeyword(word)) return 'technical';
  if (isActionVerb(word)) return 'action';
  if (isCertification(word)) return 'certification';
  if (isIndustryKeyword(word)) return 'industry';
  return 'general';
};

// Generate keyword optimization report
const generateKeywordReport = (resumeData, jobDescription, industry) => {
  const jobKeywords = extractJobKeywords(jobDescription);
  const resumeText = extractResumeText(resumeData);
  const resumeKeywords = extractSingleKeywords(resumeText);
  
  const matches = findAdvancedKeywordMatches(jobKeywords, resumeKeywords);
  const density = analyzeKeywordDensity(resumeText, jobKeywords.map(jk => jk.word));
  const suggestions = generateKeywordSuggestions(jobDescription, resumeKeywords, industry);
  
  return {
    matchScore: (matches.length / jobKeywords.length) * 100,
    totalMatches: matches.length,
    totalKeywords: jobKeywords.length,
    matches,
    density,
    suggestions,
    topMissingKeywords: suggestions.slice(0, 5),
    overusedKeywords: density.filter(d => d.density > 4),
    recommendations: generateKeywordRecommendations(matches, suggestions, density)
  };
};

// Extract text from resume data
const extractResumeText = (resumeData) => {
  const textParts = [
    resumeData.summary || '',
    resumeData.experience?.map(exp => 
      `${exp.position} ${exp.company} ${exp.description} ${exp.achievements?.join(' ') || ''}`
    ).join(' ') || '',
    resumeData.skills?.map(skill => 
      `${skill.category} ${skill.items?.join(' ') || ''}`
    ).join(' ') || '',
    resumeData.education?.map(edu => 
      `${edu.degree} ${edu.field} ${edu.institution}`
    ).join(' ') || ''
  ];
  
  return textParts.join(' ');
};

// Generate keyword recommendations
const generateKeywordRecommendations = (matches, suggestions, density) => {
  const recommendations = [];
  
  if (matches.length < 5) {
    recommendations.push({
      type: 'critical',
      message: 'Very few keyword matches found',
      action: 'Add more relevant keywords from job description'
    });
  }
  
  const overused = density.filter(d => d.density > 4);
  if (overused.length > 0) {
    recommendations.push({
      type: 'warning',
      message: 'Some keywords may be overused',
      action: 'Reduce frequency of overused keywords to appear more natural'
    });
  }
  
  if (suggestions.length > 10) {
    recommendations.push({
      type: 'opportunity',
      message: 'Many missing keywords identified',
      action: 'Focus on adding the top 5-7 most important missing keywords'
    });
  }
  
  return recommendations;
};

export {
  analyzeKeywordRelevance,
  calculateBaseKeywordScore,
  calculateIndustryScore,
  calculateLevelScore,
  findAdvancedKeywordMatches,
  calculateSimilarity,
  levenshteinDistance,
  getAdvancedSynonyms,
  analyzeKeywordDensity,
  getDensityRecommendation,
  generateKeywordSuggestions,
  extractJobKeywords,
  extractKeyPhrases,
  calculatePhraseScore,
  extractSingleKeywords,
  isStopWord,
  calculateWordImportance,
  suggestOptimalSection,
  generateUsageContext,
  categorizeKeyword,
  generateKeywordReport,
  extractResumeText,
  generateKeywordRecommendations,
  INDUSTRY_WEIGHTS,
  KEYWORD_DATABASE
};
