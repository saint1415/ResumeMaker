/**
 * LinkedIn Profile Parser Utilities
 * Extracts resume data from LinkedIn profile URLs and scraped content
 */

// LinkedIn URL validation and normalization
const validateLinkedInURL = (url) => {
  const linkedinPatterns = [
    /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/,
    /^linkedin\.com\/in\/[\w-]+\/?$/,
    /^(www\.)?linkedin\.com\/in\/[\w-]+\/?$/
  ];
  
  return linkedinPatterns.some(pattern => pattern.test(url));
};

const normalizeLinkedInURL = (url) => {
  if (!url) return null;
  
  // Remove trailing slash and extra parameters
  let cleanUrl = url.replace(/\/$/, '').split('?')[0];
  
  // Add https if missing
  if (!cleanUrl.startsWith('http')) {
    cleanUrl = `https://${cleanUrl}`;
  }
  
  // Ensure www subdomain
  if (!cleanUrl.includes('www.')) {
    cleanUrl = cleanUrl.replace('linkedin.com', 'www.linkedin.com');
  }
  
  return cleanUrl;
};

// Extract LinkedIn username from URL
const extractLinkedInUsername = (url) => {
  const match = url.match(/linkedin\.com\/in\/([\w-]+)/);
  return match ? match[1] : null;
};

// Parse LinkedIn profile data from scraped HTML content
const parseLinkedInProfile = (htmlContent) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  const profile = {
    personal: {},
    summary: '',
    experience: [],
    education: [],
    skills: []
  };
  
  try {
    // Extract personal information
    profile.personal = extractPersonalInfo(doc);
    
    // Extract summary/about section
    profile.summary = extractSummary(doc);
    
    // Extract experience
    profile.experience = extractExperience(doc);
    
    // Extract education
    profile.education = extractEducation(doc);
    
    // Extract skills
    profile.skills = extractSkills(doc);
    
    return profile;
  } catch (error) {
    console.error('LinkedIn parsing error:', error);
    throw new Error('Failed to parse LinkedIn profile');
  }
};

// Extract personal information from LinkedIn profile
const extractPersonalInfo = (doc) => {
  const personal = {};
  
  // Name extraction
  const nameSelectors = [
    'h1.text-heading-xlarge',
    '.pv-text-details__left-panel h1',
    '.ph5 h1',
    '[data-field="profile-name"]'
  ];
  
  for (const selector of nameSelectors) {
    const nameElement = doc.querySelector(selector);
    if (nameElement) {
      personal.name = nameElement.textContent.trim();
      break;
    }
  }
  
  // Title extraction
  const titleSelectors = [
    '.text-body-medium.break-words',
    '.pv-text-details__left-panel .text-body-medium',
    '.ph5 .text-body-medium',
    '[data-field="profile-headline"]'
  ];
  
  for (const selector of titleSelectors) {
    const titleElement = doc.querySelector(selector);
    if (titleElement) {
      personal.title = titleElement.textContent.trim();
      break;
    }
  }
  
  // Location extraction
  const locationSelectors = [
    '.text-body-small.inline.t-black--light.break-words',
    '.pv-text-details__left-panel .text-body-small',
    '[data-field="profile-location"]'
  ];
  
  for (const selector of locationSelectors) {
    const locationElement = doc.querySelector(selector);
    if (locationElement) {
      personal.location = locationElement.textContent.trim();
      break;
    }
  }
  
  // Contact information (limited access due to LinkedIn privacy)
  const contactButton = doc.querySelector('[data-control-name="contact_see_more"]');
  if (contactButton) {
    // Contact info would need to be extracted from contact modal
    // This is typically restricted and requires user interaction
  }
  
  return personal;
};

// Extract summary/about section
const extractSummary = (doc) => {
  const summarySelectors = [
    '[data-field="summary"] .pv-shared-text-with-see-more',
    '.pv-about-section .pv-shared-text-with-see-more',
    '.about-section .pv-shared-text-with-see-more',
    '.summary-section .pv-shared-text-with-see-more'
  ];
  
  for (const selector of summarySelectors) {
    const summaryElement = doc.querySelector(selector);
    if (summaryElement) {
      return summaryElement.textContent.trim();
    }
  }
  
  return '';
};

// Extract experience section
const extractExperience = (doc) => {
  const experiences = [];
  
  const experienceSelectors = [
    '.pv-profile-section.experience-section .pv-entity__summary-info',
    '.experience-section .pv-entity__summary-info',
    '[data-field="experience"] .pv-entity__summary-info'
  ];
  
  let experienceElements = [];
  for (const selector of experienceSelectors) {
    experienceElements = doc.querySelectorAll(selector);
    if (experienceElements.length > 0) break;
  }
  
  experienceElements.forEach(element => {
    const experience = {};
    
    // Position title
    const positionElement = element.querySelector('.pv-entity__summary-info-v2 h3');
    if (positionElement) {
      experience.position = positionElement.textContent.trim();
    }
    
    // Company name
    const companyElement = element.querySelector('.pv-entity__secondary-title');
    if (companyElement) {
      experience.company = companyElement.textContent.trim();
    }
    
    // Duration
    const durationElement = element.querySelector('.pv-entity__bullet-item-v2');
    if (durationElement) {
      const durationText = durationElement.textContent.trim();
      const dates = parseDuration(durationText);
      experience.startDate = dates.start;
      experience.endDate = dates.end;
      experience.current = dates.current;
    }
    
    // Location
    const locationElement = element.querySelector('.pv-entity__location');
    if (locationElement) {
      experience.location = locationElement.textContent.trim();
    }
    
    // Description
    const descriptionElement = element.querySelector('.pv-shared-text-with-see-more');
    if (descriptionElement) {
      experience.description = descriptionElement.textContent.trim();
    }
    
    if (experience.position && experience.company) {
      experiences.push(experience);
    }
  });
  
  return experiences;
};

// Extract education section
const extractEducation = (doc) => {
  const education = [];
  
  const educationSelectors = [
    '.pv-profile-section.education-section .pv-entity__summary-info',
    '.education-section .pv-entity__summary-info',
    '[data-field="education"] .pv-entity__summary-info'
  ];
  
  let educationElements = [];
  for (const selector of educationSelectors) {
    educationElements = doc.querySelectorAll(selector);
    if (educationElements.length > 0) break;
  }
  
  educationElements.forEach(element => {
    const edu = {};
    
    // Institution name
    const institutionElement = element.querySelector('.pv-entity__school-name');
    if (institutionElement) {
      edu.institution = institutionElement.textContent.trim();
    }
    
    // Degree
    const degreeElement = element.querySelector('.pv-entity__degree-name');
    if (degreeElement) {
      edu.degree = degreeElement.textContent.trim();
    }
    
    // Field of study
    const fieldElement = element.querySelector('.pv-entity__fos');
    if (fieldElement) {
      edu.field = fieldElement.textContent.trim();
    }
    
    // Duration
    const durationElement = element.querySelector('.pv-entity__dates');
    if (durationElement) {
      const durationText = durationElement.textContent.trim();
      const dates = parseDuration(durationText);
      edu.startDate = dates.start;
      edu.endDate = dates.end;
    }
    
    if (edu.institution) {
      education.push(edu);
    }
  });
  
  return education;
};

// Extract skills section
const extractSkills = (doc) => {
  const skills = [];
  
  const skillsSelectors = [
    '.pv-skill-category-entity__name',
    '.pv-skill-entity__skill-name',
    '.skill-category-entity__name',
    '[data-field="skills"] .pv-skill-entity__skill-name'
  ];
  
  let skillElements = [];
  for (const selector of skillsSelectors) {
    skillElements = doc.querySelectorAll(selector);
    if (skillElements.length > 0) break;
  }
  
  const skillItems = [];
  skillElements.forEach(element => {
    const skillName = element.textContent.trim();
    if (skillName) {
      skillItems.push(skillName);
    }
  });
  
  if (skillItems.length > 0) {
    skills.push({
      category: 'Professional Skills',
      items: skillItems
    });
  }
  
  return skills;
};

// Parse duration strings from LinkedIn
const parseDuration = (durationText) => {
  const result = {
    start: null,
    end: null,
    current: false
  };
  
  // Handle "Present" or "Current"
  if (/present|current/i.test(durationText)) {
    result.current = true;
    result.end = new Date().toISOString().slice(0, 7);
  }
  
  // Parse date ranges like "Jan 2020 - Dec 2023"
  const dateRangePattern = /(\w{3}\s+\d{4})\s*[-–—]\s*(\w{3}\s+\d{4}|present|current)/i;
  const match = durationText.match(dateRangePattern);
  
  if (match) {
    result.start = parseLinkedInDate(match[1]);
    if (!result.current) {
      result.end = parseLinkedInDate(match[2]);
    }
  } else {
    // Handle single dates or year ranges
    const yearPattern = /(\d{4})/g;
    const years = durationText.match(yearPattern);
    if (years && years.length >= 1) {
      result.start = `${years[0]}-01`;
      if (years.length > 1) {
        result.end = `${years[1]}-12`;
      }
    }
  }
  
  return result;
};

// Parse LinkedIn date format to standard format
const parseLinkedInDate = (dateStr) => {
  if (!dateStr) return null;
  
  const monthNames = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
    'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
    'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
  };
  
  const match = dateStr.match(/(\w{3})\s+(\d{4})/i);
  if (match) {
    const month = monthNames[match[1].toLowerCase()];
    const year = match[2];
    return `${year}-${month}`;
  }
  
  return null;
};

// Generate LinkedIn profile URL variations for scraping
const generateLinkedInURLs = (username) => {
  const baseUrl = 'https://www.linkedin.com/in/';
  return [
    `${baseUrl}${username}`,
    `${baseUrl}${username}/`,
    `${baseUrl}${username}/details/experience/`,
    `${baseUrl}${username}/details/education/`,
    `${baseUrl}${username}/details/skills/`
  ];
};

// Create resume data from LinkedIn profile
const createResumeFromLinkedIn = (linkedinData, profileUrl) => {
  const resume = {
    personal: {
      ...linkedinData.personal,
      linkedin: profileUrl
    },
    summary: linkedinData.summary,
    experience: linkedinData.experience,
    education: linkedinData.education,
    skills: linkedinData.skills,
    metadata: {
      source: 'linkedin',
      extractedAt: new Date().toISOString(),
      profileUrl: profileUrl
    }
  };
  
  return resume;
};

// LinkedIn import workflow
const importLinkedInProfile = async (profileUrl) => {
  try {
    // Validate URL
    if (!validateLinkedInURL(profileUrl)) {
      throw new Error('Invalid LinkedIn profile URL');
    }
    
    // Normalize URL
    const normalizedUrl = normalizeLinkedInURL(profileUrl);
    
    // Note: Actual scraping would require a backend service
    // due to CORS and LinkedIn's anti-scraping measures
    throw new Error('LinkedIn scraping requires backend service due to CORS restrictions');
    
    // This is the intended workflow:
    // 1. Send URL to backend scraping service
    // 2. Backend returns scraped HTML content
    // 3. Parse content using parseLinkedInProfile
    // 4. Return structured resume data
    
  } catch (error) {
    console.error('LinkedIn import error:', error);
    throw error;
  }
};

// Manual LinkedIn data input helper
const createLinkedInDataTemplate = () => {
  return {
    personal: {
      name: '',
      title: '',
      location: '',
      linkedin: ''
    },
    summary: '',
    experience: [{
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    }],
    education: [{
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: ''
    }],
    skills: [{
      category: 'Professional Skills',
      items: []
    }]
  };
};

export {
  validateLinkedInURL,
  normalizeLinkedInURL,
  extractLinkedInUsername,
  parseLinkedInProfile,
  extractPersonalInfo,
  extractSummary,
  extractExperience,
  extractEducation,
  extractSkills,
  parseDuration,
  parseLinkedInDate,
  generateLinkedInURLs,
  createResumeFromLinkedIn,
  importLinkedInProfile,
  createLinkedInDataTemplate
};
