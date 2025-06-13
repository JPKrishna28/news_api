import type { RawNewsArticle } from '@/types';
import { format } from 'date-fns';

const LOREM_IPSUM_SHORT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
const LOREM_IPSUM_MEDIUM = "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.";
const LOREM_IPSUM_LONG = "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

const NEWS_SOURCES = ["Times of India", "Hindustan Times", "The Hindu", "Indian Express", "Deccan Chronicle"];

const TITLES_TEMPLATES = {
  policeAction: [
    "Police Bust Major Racket in {City}",
    "Swift Police Action Averts Tragedy in {Location}",
    "City Police Crack Down on {CrimeType}",
    "Undercover Operation Leads to Arrests in {Neighborhood}",
    "High-Speed Chase Ends with Suspects in Custody",
  ],
  crimeReport: [
    "Spate of Burglaries Shakes {Area} Residents",
    "Mysterious Disappearance in {Town}, Police Investigate",
    "Public Alert Issued After {IncidentType} in {District}",
    "Increase in {MinorCrime} Reported in {Quarter}",
    "Fraudulent Scheme Uncovered, Victims Urged to Come Forward",
  ],
  generalNews: [
    "New Metro Line Inaugurated by {Official}",
    "City Prepares for Annual {EventName} Festival",
    "Weather Update: {WeatherCondition} Expected in {Region}",
    "Local Elections See Record Turnout in {Constituency}",
    "Tech Summit Focuses on AI and Future of Work",
  ],
  overlapping: [
    "Major Fire Breaks Out in {IndustrialArea}, Multiple Agencies Respond",
    "City Faces Severe Waterlogging After Heavy Rains",
    "Traffic Chaos on {HighwayName} Due to Accident",
  ]
};

const LOCATIONS = ["North District", "South City", "West Suburbs", "Central Plaza", "East Industrial Area", "Cyber City", "Port Area", "Green Valley", "Old Town", "Riverdale"];
const CITIES = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata"];
const CRIME_TYPES = ["Drug Trafficking", "Cybercrime Ring", "Illegal Gambling Den", "Counterfeiting Operation"];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTitle(category: keyof typeof TITLES_TEMPLATES): string {
  let template = getRandomElement(TITLES_TEMPLATES[category]);
  template = template.replace("{City}", getRandomElement(CITIES));
  template = template.replace("{Location}", getRandomElement(LOCATIONS));
  template = template.replace("{CrimeType}", getRandomElement(CRIME_TYPES));
  template = template.replace("{Neighborhood}", getRandomElement(LOCATIONS));
  template = template.replace("{Area}", getRandomElement(LOCATIONS));
  template = template.replace("{Town}", getRandomElement(CITIES));
  template = template.replace("{IncidentType}", "Suspicious Activity");
  template = template.replace("{District}", getRandomElement(LOCATIONS));
  template = template.replace("{MinorCrime}", "Petty Thefts");
  template = template.replace("{Quarter}", "Last Quarter");
  template = template.replace("{Official}", "Chief Minister");
  template = template.replace("{EventName}", "Cultural");
  template = template.replace("{WeatherCondition}", "Heavy Rainfall");
  template = template.replace("{Region}", "Coastal");
  template = template.replace("{Constituency}", "Urban Central");
  template = template.replace("{IndustrialArea}", getRandomElement(LOCATIONS));
  template = template.replace("{HighwayName}", `NH-${Math.floor(Math.random() * 100)}`);
  return template;
}

export function getMockNewsArticles(date: Date): RawNewsArticle[] {
  const articles: RawNewsArticle[] = [];
  const formattedDate = format(date, 'yyyy-MM-dd');
  let idCounter = 1;

  // Generate some police-relevant articles
  for (let i = 0; i < 3; i++) {
    const source = getRandomElement(NEWS_SOURCES);
    articles.push({
      id: `article-${idCounter++}-${Date.now()}`,
      title: generateTitle('policeAction'),
      content: `${LOREM_IPSUM_MEDIUM} ${LOREM_IPSUM_SHORT} This incident required significant police presence and investigation.`,
      source: source,
      url: `https://example.com/${source.toLowerCase().replace(/\s+/g, '-')}/police-action-${idCounter}`,
      publishedDate: formattedDate,
    });
  }

  // Generate some crime reports (might be police relevant)
  for (let i = 0; i < 2; i++) {
    const source = getRandomElement(NEWS_SOURCES);
    articles.push({
      id: `article-${idCounter++}-${Date.now()}`,
      title: generateTitle('crimeReport'),
      content: `${LOREM_IPSUM_SHORT} Police are appealing for witnesses. ${LOREM_IPSUM_SHORT}`,
      source: source,
      url: `https://example.com/${source.toLowerCase().replace(/\s+/g, '-')}/crime-report-${idCounter}`,
      publishedDate: formattedDate,
    });
  }
  
  // Generate general news (less likely police relevant)
  for (let i = 0; i < 3; i++) {
    const source = getRandomElement(NEWS_SOURCES);
    articles.push({
      id: `article-${idCounter++}-${Date.now()}`,
      title: generateTitle('generalNews'),
      content: LOREM_IPSUM_LONG,
      source: source,
      url: `https://example.com/${source.toLowerCase().replace(/\s+/g, '-')}/general-${idCounter}`,
      publishedDate: formattedDate,
    });
  }

  // Generate overlapping news from different sources
  const overlappingTitle = generateTitle('overlapping');
  const sourcesForOverlap = NEWS_SOURCES.slice(0, 2); // Take first 2 sources
  for (const source of sourcesForOverlap) {
    articles.push({
      id: `article-${idCounter++}-${Date.now()}`,
      title: overlappingTitle, // Same title
      content: `This is a report from ${source} regarding the incident. ${LOREM_IPSUM_MEDIUM} It caused widespread disruption and emergency services, including police, were at the scene.`, // Slightly varied content but similar theme
      source: source,
      url: `https://example.com/${source.toLowerCase().replace(/\s+/g, '-')}/overlap-${idCounter}`,
      publishedDate: formattedDate,
    });
  }
  
  // Another overlapping news story
  const overlappingTitle2 = generateTitle('overlapping');
    if (overlappingTitle2 !== overlappingTitle) { // ensure different story
    const sourcesForOverlap2 = NEWS_SOURCES.slice(2, 4); // Take next 2 sources
    for (const source of sourcesForOverlap2) {
        if (!sourcesForOverlap.includes(source)) { // ensure different sources than first overlap
            articles.push({
                id: `article-${idCounter++}-${Date.now()}`,
                title: overlappingTitle2, // Same title for this group
                content: `Report from ${source}: ${LOREM_IPSUM_SHORT} The situation is developing and police have cordoned off the area. ${LOREM_IPSUM_SHORT}`,
                source: source,
                url: `https://example.com/${source.toLowerCase().replace(/\s+/g, '-')}/overlap2-${idCounter}`,
                publishedDate: formattedDate,
            });
        }
    }
  }


  // Shuffle articles to make the order random
  for (let i = articles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [articles[i], articles[j]] = [articles[j], articles[i]];
  }

  return articles;
}
