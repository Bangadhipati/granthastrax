export function convertLatexToHtml(latex: string): string {
  if (!latex) return "";

  let html = latex;

  // 1. Extract the content inside \begin{document} ... \end{document}
  const docMatch = html.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  if (docMatch) {
    html = docMatch[1]!;
  }

  // 2. Remove comments
  html = html.replace(/%.*$/gm, "");

  // 3. Formatting
  html = html.replace(/\\textbf\{([^}]+)\}/g, "<strong>$1</strong>");
  html = html.replace(/\\textit\{([^}]+)\}/g, "<em>$1</em>");
  html = html.replace(/\\underline\{([^}]+)\}/g, "<u>$1</u>");

  // 4. Headings
  html = html.replace(/\\section\{([^}]+)\}/g, "<h1>$1</h1>");
  html = html.replace(/\\subsection\{([^}]+)\}/g, "<h2>$1</h2>");
  html = html.replace(/\\subsubsection\{([^}]+)\}/g, "<h3>$1</h3>");
  html = html.replace(/\\paragraph\{([^}]+)\}/g, "<h4>$1</h4>");
  html = html.replace(/\\subparagraph\{([^}]+)\}/g, "<h5>$1</h5>");

  // 5. Lists
  html = html.replace(/\\begin\{itemize\}/g, "<ul>");
  html = html.replace(/\\end\{itemize\}/g, "</ul>");
  html = html.replace(/\\begin\{enumerate\}/g, "<ol>");
  html = html.replace(/\\end\{enumerate\}/g, "</ol>");
  html = html.replace(/\\item\s+(.*?)(?=\\item|\\end|\n\n|$)/g, "<li>$1</li>\n");

  // 6. Centering
  html = html.replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/g, '<div style="text-align: center">$1</div>');
  html = html.replace(/\\begin\{flushright\}([\s\S]*?)\\end\{flushright\}/g, '<div style="text-align: right">$1</div>');

  // 7. Equations (naive wrapper)
  html = html.replace(/\\begin\{equation\}([\s\S]*?)\\end\{equation\}/g, '<p style="text-align: center; font-family: monospace;">$1</p>');

  // 8. Title and Author
  html = html.replace(/\\title\{([^}]+)\}/g, "<h1>$1</h1>");
  html = html.replace(/\\author\{([^}]+)\}/g, "<p>$1</p>");
  html = html.replace(/\\maketitle/g, "");

  // 9. Abstract
  html = html.replace(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/g, "<p><strong>Abstract — </strong>$1</p>");

  // 10. Paragraphs
  // Split by double newlines, wrap in <p> if it doesn't already contain a block element
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return "";
      // If it already starts with a block tag like <h, <ul, <ol, <div
      if (trimmed.match(/^(<h|<ul|<ol|<div|<p|<li)/)) {
        return trimmed;
      }
      return `<p>${trimmed}</p>`;
    })
    .join("\n");

  // Cleanup stray linebreaks
  html = html.replace(/\n/g, " ");

  return html;
}
