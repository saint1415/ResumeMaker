/**
 * Text Processing Utilities
 * Clean and standardize extracted resume text
 */

// Clean and normalize text
const cleanText = (text) => {
  if (!text) return '';
  
  return text
    .replace(/\s+/g, ' ')           // Multiple spaces to single
    .replace(/\n+/g, '\n')          // Multiple newlines to single
    .replace(/[^\w\s\n.,@-]/g, '')  // Remove special chars except basic punctuation
    .trim();
};

// Standardize date formats
const standardizeDate = (dateStr) => {
  if (!dateStr) return '';
  
  // Handle "present" or "current"
  if (/present|current/i.test(dateStr)) {
    return new Date().toISOString().slice(0, 7); // YYYY-MM format
  }
  
  // Handle various date formats
  const datePatterns = [
    /(\w{3,9})\s+(\d{4})/,          // "January 2020"
    /(\d{1,2})\/(\d{4})/,           // "01/2020"
    /(\d{4})-(\d{1,2})/,            // "2020-01"
    /(\d{4})/                       // "2020"
  ];
  
  for (const pattern of datePatterns) {
    const match = dateStr.match(pattern);
    if (match) {
      if (pattern === datePatterns[0]) {
        // Month name format
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                           'july', 'august', 'september', 'october', 'november', 'december'];
        const monthIndex = monthNames.indexOf(match[1].toLowerCase());
        if (monthIndex !== -1) {
          return `${match[2]}-${String(monthIndex + 1).padStart(2, '0')}`;
        }
      } else if (pattern === datePatterns[1]) {
        // MM/YYYY format
        return `${match[2]}-${String(match[1]).padStart(2, '0')}`;
      } else if (pattern === datePatterns[2]) {
        // YYYY-MM format
        return match[0];
      } else if (pattern === datePatterns[3]) {
        // YYYY format
        return `${match[1]}-01`;
      }
    }
  }
  
  return dateStr; // Return original if no pattern matches
};

// Extract and clean contact information
const processContactInfo = (text) => {
  const contact = {};
  
  // Email extraction and cleaning
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const emailMatch = text.match(emailPattern);
  if (emailMatch) {
    contact.email = emailMatch[0].toLowerCase();
  }
  
  // Phone number extraction and formatting
  const phonePattern = /(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/g;
  const phoneMatch = text.match(phonePattern);
  if (phoneMatch) {
    // Clean phone number
    const cleanPhone = phoneMatch[0].replace(/[^\d+]/g, '');
    contact.phone = cleanPhone.startsWith('+1') ? cleanPhone : `+1${cleanPhone}`;
  }
  
  // LinkedIn URL extraction
  const linkedinPattern = /(linkedin\.com\/in\/[\w-]+)/gi;
  const linkedinMatch = text.match(linkedinPattern);
  if (linkedinMatch) {
    contact.linkedin = `https://${linkedinMatch[0]}`;
  }
  
  // GitHub URL extraction
  const githubPattern = /(github\.com\/[\w-]+)/gi;
  const githubMatch = text.match(githubPattern);
  if (githubMatch) {
    contact.github = `https://${githubMatch[0]}`;
  }
  
  // Website URL extraction
  const websitePattern = /((?:https?:\/\/)?(?:www\.)?[\w-]+\.[\w.]+)/g;
  const websiteMatches = text.match(websitePattern);
  if (websiteMatches) {
    const website = websiteMatches.find(url => 
      !url.includes('linkedin') && 
      !url.includes('github') && 
      !url.includes('email')
    );
    if (website) {
      contact.website = website.startsWith('http') ? website : `https://${website}`;
    }
  }
  
  return contact;
};

// Process and structure experience data
const processExperience = (experienceArray) => {
  if (!Array.isArray(experienceArray)) return [];
  
  return experienceArray.map(exp => ({
    company: cleanText(exp.company),
    position: cleanText(exp.position),
    location: cleanText(exp.location),
    startDate: standardizeDate(exp.startDate),
    endDate: standardizeDate(exp.endDate),
    current: exp.current || false,
    description: cleanText(exp.description),
    achievements: exp.achievements ? exp.achievements.map(achievement => cleanText(achievement)) : []
  })).filter(exp => exp.company && exp.position);
};

// Process and structure education data
const processEducation = (educationArray) => {
  if (!Array.isArray(educationArray)) return [];
  
  return educationArray.map(edu => ({
    institution: cleanText(edu.institution),
    degree: cleanText(edu.degree),
    field: cleanText(edu.field),
    location: cleanText(edu.location),
    startDate: standardizeDate(edu.startDate),
    endDate: standardizeDate(edu.endDate),
    gpa: edu.gpa ? cleanText(edu.gpa) : undefined,
    honors: cleanText(edu.honors)
  })).filter(edu => edu.institution && edu.degree);
};

// Process and structure skills data
const processSkills = (skillsArray) => {
  if (!Array.isArray(skillsArray)) return [];
  
  return skillsArray.map(skillGroup => ({
    category: cleanText(skillGroup.category),
    items: skillGroup.items ? skillGroup.items.map(item => cleanText(item)).filter(item => item) : [],
    level: cleanText(skillGroup.level)
  })).filter(skillGroup => skillGroup.items.length > 0);
};

// Validate and clean resume data structure
const validateResumeData = (resumeData) => {
  const cleaned = {
    personal: {},
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: []
  };
  
  // Process personal information
  if (resumeData.personal) {
    cleaned.personal = {
      name: cleanText(resumeData.personal.name),
      title: cleanText(resumeData.personal.title),
      email: resumeData.personal.email,
      phone: resumeData.personal.phone,
      location: cleanText(resumeData.personal.location),
      ...processContactInfo(JSON.stringify(resumeData.personal))
    };
  }
  
  // Process summary
  if (resumeData.summary) {
    cleaned.summary = cleanText(resumeData.summary);
  }
  
  // Process experience
  if (resumeData.experience) {
    cleaned.experience = processExperience(resumeData.experience);
  }
  
  // Process education
  if (resumeData.education) {
    cleaned.education = processEducation(resumeData.education);
  }
  
  // Process skills
  if (resumeData.skills) {
    cleaned.skills = processSkills(resumeData.skills);
  }
  
  return cleaned;
};

// Text analysis functions
const analyzeText = (text) => {
  const analysis = {
    wordCount: 0,
    keywordDensity: {},
    readabilityScore: 0,
    sections: []
  };
  
  if (!text) return analysis;
  
  const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  analysis.wordCount = words.length;
  
  // Calculate keyword density
  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  analysis.keywordDensity = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .reduce((obj, [word, freq]) => {
      obj[word] = (freq / words.length * 100).toFixed(2);
      return obj;
    }, {});
  
  return analysis;
};

// Score resume completeness
const scoreResume = (resumeData) => {
  const scores = {
    personal: 0,
    summary: 0,
    experience: 0,
    education: 0,
    skills: 0,
    overall: 0
  };
  
  // Personal information score
  if (resumeData.personal) {
    let personalScore = 0;
    if (resumeData.personal.name) personalScore += 20;
    if (resumeData.personal.email) personalScore += 20;
    if (resumeData.personal.phone) personalScore += 15;
    if (resumeData.personal.location) personalScore += 10;
    if (resumeData.personal.linkedin) personalScore += 10;
    if (resumeData.personal.github) personalScore += 10;
    if (resumeData.personal.website) personalScore += 10;
    if (resumeData.personal.title) personalScore += 5;
    scores.personal = Math.min(personalScore, 100);
  }
  
  // Summary score
  if (resumeData.summary && resumeData.summary.length > 50) {
    scores.summary = 100;
  } else if (resumeData.summary) {
    scores.summary = 50;
  }
  
  // Experience score
  if (resumeData.experience && resumeData.experience.length > 0) {
    const avgScore = resumeData.experience.reduce((sum, exp) => {
      let expScore = 0;
      if (exp.company) expScore += 25;
      if (exp.position) expScore += 25;
      if (exp.startDate) expScore += 20;
      if (exp.achievements && exp.achievements.length > 0) expScore += 30;
      return sum + expScore;
    }, 0) / resumeData.experience.length;
    scores.experience = avgScore;
  }
  
  // Education score
  if (resumeData.education && resumeData.education.length > 0) {
    scores.education = 100;
  }
  
  // Skills score
  if (resumeData.skills && resumeData.skills.length > 0) {
    scores.skills = 100;
  }
  
  // Overall score
  scores.overall = Math.round((scores.personal + scores.summary + scores.experience + scores.education + scores.skills) / 5);
  
  return scores;
};

export {
  cleanText,
  standardizeDate,
  processContactInfo,
  processExperience,
  processEducation,
  processSkills,
  validateResumeData,
  analyzeText,
  scoreResume
};
