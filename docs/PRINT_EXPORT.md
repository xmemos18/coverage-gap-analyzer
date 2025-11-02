# Print & Export Documentation

This document explains the print and export functionality available for saving and sharing insurance analysis results.

## Overview

Users can save their insurance recommendations in multiple formats:
- **Print to PDF** - Professional formatted results via browser print
- **Export JSON** - Raw data for spreadsheets or advisors
- **Email** - Share results directly via email client
- **Copy Link** - Share URL with query parameters

## Features

### 1. Print to PDF

**What:** Optimized print view with clean formatting for physical or PDF printing.

**How it works:**
- Click "Print Results" button
- Browser print dialog opens
- Choose "Save as PDF" or send to printer
- Print-optimized layout automatically applied

**Print Optimizations:**
```css
- White background with black text
- Simplified shadows and effects
- Proper page breaks
- Smaller padding for space efficiency
- No navigation or interactive elements
- Print-only header with timestamp and URL
```

**Usage:**
```tsx
import PrintButton from '@/components/PrintButton';

<PrintButton label="Print Results" className="..." />
```

**Component:** `components/PrintButton.tsx`

### 2. Export as JSON

**What:** Downloads complete analysis as formatted JSON file.

**Includes:**
- All recommendation data
- User form inputs
- Cost calculations
- Alternative options
- Generation timestamp

**Filename Format:** `insurance-analysis-YYYY-MM-DD.json`

**Usage:**
```tsx
import ExportButton from '@/components/ExportButton';

<ExportButton
  data={analysisData}
  filename="insurance-analysis"
  label="Export as JSON"
/>
```

**Example JSON Structure:**
```json
{
  "recommendation": {
    "recommendedInsurance": "Medicare + Medigap Plan N",
    "coverageGapScore": 90,
    "estimatedMonthlyCost": {
      "low": 550,
      "high": 900
    },
    "reasoning": [...],
    "actionItems": [...],
    "alternativeOptions": [...]
  },
  "formData": {
    "residences": [...],
    "numAdults": 2,
    "adultAges": [67, 65],
    ...
  },
  "generatedDate": "2025-01-01T12:00:00.000Z"
}
```

**Component:** `components/ExportButton.tsx`

### 3. Email Share

**What:** Opens email client with pre-filled subject and body.

**Email Template:**
```
Subject: My Health Insurance Analysis Results

Body:
I used the Coverage Gap Analyzer and here are my results:

[Summary text]

View full results: [URL]
```

**Usage:** Click "Email" button, default email client opens automatically.

### 4. Copy Link

**What:** Copies current results URL to clipboard.

**Why useful:** URL contains all form parameters, so results are reproducible.

**Feedback:** "Copied!" confirmation for 2 seconds

**URL Structure:**
```
/results?residenceZips=10001,33101&residenceStates=NY,FL&numAdults=2&adultAges=45,43&...
```

## Share Buttons Component

**Component:** `components/ShareButtons.tsx`

Combines all sharing methods in a single card with clear instructions.

**Props:**
```typescript
interface ShareButtonsProps {
  data: unknown;          // Data to export as JSON
  summary: string;        // Text summary for email
  filename?: string;      // Base filename for export (default: 'insurance-results')
}
```

**Usage:**
```tsx
<ShareButtons
  data={{
    recommendation,
    formData,
    generatedDate: new Date().toISOString()
  }}
  summary="Medicare + Medigap Plan N - $550-900/month"
  filename="my-insurance-analysis"
/>
```

## Print Styles

Located in `app/globals.css`:

### Print-Specific Classes

**`.no-print`** - Hides element in print mode
```tsx
<div className="no-print">
  {/* Buttons, navigation, etc. */}
</div>
```

**`.print-no-break`** - Prevents page breaks inside element
```tsx
<div className="print-no-break">
  {/* Keep this together on one page */}
</div>
```

**`print:block`**, **`print:hidden`** - Tailwind print utilities
```tsx
<div className="hidden print:block">
  {/* Only visible when printing */}
</div>
```

### Print CSS Rules

**Remove backgrounds:**
```css
@media print {
  body {
    background: white !important;
    color: black !important;
  }
}
```

**Remove shadows:**
```css
@media print {
  * {
    box-shadow: none !important;
    text-shadow: none !important;
  }
}
```

**Better page breaks:**
```css
@media print {
  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
    page-break-inside: avoid;
  }

  .print-no-break {
    page-break-inside: avoid;
  }
}
```

**Fix text colors:**
```css
@media print {
  .text-white, .bg-accent, .bg-primary {
    color: black !important;
  }
}
```

## Print-Only Header

Automatically adds metadata to printed documents:

```tsx
<div className="hidden print:block">
  <h1>Coverage Gap Analyzer Results</h1>
  <p>Generated on {date} at {time}</p>
  <p>{url}</p>
</div>
```

**Includes:**
- Document title
- Generation date and time
- Full URL for reference

## Browser Compatibility

### Print Functionality

**Supported:**
- ✅ Chrome/Edge (Print to PDF built-in)
- ✅ Firefox (Print to PDF built-in)
- ✅ Safari (Print to PDF built-in)
- ✅ All mobile browsers

**Print Dialog:**
- All modern browsers support print dialog
- PDF generation built into browsers (no plugins needed)

### Export/Download

**Supported:**
- ✅ All modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Blob API for downloads
- ✅ URL.createObjectURL

**Mobile:**
- ✅ iOS Safari (downloads to Files app)
- ✅ Android Chrome (downloads to Downloads folder)

### Clipboard API

**Supported:**
- ✅ Chrome 66+
- ✅ Firefox 63+
- ✅ Safari 13.1+
- ✅ Edge 79+

**Fallback:** Manual copy instructions if clipboard fails

### Email Integration

**Works on:**
- ✅ All platforms (uses `mailto:` protocol)
- ✅ Opens default email client
- ⚠️  Mobile: May prompt to choose email app

## Testing Print Layout

### Browser DevTools

**Chrome:**
1. Press `Ctrl+P` (Cmd+P on Mac)
2. Preview shows print layout
3. Check "More settings" → Background graphics

**Firefox:**
1. Press `Ctrl+P` (Cmd+P on Mac)
2. Preview shows print layout
3. Options to include/exclude background

### Print Preview Checklist

- [ ] No navigation or buttons visible
- [ ] All text is black on white
- [ ] No shadows or gradient backgrounds
- [ ] Page breaks are logical
- [ ] Headers don't break mid-section
- [ ] Print header shows at top
- [ ] Content fits within margins

## Usage Examples

### Basic Print Button

```tsx
<PrintButton />
// Uses default label "Print Results"
```

### Custom Print Button

```tsx
<PrintButton
  label="Save as PDF"
  className="w-full"
/>
```

### Basic Export

```tsx
<ExportButton data={myData} />
// Filename: insurance-results-2025-01-01.json
```

### Custom Export

```tsx
<ExportButton
  data={complexData}
  filename="johns-insurance-analysis"
  label="Download Data"
/>
// Filename: johns-insurance-analysis-2025-01-01.json
```

### Complete Share Section

```tsx
<ShareButtons
  data={{
    recommendation: analysisResults,
    inputs: userInputs,
    metadata: {
      version: '1.0',
      generated: new Date().toISOString()
    }
  }}
  summary="Your personalized insurance recommendation"
  filename="insurance-recommendation"
/>
```

## Security Considerations

### Data Privacy

**Email Sharing:**
- Uses `mailto:` protocol (data not sent to our servers)
- All data processed client-side only
- No tracking of shared emails

**JSON Export:**
- Downloads directly to user's device
- No data uploaded anywhere
- User has full control of file

**URL Sharing:**
- All data in URL query parameters
- Visible in browser history and logs
- Consider privacy when sharing links

### Recommendations

1. **Don't email sensitive data** - Use secure alternatives for PII
2. **Clear URL from history** if it contains sensitive info
3. **Store exported files securely** on encrypted devices
4. **Use print-to-PDF** instead of physical printing for privacy

## Accessibility

### Print Button

- ✅ Keyboard accessible (Tab + Enter)
- ✅ ARIA label describes action
- ✅ Disabled state with visual feedback
- ✅ Loading state ("Preparing...")

### Export Button

- ✅ Keyboard accessible
- ✅ ARIA label describes action
- ✅ Error handling with user feedback
- ✅ Success confirmation

### Share Buttons

- ✅ All buttons keyboard accessible
- ✅ Clear labels for screen readers
- ✅ Visual feedback on interaction
- ✅ Copy confirmation for screen readers

## Performance

### Bundle Size

**PrintButton:** ~1KB (minimal)
**ExportButton:** ~2KB (includes JSON.stringify)
**ShareButtons:** ~4KB (combines all features)

**Total Impact:** ~5KB gzipped

### Print Performance

- No additional HTTP requests
- CSS already loaded
- Instant print dialog
- No performance impact

### Export Performance

**Small datasets (<1MB):** Instant
**Medium datasets (1-5MB):** <1 second
**Large datasets (>5MB):** May take 2-3 seconds

**Optimization:** Data is stringified once, then downloaded

## Troubleshooting

### Print Issues

**Problem:** Colors don't show
**Solution:** Enable "Background graphics" in print settings

**Problem:** Content cut off
**Solution:** Adjust margins in print dialog or use landscape

**Problem:** Page breaks in wrong places
**Solution:** Use `.print-no-break` class on containers

### Export Issues

**Problem:** Download doesn't start
**Solution:** Check browser permissions for downloads

**Problem:** File is empty
**Solution:** Ensure data is not undefined or null

**Problem:** JSON parse error when opening
**Solution:** File is valid JSON, use JSON viewer or text editor

### Copy Link Issues

**Problem:** "Failed to copy" error
**Solution:** Clipboard API not supported, copy URL manually

**Problem:** Copied link doesn't work
**Solution:** Ensure full URL is copied including protocol

## Future Enhancements

Potential improvements:

- [ ] Export to CSV format
- [ ] Export to Excel (XLSX)
- [ ] Generate PDF directly (not via print)
- [ ] Social media sharing (Twitter, Facebook)
- [ ] QR code generation for mobile sharing
- [ ] Password-protected exports
- [ ] Cloud save integration
- [ ] Print preview modal before printing

---

**Last Updated:** 2025-01-01
**Version:** 1.0
