exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  baseUrl: 'http://localhost:9876',
  specs: ['backspace.js','bold.js','dividers.js','enter.js','highlight-menu.js','inline-tooltip.js','lists.js','selection.js','typeover.js']
};

// TODO - pasting
// TODO - cmd+a
// TODO - copying and pasting via keyboard
// TODO - normal typing updates model
// TODO - fast typing then enter
// TODO - smart quotes

// TODO - headers - hitting enter at start or end, new block is a paragraph

// TODO - highlighting a range, then dragging it somewhere else
