/**
 * Social Media Profile Parser Utilities
 * Extracts resume data from GitHub, portfolio sites, and other social platforms
 */

// GitHub profile parsing
const parseGitHubProfile = async (username) => {
  try {
    const profileUrl = `https://api.github.com/users/${username}`;
    const reposUrl = `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`;
    
    const [profileResponse, reposResponse] = await Promise.all([
      fetch(profileUrl),
      fetch(reposUrl)
    ]);
    
    if (!profileResponse.ok || !reposResponse.ok) {
      throw new Error('Failed to fetch GitHub profile');
    }
    
    const profileData = await profileResponse.json();
    const reposData = await reposResponse.json();
    
    return {
      personal: {
        name: profileData.name || profileData.login,
        github: profileData.html_url,
        website: profileData.blog || null,
        location: profileData.location,
        email: profileData.email,
        bio: profileData.bio
      },
      projects: reposData.map(repo => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        technologies: repo.language ? [repo.language] : [],
        date: repo.updated_at.slice(0, 7), // YYYY-MM format
        stars: repo.stargazers_count,
        forks: repo.forks_count
      })),
      stats: {
        publicRepos: profileData.public_repos,
        followers: profileData.followers,
        following: profileData.following,
        joinDate: profileData.created_at.slice(0, 7)
      }
    };
  } catch (error) {
    console.error('GitHub parsing error:', error);
    throw new Error('Failed to parse GitHub profile');
  }
};

// Extract GitHub username from URL
const extractGitHubUsername = (url) => {
  const patterns = [
    /github\.com\/([^\/\?]+)/,
    /^([^\/\?]+)$/  // Just username
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
};

// Portfolio website parsing
const parsePortfolioSite = async (url) => {
  try {
    // Note: This would require a backend service or CORS proxy
    // due to cross-origin restrictions
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch portfolio site');
    }
    
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    return {
      personal: {
        name: extractNameFromPortfolio(doc),
        title: extractTitleFromPortfolio(doc),
        website: url,
        email: extractEmailFromPortfolio(doc)
      },
      summary: extractBioFromPortfolio(doc),
      projects: extractProjectsFromPortfolio(doc),
      skills: extractSkillsFromPortfolio(doc)
    };
  } catch (error) {
    console.error('Portfolio parsing error:', error);
    throw new Error('Failed to parse portfolio site');
  }
};

// Extract name from portfolio site
const extractNameFromPortfolio = (doc) => {
  const selectors = [
    'h1',
    '.name',
    '.title',
    'header h1',
    '.hero h1',
    '.about h1',
    '[data-testid="name"]'
  ];
  
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element && element.textContent.trim().length > 0) {
      return element.textContent.trim();
    }
  }
  
  return null;
};

// Extract title/role from portfolio site
const extractTitleFromPortfolio = (doc) => {
  const selectors = [
    '.subtitle',
    '.tagline',
    '.role',
    'h2',
    '.hero h2',
    '.about h2',
    '[data-testid="title"]'
  ];
  
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element && element.textContent.trim().length > 0) {
      return element.textContent.trim();
    }
  }
  
  return null;
};

// Extract email from portfolio site
const extractEmailFromPortfolio = (doc) => {
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const bodyText = doc.body.textContent;
  const emailMatch = bodyText.match(emailPattern);
  
  if (emailMatch) {
    return emailMatch[0];
  }
  
  // Check for mailto links
  const mailtoLinks = doc.querySelectorAll('a[href^="mailto:"]');
  if (mailtoLinks.length > 0) {
    return mailtoLinks[0].href.replace('mailto:', '');
  }
  
  return null;
};

// Extract bio/about from portfolio site
const extractBioFromPortfolio = (doc) => {
  const selectors = [
    '.about p',
    '.bio p',
    '.intro p',
    '.description p',
    '.summary p',
    '[data-testid="bio"]'
  ];
  
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element && element.textContent.trim().length > 50) {
      return element.textContent.trim();
    }
  }
  
  return null;
};

// Extract projects from portfolio site
const extractProjectsFromPortfolio = (doc) => {
  const projects = [];
  
  const projectSelectors = [
    '.project',
    '.work-item',
    '.portfolio-item',
    '.case-study',
    '[data-testid="project"]'
  ];
  
  let projectElements = [];
  for (const selector of projectSelectors) {
    projectElements = doc.querySelectorAll(selector);
    if (projectElements.length > 0) break;
  }
  
  projectElements.forEach(element => {
    const project = {};
    
    // Project name
    const nameElement = element.querySelector('h3, h4, .title, .name');
    if (nameElement) {
      project.name = nameElement.textContent.trim();
    }
    
    // Project description
    const descElement = element.querySelector('p, .description, .summary');
    if (descElement) {
      project.description = descElement.textContent.trim();
    }
    
    // Project URL
    const linkElement = element.querySelector('a[href]');
    if (linkElement) {
      project.url = linkElement.href;
    }
    
    // Technologies (look for tags or tech lists)
    const techElements = element.querySelectorAll('.tag, .tech, .technology');
    if (techElements.length > 0) {
      project.technologies = Array.from(techElements).map(el => el.textContent.trim());
    }
    
    if (project.name) {
      projects.push(project);
    }
  });
  
  return projects;
};

// Extract skills from portfolio site
const extractSkillsFromPortfolio = (doc) => {
  const skills = [];
  
  const skillSelectors = [
    '.skills li',
    '.skill-item',
    '.technology',
    '.tech-stack li',
    '[data-testid="skill"]'
  ];
  
  let skillElements = [];
  for (const selector of skillSelectors) {
    skillElements = doc.querySelectorAll(selector);
    if (skillElements.length > 0) break;
  }
  
  const skillItems = [];
  skillElements.forEach(element => {
    const skill = element.textContent.trim();
    if (skill) {
      skillItems.push(skill);
    }
  });
  
  if (skillItems.length > 0) {
    skills.push({
      category: 'Technical Skills',
      items: skillItems
    });
  }
  
  return skills;
};

// Twitter/X profile parsing (limited due to API restrictions)
const parseTwitterProfile = async (username) => {
  // Note: Twitter API requires authentication
  // This is a placeholder for potential future implementation
  
  return {
    personal: {
      name: null,
      title: null,
      twitter: `https://twitter.com/${username}`,
      website: null,
      location: null,
      bio: null
    },
    summary: null,
    projects: [],
    skills: []
  };
};

// Generic social media profile parser
const parseSocialMediaProfile = async (url) => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    if (domain.includes('github.com')) {
      const username = extractGitHubUsername(url);
      return await parseGitHubProfile(username);
    } else if (domain.includes('linkedin.com')) {
      // LinkedIn parsing would be handled by linkedin-parser.js
      throw new Error('Use LinkedIn parser for LinkedIn profiles');
    } else if (domain.includes('twitter.com') || domain.includes('x.com')) {
      const username = url.split('/').pop();
      return await parseTwitterProfile(username);
    } else {
      // Treat as portfolio site
      return await parsePortfolioSite(url);
    }
  } catch (error) {
    console.error('Social media parsing error:', error);
    throw new Error('Failed to parse social media profile');
  }
};

// Validate social media URLs
const validateSocialMediaURL = (url) => {
  try {
    const urlObj = new URL(url);
    const validDomains = [
      'github.com',
      'linkedin.com',
      'twitter.com',
      'x.com',
      'behance.net',
      'dribbble.com',
      'medium.com',
      'dev.to'
    ];
    
    const domain = urlObj.hostname.toLowerCase();
    return validDomains.some(validDomain => domain.includes(validDomain)) || 
           domain.includes('.dev') || 
           domain.includes('.io') ||
           domain.includes('.me');
  } catch (error) {
    return false;
  }
};

// Merge social media data into resume
const mergeSocialMediaData = (resumeData, socialMediaData) => {
  const merged = { ...resumeData };
  
  // Merge personal information
  if (socialMediaData.personal) {
    merged.personal = {
      ...merged.personal,
      ...socialMediaData.personal
    };
  }
  
  // Merge or update summary
  if (socialMediaData.summary && !merged.summary) {
    merged.summary = socialMediaData.summary;
  }
  
  // Merge projects
  if (socialMediaData.projects && socialMediaData.projects.length > 0) {
    merged.projects = [...(merged.projects || []), ...socialMediaData.projects];
  }
  
  // Merge skills
  if (socialMediaData.skills && socialMediaData.skills.length > 0) {
    merged.skills = [...(merged.skills || []), ...socialMediaData.skills];
  }
  
  return merged;
};

// Batch process multiple social media profiles
const processSocialMediaProfiles = async (urls) => {
  const results = {
    success: [],
    errors: []
  };
  
  const promises = urls.map(async (url) => {
    try {
      const data = await parseSocialMediaProfile(url);
      results.success.push({ url, data });
    } catch (error) {
      results.errors.push({ url, error: error.message });
    }
  });
  
  await Promise.allSettled(promises);
  return results;
};

// Generate social media profile suggestions
const generateProfileSuggestions = (resumeData) => {
  const suggestions = [];
  
  if (resumeData.personal) {
    const name = resumeData.personal.name;
    const cleanName = name ? name.toLowerCase().replace(/\s+/g, '') : '';
    
    if (cleanName) {
      suggestions.push({
        platform: 'GitHub',
        url: `https://github.com/${cleanName}`,
        description: 'Showcase your code repositories and contributions'
      });
      
      suggestions.push({
        platform: 'LinkedIn',
        url: `https://linkedin.com/in/${cleanName}`,
        description: 'Professional networking and career history'
      });
      
      suggestions.push({
        platform: 'Portfolio',
        url: `https://${cleanName}.dev`,
        description: 'Personal website showcasing your work'
      });
    }
  }
  
  return suggestions;
};

export {
  parseGitHubProfile,
  extractGitHubUsername,
  parsePortfolioSite,
  extractNameFromPortfolio,
  extractTitleFromPortfolio,
  extractEmailFromPortfolio,
  extractBioFromPortfolio,
  extractProjectsFromPortfolio,
  extractSkillsFromPortfolio,
  parseTwitterProfile,
  parseSocialMediaProfile,
  validateSocialMediaURL,
  mergeSocialMediaData,
  processSocialMediaProfiles,
  generateProfileSuggestions
};
