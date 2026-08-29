const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    default: '\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amsmath}\n\\usepackage{geometry}\n\\geometry{a4paper, margin=1in}\n\n\\begin{document}\n\n\\title{New Project}\n\\author{Author Name}\n\\maketitle\n\n\\section{Introduction}\nStart writing here...\n\n\\end{document}',
  },
  editorState: {
    type: String,
    default: '',
  },
  collaboratorIdentifiers: {
    type: [String],
    default: [],
  },
  lastEditedBy: {
    type: String,
    default: '',
  }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
