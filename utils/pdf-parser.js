/**
 * PDF Resume Parser Utilities
 * Extracts text and structured data from PDF resumes
 */

// PDF.js integration for text extraction
const extractTextFromPDF = async (pdfFile) => {
  try {
    const pdfjsLib = window.pdfjsLib;
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

// Section identification patterns
const SECTION_PATTERNS = {
  name: /^([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/m,
  email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
  phone: /(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/,
  linkedin: /(linkedin\.com\/in\/[\w-]+)/,
  github: /(github\.com\/[\w-]+)/,
  website: /((?:https?:\/\/)?(?:www\.)?[\w-]+\.[\w.]+)/,
  
  experience: /(?:EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT|PROFESSIONAL EXPERIENCE)/i,
  education: /(?:EDUCATION|ACADEMIC BACKGROUND|QUALIFICATIONS)/i,
  skills: /(?:SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|EXPERTISE)/i,
  projects: /(?:PROJECTS|PORTFOLIO|WORK SAMPLES)/i,
  certifications: /(?:CERTIFICATIONS|CERTIFICATES|LICENSES)/i,
  summary: /(?:SUMMARY|PROFILE|OBJECTIVE|ABOUT)/i
};

// Extract personal information
const extractPersonalInfo = (text) => {
  const personal = {};
  
  const nameMatch = text.match(SECTION_PATTERNS.name);
  if (nameMatch) personal.name = nameMatch[1].trim();
  
  const emailMatch = text.match(SECTION_PATTERNS.email);
  if (emailMatch) personal.email = emailMatch[1];
  
  const phoneMatch = text.match(SECTION_PATTERNS.phone);
  if (phoneMatch) personal.phone = phoneMatch[1];
  
  const linkedinMatch = text.match(SECTION_PATTERNS.linkedin);
  if (linkedinMatch) personal.linkedin = linkedinMatch[1];
  
  const githubMatch = text.match(SECTION_PATTERNS.github);
  if (githubMatch) personal.github = githubMatch[1];
  
  const websiteMatch = text.match(SECTION_PATTERNS.website);
  if (websiteMatch && !websiteMatch[1].includes('linkedin') && !websiteMatch[1].includes('github')) {
    personal.website = websiteMatch[1];
  }
  
  return personal;
};

// Extract section content
const extractSection = (text, sectionName) => {
  const pattern = SECTION_PATTERNS[sectionName];
  if (!pattern) return null;
  
  const sectionMatch = text.match(pattern);
  if (!sectionMatch) return null;
  
  const sectionStart = sectionMatch.index + sectionMatch[0].length;
  const nextSectionPattern = /(?:EXPERIENCE|EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS|SUMMARY|PROFILE|OBJECTIVE|ABOUT)/i;
  
  const remainingText = text.substring(sectionStart);
  const nextSectionMatch = remainingText.match(nextSectionPattern);
  
  const sectionEnd = nextSectionMatch ? nextSectionMatch.index : remainingText.length;
  const sectionContent = remainingText.substring(0, sectionEnd).trim();
  
  return sectionContent;
};

// Parse experience section
const parseExperience = (experienceText) => {
  if (!experienceText) return [];
  
  const experiences = [];
  const jobBlocks = experienceText.split(/\n\n+/);
  
  jobBlocks.forEach(block => {
    const lines = block.split('\n').filter(line => line.trim());
    if (lines.length < 2) return;
    
    const experience = {};
    
    // First line usually contains position and company
    const firstLine = lines[0];
    const positionCompanyMatch = firstLine.match(/(.+?)\s+(?:at|@)\s+(.+)/);
    if (positionCompanyMatch) {
      experience.position = positionCompanyMatch[1].trim();
      experience.company = positionCompanyMatch[2].trim();
    } else {
      experience.position = firstLine.trim();
      if (lines[1]) experience.company = lines[1].trim();
    }
    
    // Look for dates
    const datePattern = /(\d{4}|\w{3,9}\s+\d{4})\s*[-–—]\s*(\d{4}|\w{3,9}\s+\d{4}|present|current)/i;
    const dateMatch = block.match(datePattern);
    if (dateMatch) {
      experience.startDate = dateMatch[1];
      experience.endDate = dateMatch[2];
      experience.current = /present|current/i.test(dateMatch[2]);
    }
    
    // Extract achievements/description
    const achievements = [];
    lines.forEach(line => {
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        achievements.push(line.substring(1).trim());
      }
    });
    
    if (achievements.length > 0) {
      experience.achievements = achievements;
    }
    
    experiences.push(experience);
  });
  
  return experiences;
};

// Parse education section
const parseEducation = (educationText) => {
  if (!educationText) return [];
  
  const education = [];
  const schoolBlocks = educationText.split(/\n\n+/);
  
  schoolBlocks.forEach(block => {
    const lines = block.split('\n').filter(line => line.trim());
    if (lines.length < 1) return;
    
    const edu = {};
    
    // Extract degree and institution
    const degreeInstitutionMatch = lines[0].match(/(.+?)\s+(?:from|at)\s+(.+)/);
    if (degreeInstitutionMatch) {
      edu.degree = degreeInstitutionMatch[1].trim();
      edu.institution = degreeInstitutionMatch[2].trim();
    } else {
      edu.degree = lines[0].trim();
      if (lines[1]) edu.institution = lines[1].trim();
    }
    
    // Look for dates
    const datePattern = /(\d{4})\s*[-–—]\s*(\d{4})/;
    const dateMatch = block.match(datePattern);
    if (dateMatch) {
      edu.startDate = dateMatch[1];
      edu.endDate = dateMatch[2];
    }
    
    // Look for GPA
    const gpaMatch = block.match(/GPA:?\s*(\d+\.\d+)/i);
    if (gpaMatch) {
      edu.gpa = gpaMatch[1];
    }
    
    education.push(edu);
  });
  
  return education;
};

// Parse skills section
const parseSkills = (skillsText) => {
  if (!skillsText) return [];
  
  const skills = [];
  const lines = skillsText.split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    if (line.includes(':')) {
      const [category, items] = line.split(':');
      const skillItems = items.split(/[,;]/).map(item => item.trim()).filter(item => item);
      skills.push({
        category: category.trim(),
        items: skillItems
      });
    } else {
      // Single line of skills
      const skillItems = line.split(/[,;]/).map(item => item.trim()).filter(item => item);
      if (skillItems.length > 0) {
        skills.push({
          category: 'Skills',
          items: skillItems
        });
      }
    }
  });
  
  return skills;
};

// Main PDF parsing function
const parsePDFResume = async (pdfFile) => {
  try {
    const text = await extractTextFromPDF(pdfFile);
    
    const resume = {
      personal: extractPersonalInfo(text),
      summary: extractSection(text, 'summary'),
      experience: parseExperience(extractSection(text, 'experience')),
      education: parseEducation(extractSection(text, 'education')),
      skills: parseSkills(extractSection(text, 'skills'))
    };
    
    return resume;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF resume');
  }
};

export {
  extractTextFromPDF,
  extractPersonalInfo,
  parseExperience,
  parseEducation,
  parseSkills,
  parsePDFResume
};
