# API Reference

## Template Structure

Templates define resume styling and layout through JSON configuration.

### Template Properties

- `name` - Template display name
- `description` - Template description
- `styles` - Visual styling configuration
- `layout` - Page layout settings
- `sections` - Section arrangement and styling

### Styles Object

```json
{
  "primaryColor": "#2563eb",
  "secondaryColor": "#64748b", 
  "backgroundColor": "#ffffff",
  "textColor": "#1e293b",
  "headerFont": "Inter, sans-serif",
  "bodyFont": "Inter, sans-serif",
  "spacing": "1.5rem",
  "borderRadius": "0.5rem"
}
```

### Layout Object

```json
{
  "columns": 2,
  "headerHeight": "auto",
  "sectionSpacing": "2rem",
  "marginSize": "1.5rem"
}
```

### Section Configuration

```json
{
  "header": {
    "order": 1,
    "fullWidth": true,
    "style": "centered",
    "fields": ["name", "title", "contact"]
  }
}
```

## Resume Data Structure

Resume data follows standardized JSON format defined in schema.

### Required Fields

- `personal.name` - Full name
- `personal.email` - Email address

### Optional Sections

- `summary` - Professional summary
- `experience` - Work history array
- `education` - Education history array
- `skills` - Skills categorized array
- `projects` - Project showcase array
- `certifications` - Certification array

## Usage in Claude Artifacts

Access templates via raw GitHub URLs:

```javascript
const templateUrl = 'https://raw.githubusercontent.com/saint1415/ResumeMaker/main/templates/modern.json';
const response = await fetch(templateUrl);
const template = await response.json();
```
