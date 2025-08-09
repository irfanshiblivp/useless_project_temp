// script.js - Enhanced Code Analyzer with WebP stickers and severity display

// Configuration constants
const CONFIG = {
  MIN_GUTTER_LINES: 10,
  ANALYSIS_ENDPOINT: '/analyze',
  HIGH_MEDIUM_WEBPS: [
    { src: 'sma1.webp', audio: 'sma1.mp3' },
    { src: 'sma2.webp', audio: 'https://embed.screenapp.io/app/#/shared/uL6qCXRmFJ?embed=true' } // Autoplay audio for sma2.webp
  ],
  LOW_WEBP: { src: 'sma2.webp', audio: 'https://embed.screenapp.io/app/#/shared/uL6qCXRmFJ?embed=true' },
  EXCELLENT_WEBPS: [
    { src: 'ex1.webp', audio: 'ex1.mp3' },
    { src: 'ex2.webp', audio: 'ex2.mp3' },
    { src: 'ex3.webp', audio: 'ex3.mp3' }
  ],
};

// Severity color mapping
const SEVERITY_COLORS = {
  'very high': '#ff4d4d', // red
  'high': '#ff9933',      // orange  
  'medium': '#ffcc00',    // yellow
  'low': '#99cc00',       // green
  'very low': '#66ccff',  // blue
  'unknown': '#aaa'       // grey
};

// Fun loading messages for better UX
const LOADING_MESSAGES = [
  "Analyzing your code... please wait!",
  "Scanning for potential improvements...",
  "Checking code quality patterns...",
  "Running smart analysis algorithms...", 
  "Evaluating best practices compliance...",
  "Identifying optimization opportunities...",
  "Processing with advanced AI insights...",
  "Reviewing code structure and style...",
  "Analyzing for maintainability factors...",
  "Your code is being carefully examined!"
];

// DOM element references
const elements = {
  editor: document.getElementById('editor'),
  gutter: document.getElementById('gutter'), 
  output: document.getElementById('output'),
  runBtn: document.getElementById('runBtn'),
  clearBtn: document.getElementById('clearBtn')
};

/**
 * Updates the line number gutter based on editor content
 */
function updateGutter() {
  const lineCount = elements.editor.value.split('\n').length;
  const displayLines = Math.max(lineCount, CONFIG.MIN_GUTTER_LINES);
  
  elements.gutter.innerHTML = '';
  
  for (let lineNumber = 1; lineNumber <= displayLines; lineNumber++) {
    const lineElement = document.createElement('div');
    lineElement.className = 'line';
    lineElement.textContent = lineNumber;
    elements.gutter.appendChild(lineElement);
  }
}

/**
 * Synchronizes gutter scroll with editor scroll
 */
function synchronizeScroll() {
  elements.gutter.scrollTop = elements.editor.scrollTop;
}

/**
 * Gets a random loading message for better user experience
 */
function getRandomLoadingMessage() {
  const randomIndex = Math.floor(Math.random() * LOADING_MESSAGES.length);
  return LOADING_MESSAGES[randomIndex];
}

/**
 * Shows loading state in output area
 */
function displayLoadingState(message) {
  elements.output.innerHTML = `
    <strong style="color:#fff">Analyzing Code...</strong>
    <p style="color:var(--muted); margin-top: 8px;">${message}</p>
    <p style="color:var(--muted)">Connecting to analysis backend...</p>
  `;
}

/**
 * Helper to pick random element from array
 */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Displays WebP and severity text in output area based on severity string
 * @param {string} severity - severity string (e.g. 'low', 'high', 'excellent')
 */
function displayWebPInOutput(severity) {
  const normalized = (severity || '').toLowerCase();

  let webpSrc = '';
  let audioSrc = '';
  let displaySeverityText = severity.charAt(0).toUpperCase() + severity.slice(1);
  let showFixNowButton = false; // Flag to control button visibility

  if (normalized === 'low') {
    webpSrc = CONFIG.LOW_WEBP.src;
    audioSrc = CONFIG.LOW_WEBP.audio;
    showFixNowButton = true; // Show button for 'low' severity
  } else if (normalized === 'excellent') {
    const selected = pickRandom(CONFIG.EXCELLENT_WEBPS);
    webpSrc = selected.src;
    audioSrc = selected.audio;
  } else { // Covers 'high', 'medium', 'very high', 'very low', 'unknown'
    const selected = pickRandom(CONFIG.HIGH_MEDIUM_WEBPS);
    webpSrc = selected.src;
    audioSrc = selected.audio;
    showFixNowButton = true; // Show button for other severities (errors)
  }

  if (!webpSrc) {
    elements.output.innerHTML = `
      <p style="color:var(--muted);">No visual available for this severity.</p>
    `;
    return;
  }

  elements.output.innerHTML = `
    <div style="text-align:center; margin-bottom: 12px; font-weight: 700; font-size: 20px; color: ${SEVERITY_COLORS[normalized] || '#fff'};">
      Severity: ${displaySeverityText}
    </div>
    <div style="display:flex; justify-content:center; align-items:center; height:320px;">
      <img 
        src="${webpSrc}" 
        alt="Severity Visual" 
        style="max-height: 300px; max-width: 100%; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);"
      >
    </div>
    <audio autoplay>
      <source src="${audioSrc}" type="audio/mpeg">
      Your browser does not support the audio element.
    </audio>
    ${showFixNowButton ? `
      <div style="text-align:center; margin-top: 20px;">
        <button id="fixNowBtn" class="btn primary">Fix Now</button>
      </div>
    ` : ''}
  `;

  // Add event listener for the "Fix Now" button if it exists
  if (showFixNowButton) {
    document.getElementById('fixNowBtn').addEventListener('click', () => {
      window.open('game.html', '_blank'); // Open game.html in a new tab
    });
  }
}

/**
 * Displays error message in output area (still used only for backend errors or connection)
 */
function displayError(title, message) {
  elements.output.innerHTML = `
    <strong style="color:#ffb3b3">${escapeHtml(title)}</strong>
    <pre style="white-space:pre-wrap;color:var(--muted); margin-top: 8px;">${escapeHtml(message)}</pre>
  `;
}

/**
 * Main function to analyze code
 */
async function analyzeCode() {
  const code = elements.editor.value.trim();
  
  if (!code) {
    elements.output.innerHTML = `
      <strong style="color:#fff">Analysis Result</strong>
      <p style="color:#ffcc00; margin-top: 8px;">Please enter some code to analyze.</p>
    `;
    return;
  }

  const loadingMessage = getRandomLoadingMessage();
  displayLoadingState(loadingMessage);

  try {
    const response = await fetch(CONFIG.ANALYSIS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      const errorText = await response.text();
      displayError(
        'Backend Error', 
        `${response.status} ${response.statusText}\n${errorText}`
      );
      return;
    }

    const analysisData = await response.json();

    // Determine severity for display
    // We'll pick the highest severity found in issues or if no issues -> excellent

    let severityToShow = 'excellent';

    if (analysisData.issues && analysisData.issues.length > 0) {
      // Determine highest severity present
      const severityPriority = {
        'very high': 5,
        'high': 4,
        'medium': 3,
        'low': 2,
        'very low': 1,
        'unknown': 0
      };
      let maxSeverityLevel = -1;
      let maxSeverityName = 'unknown';

      analysisData.issues.forEach(issue => {
        const sev = (issue.severity || '').toLowerCase();
        const level = severityPriority[sev] ?? 0;
        if (level > maxSeverityLevel) {
          maxSeverityLevel = level;
          maxSeverityName = sev;
        }
      });

      severityToShow = maxSeverityName;
      if (severityToShow === 'unknown') severityToShow = 'high'; // fallback
    }

    displayWebPInOutput(severityToShow);

  } catch (error) {
    displayError('Connection Error', error.message);
  }
}

/**
 * Clears the output area
 */
function clearOutput() {
  elements.output.innerHTML = `
    <strong style="color:#fff;">Analysis Results</strong>
    <p style="margin-top:8px;color:var(--muted)">
      Output cleared. Write some code and click "Analyze" to get feedback.
    </p>
  `;
}

/**
 * Escapes HTML characters to prevent XSS attacks
 */
function escapeHtml(text) {
  if (!text) return '';
  
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return text.replace(/[&<>"']/g, match => htmlEntities[match]);
}

// Event listeners setup
function initializeEventListeners() {
  elements.editor.addEventListener('input', updateGutter);
  elements.editor.addEventListener('scroll', synchronizeScroll);
  elements.runBtn.addEventListener('click', analyzeCode);
  elements.clearBtn.addEventListener('click', clearOutput);
}

// Initialize the application
function initialize() {
  updateGutter();
  initializeEventListeners();
  
  // Add keyboard shortcut for quick analysis
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      analyzeCode();
    }
  });
}

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
