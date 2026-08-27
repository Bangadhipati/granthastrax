export function convertHtmlToLatex(html: string): string {
  // A very basic and naive HTML to LaTeX converter for demonstration purposes.
  // In a real application, you would use a robust HTML parser (like DOMParser or unified/rehype).
  
  if (!html) return "\\begin{document}\n\\end{document}";

  let latex = html;

  // Formatting
  latex = latex.replace(/<strong>(.*?)<\/strong>/g, "\\textbf{$1}");
  latex = latex.replace(/<em>(.*?)<\/em>/g, "\\textit{$1}");
  latex = latex.replace(/<u>(.*?)<\/u>/g, "\\underline{$1}");

  // Headings (Simplified mapping)
  latex = latex.replace(/<h1>(.*?)<\/h1>/g, "\n\\section{$1}\n");
  latex = latex.replace(/<h2>(.*?)<\/h2>/g, "\n\\subsection{$1}\n");
  latex = latex.replace(/<h3>(.*?)<\/h3>/g, "\n\\subsubsection{$1}\n");
  latex = latex.replace(/<h4>(.*?)<\/h4>/g, "\n\\paragraph{$1}\n");
  latex = latex.replace(/<h5>(.*?)<\/h5>/g, "\n\\subparagraph{$1}\n");
  latex = latex.replace(/<h6>(.*?)<\/h6>/g, "\n\\textbf{$1}\n");

  // Lists
  latex = latex.replace(/<ul>/g, "\n\\begin{itemize}\n");
  latex = latex.replace(/<\/ul>/g, "\\end{itemize}\n");
  latex = latex.replace(/<ol>/g, "\n\\begin{enumerate}\n");
  latex = latex.replace(/<\/ol>/g, "\\end{enumerate}\n");
  latex = latex.replace(/<li>(.*?)<\/li>/g, "  \\item $1\n");

  // Paragraphs
  latex = latex.replace(/<p>(.*?)<\/p>/g, "$1\n\n");
  latex = latex.replace(/<p style="text-align: center">(.*?)<\/p>/g, "\\begin{center}\n$1\n\\end{center}\n\n");
  latex = latex.replace(/<p style="text-align: right">(.*?)<\/p>/g, "\\begin{flushright}\n$1\n\\end{flushright}\n\n");

  // Images
  latex = latex.replace(/<img src="(.*?)"[^>]*>/g, "\n\\begin{figure}[h]\n  \\centering\n  \\includegraphics{$1}\n\\end{figure}\n");

  // Cleanup stray tags and entities
  latex = latex.replace(/<[^>]+>/g, ""); // Strip any remaining HTML
  latex = latex.replace(/&nbsp;/g, "~");
  latex = latex.replace(/&amp;/g, "\\&");
  latex = latex.replace(/&lt;/g, "<");
  latex = latex.replace(/&gt;/g, ">");
  
  // Basic Document Structure
  return `\\documentclass{article}\n\\usepackage{graphicx}\n\\usepackage{amsmath}\n\n\\begin{document}\n\n${latex.trim()}\n\n\\end{document}`;
}
