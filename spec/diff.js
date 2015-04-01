// Tests the MediumEditor.Util.diff function.

MediumEditor = {}
require('../src/utils/diff.js');

describe('The `diff` function', function() {
  it('should give expected output', function() {

    var tests = [

      { oldText: 'hello', newText: 'xhello', type: 'add', start: 0, removed: 0, added: 1 },       // Single char added to start
      { oldText: 'hello', newText: 'helxlo', type: 'add', start: 3, removed: 0, added: 1 },       // Single char added to middle
      { oldText: 'hello', newText: 'hellox', type: 'add', start: 5, removed: 0, added: 1 },       // Single char added to end

      { oldText: 'hello', newText: 'foohello', type: 'add', start: 0, removed: 0, added: 3 },     // Multi char added to start
      { oldText: 'hello', newText: 'helfoolo', type: 'add', start: 3, removed: 0, added: 3 },     // Multi char added to middle
      { oldText: 'hello', newText: 'hellofoo', type: 'add', start: 5, removed: 0, added: 3 },     // Multi char added to end

      { oldText: 'hello', newText: 'ello', type: 'remove', start: 0, removed: 1, added: 0 },      // Single char removed from start
      { oldText: 'hello', newText: 'helo', type: 'remove', start: 3, removed: 1, added: 0 },      // Single char removed from middle
      { oldText: 'hello', newText: 'hell', type: 'remove', start: 4, removed: 1, added: 0 },      // Single char removed from end

      { oldText: 'hello', newText: 'llo', type: 'remove', start: 0, removed: 2, added: 0 },       // Multi char removed from start
      { oldText: 'hello', newText: 'heo', type: 'remove', start: 2, removed: 2, added: 0 },       // Multi char removed from middle
      { oldText: 'hello', newText: 'hel', type: 'remove', start: 3, removed: 2, added: 0 },       // Multi char removed from end

      { oldText: 'hello', newText: 'xello', type: 'replace', start: 0, removed: 1, added: 1 },    // Single char replaced at start with string of same length
      { oldText: 'hello', newText: 'helxo', type: 'replace', start: 3, removed: 1, added: 1 },    // Single char replaced in middle with string of same length
      { oldText: 'hello', newText: 'hellx', type: 'replace', start: 4, removed: 1, added: 1 },    // Single char replaced at end with string of same length

      { oldText: 'hello', newText: 'xyello', type: 'replace', start: 0, removed: 1, added: 2 },   // Single char replaced at start with longer string
      { oldText: 'hello', newText: 'helxyo', type: 'replace', start: 3, removed: 1, added: 2 },   // Single char replaced in middle with longer string
      { oldText: 'hello', newText: 'hellxy', type: 'replace', start: 4, removed: 1, added: 2 },   // Single char replaced at end with longer string

      { oldText: 'hello', newText: 'xyllo', type: 'replace', start: 0, removed: 2, added: 2 },    // Multi char replaced at start with string of same length
      { oldText: 'hello', newText: 'hexyo', type: 'replace', start: 2, removed: 2, added: 2 },    // Multi char replaced in middle with string of same length
      { oldText: 'hello', newText: 'helxy', type: 'replace', start: 3, removed: 2, added: 2 },    // Multi char replaced at end with string of same length

      { oldText: 'hello', newText: 'xyzllo', type: 'replace', start: 0, removed: 2, added: 3 },   // Multi char replaced at start with longer string
      { oldText: 'hello', newText: 'hexyzo', type: 'replace', start: 2, removed: 2, added: 3 },   // Multi char replaced in middle with longer string
      { oldText: 'hello', newText: 'helxyz', type: 'replace', start: 3, removed: 2, added: 3 },   // Multi char replaced at end with longer string

      { oldText: 'hello', newText: 'xllo', type: 'replace', start: 0, removed: 2, added: 1 },     // Multi char replaced at start with shorter string
      { oldText: 'hello', newText: 'hexo', type: 'replace', start: 2, removed: 2, added: 1 },     // Multi char replaced in middle with shorter string
      { oldText: 'hello', newText: 'helx', type: 'replace', start: 3, removed: 2, added: 1 },     // Multi char replaced at end with shorter string

      { oldText: 'hello', newText: 'hello', type: 'none', start: 0, removed: 0, added: 0 },       // No change
      { oldText: 'hello', newText: 'foobar', type: 'replace', start: 0, removed: 5, added: 6 }    // Completely changed
    ];

    for(var i = 0; i < tests.length; i++) {
      var test = tests[i];
      var result = MediumEditor.Util.diff(test.oldText, test.newText);
      expect(result.type).toEqual(test.type);
      expect(result.start).toEqual(test.start);
      expect(result.removed).toEqual(test.removed);
      expect(result.added).toEqual(test.added);
    }

  });
});
