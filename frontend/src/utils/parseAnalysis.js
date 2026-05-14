/**
 * Parses the raw LLM analysis text into structured sections.
 * Each section gets a key, title, variant (for CSS), and parsed content.
 */

const SECTION_CONFIG = [
  { key: "brutal", title: "Brutal Summary", variant: "brutal" },
  { key: "outcome", title: "Direct Outcome", variant: "outcome" },
  { key: "effects", title: "Second-Order Effects", variant: "effects" },
  { key: "failure", title: "Failure Points", variant: "failure" },
  { key: "assumptions", title: "Hidden Assumptions", variant: "assumptions" },
  {
    key: "underestimate",
    title: "What You're Underestimating",
    variant: "underestimate",
  },
  { key: "longterm", title: "Long-Term Consequences", variant: "longterm" },
  { key: "pattern", title: "Pattern Recognition", variant: "pattern" },
  { key: "timeline", title: "Failure Timeline", variant: "timeline" },
  { key: "critique", title: "Self-Critique", variant: "critique" },
];

/**
 * Extracts the text between two section headers from the raw analysis.
 */
function extractSection(text, sectionTitle, allTitles) {
  // Build a regex to find this section header
  const escapedTitle = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const headerPattern = new RegExp(
    `(?:^|\\n)\\s*(?:\\*\\*)?${escapedTitle}(?:\\*\\*)?\\s*:?\\s*\\n`,
    "i"
  );

  const match = text.match(headerPattern);
  if (!match) return null;

  const startIndex = match.index + match[0].length;

  // Find the next section header
  let endIndex = text.length;
  for (const title of allTitles) {
    if (title === sectionTitle) continue;
    const escapedNext = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const nextPattern = new RegExp(
      `\\n\\s*(?:\\*\\*)?${escapedNext}(?:\\*\\*)?\\s*:?\\s*\\n`,
      "i"
    );
    const nextMatch = text.substring(startIndex).match(nextPattern);
    if (nextMatch) {
      const possibleEnd = startIndex + nextMatch.index;
      if (possibleEnd < endIndex) {
        endIndex = possibleEnd;
      }
    }
  }

  return text.substring(startIndex, endIndex).trim();
}

/**
 * Parses a section's raw text into paragraphs and bullet lists.
 * Returns an array of content blocks: { type: 'paragraph' | 'list', content }
 */
function parseContent(rawText) {
  if (!rawText) return [];

  const lines = rawText.split("\n");
  const blocks = [];
  let currentList = [];
  let currentParagraph = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({
        type: "paragraph",
        content: currentParagraph.join(" ").trim(),
      });
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push({ type: "list", items: [...currentList] });
      currentList = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // Check if line is a bullet point
    const bulletMatch = trimmed.match(/^[-•*]\s+(.+)/);
    if (bulletMatch) {
      flushParagraph();
      currentList.push(bulletMatch[1]);
    } else {
      flushList();
      currentParagraph.push(trimmed);
    }
  }

  flushParagraph();
  flushList();

  return blocks;
}

/**
 * Main parser. Takes raw LLM output, returns structured sections.
 */
export function parseAnalysis(rawText) {
  if (!rawText) return [];

  const allTitles = SECTION_CONFIG.map((s) => s.title);
  const sections = [];

  for (let i = 0; i < SECTION_CONFIG.length; i++) {
    const config = SECTION_CONFIG[i];
    const rawContent = extractSection(rawText, config.title, allTitles);

    if (rawContent) {
      sections.push({
        key: config.key,
        title: config.title,
        variant: config.variant,
        number: String(i + 1).padStart(2, "0"),
        content: parseContent(rawContent),
      });
    }
  }

  return sections;
}
