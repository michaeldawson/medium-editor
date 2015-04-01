// Given two strings, returns data on how they
// differ. Result is an object in the form:
//
//  { type: 'replace', start: 3, removed: 2, added: 1 }
//
// Type can be:
//
//  add:      `added` chars were added, beginning
//            at `start`
//
//  remove:   `removed` chars were removed,
//            beginning at `start`
//
//  replace:  `removed` chars were removed,
//            beginning at `start`, then `added`
//            chars were added at that index
//
//  none:     the strings are the same
//
//  This info is used to offset the markups when
//  text changes in a block.

MediumEditor.Util = {};
MediumEditor.Util.diff = function(oldText, newText) {

  // Find the index at which the change began
  var s = 0;
  while(s < oldText.length && s < newText.length && oldText[s] == newText[s]) {
    s++;
  }

  // Find the index at which the change ended
  var e = 0;
  while(e < oldText.length &&
        e < newText.length &&
        oldText.length - e > s &&
        newText.length - e > s &&
        oldText[oldText.length - 1 - e] == newText[newText.length - 1 - e]) {
    e++;
  }

  var ne = newText.length - e;
  var oe = oldText.length - e;

  var removed = oe - s;
  var added = ne - s;

  var type;
  switch(true) {
    case removed == 0 && added > 0:
      type = 'add';
      break;
    case removed > 0 && added == 0:
      type = 'remove';
      break;
    case removed > 0 && added > 0:
      type = 'replace';
      break;
    default:
      type = 'none';
      s = 0;
  }

  return { type: type, start: s, removed: removed, added: added };
}
