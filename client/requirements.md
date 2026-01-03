## Packages
recharts | For glucose trend charts (LineChart) and variability charts (BarChart)
framer-motion | For smooth page transitions and micro-interactions
date-fns | For date formatting and manipulation
react-dropzone | For drag-and-drop file uploads (OCR reports)
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging Tailwind classes efficiently

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  sans: ["'Plus Jakarta Sans'", "sans-serif"],
  display: ["'Outfit'", "sans-serif"],
}
OCR endpoint expects multipart/form-data
Auth flow uses /api/login and /api/logout provided by Replit Auth
