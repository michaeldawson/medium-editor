var TestPage = require('./pages/test.page.js');

describe('Selecting bold on the highlight menu over ordinary text', function() {
  it('should bold the text, leaving the selection and menu in place and the button in an active state', function() {

  });
});

// bold spanning multiple blocks
// bold spanning multiple blocks including media, divider, quote or any other not permitted to bold
// bold on range entirely covering an existing bold
// bold on range entirely within an existing bold
// bold on range partially overlapping an existing bold
// bold on range including other markups like emphasis - test the order of applied markups
// highlight menu opening on existing bold
// highlight menu opening on existing bold then moving onto non bold
//  vice-versa - opening on existing normal then moving onto bold
// cmd+b
// active state when selecting a range which includes bold, non-bold, starting at different spots etc.

// bold and emphasis in same range
