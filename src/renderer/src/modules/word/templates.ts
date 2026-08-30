export interface DocTemplate {
  id: string
  label: string
  description: string
  /** Short mock lines rendered inside the tile thumbnail — not real page content. */
  thumbnailLines: { text: string; bold?: boolean; align?: 'left' | 'center' }[]
  html: string
}

export const BLANK_TEMPLATE: DocTemplate = {
  id: 'blank',
  label: 'Blank document',
  description: '',
  thumbnailLines: [],
  html: '<p></p>'
}

export const TEMPLATES: DocTemplate[] = [
  {
    id: 'resume',
    label: 'Simple resume',
    description: 'A clean starting point for a one-page resume.',
    thumbnailLines: [
      { text: 'Your Name', bold: true, align: 'center' },
      { text: 'Email · Phone · City', align: 'center' },
      { text: 'Experience', bold: true },
      { text: 'Education', bold: true }
    ],
    html: `
      <h1 style="text-align:center">Your Name</h1>
      <p style="text-align:center">email@example.com · (555) 555-5555 · City, State</p>
      <h2>Experience</h2>
      <p><strong>Job Title</strong> — Company Name (Year–Year)</p>
      <ul><li>Describe an accomplishment.</li><li>Describe another accomplishment.</li></ul>
      <h2>Education</h2>
      <p><strong>Degree</strong> — School Name (Year)</p>
      <h2>Skills</h2>
      <p>Skill one, skill two, skill three.</p>
    `
  },
  {
    id: 'letter',
    label: 'Business letter',
    description: 'A formal letter layout with sender/recipient blocks.',
    thumbnailLines: [
      { text: 'Your Name' },
      { text: 'Date' },
      { text: 'Dear ___,' },
      { text: 'Sincerely,' }
    ],
    html: `
      <p>Your Name<br/>Your Address<br/>City, State ZIP</p>
      <p>${new Date().toLocaleDateString()}</p>
      <p>Recipient Name<br/>Recipient Address<br/>City, State ZIP</p>
      <p>Dear [Recipient],</p>
      <p>Start your letter here.</p>
      <p>Sincerely,</p>
      <p>Your Name</p>
    `
  },
  {
    id: 'report',
    label: 'Quarterly report',
    description: 'A title page with an executive summary section.',
    thumbnailLines: [
      { text: 'Quarterly Report', bold: true, align: 'center' },
      { text: 'Executive Summary', bold: true }
    ],
    html: `
      <h1 style="text-align:center">Quarterly Report</h1>
      <h2>Executive Summary</h2>
      <p>Summarize the quarter's key results here.</p>
      <h2>Highlights</h2>
      <ul><li>Highlight one.</li><li>Highlight two.</li></ul>
    `
  }
]
