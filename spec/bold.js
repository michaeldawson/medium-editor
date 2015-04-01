var TestPage = require('./pages/test.page.js');

describe('Selecting bold on the highlight menu over ordinary text', function() {
  it('should bold the text, leaving the selection and menu in place and the button in an active state', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("test sentence");

    doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL
    );

    browser.sleep(150);   // Animation fade in
    element.all(by.css('.medium-editor-highlight-menu button')).get(0).click();   // Click 'bold'

    expect(doc.all(by.css('p')).count()).toEqual(1);
    expect(doc.all(by.css('p')).get(0).getAttribute('innerHTML')).toEqual('te<strong>st sent</strong>ence');

    expect(element.all(by.css('.medium-editor-highlight-menu button')).get(0).getAttribute('class')).toEqual('medium-editor-highlight-menu-button-active');

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(2);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual('te');
    expect(selectionDOM.startOffset).toEqual(2);
  });
});

describe('Pressing cmd + b while highlighting normal text', function() {
  it('should bold the text and change button to active state', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("test sentence");

    doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL
    );

    doc.sendKeys(
      protractor.Key.COMMAND,
      'b'
    );

    expect(doc.all(by.css('p')).get(0).getAttribute('innerHTML')).toEqual('te<strong>st sent</strong>ence');
    expect(element.all(by.css('.medium-editor-highlight-menu button')).get(0).getAttribute('class')).toEqual('medium-editor-highlight-menu-button-active');
  });
});

describe('Pressing cmd + b while highlighting bold text', function() {
  it('should unbold the text and change button to inactive state', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("test sentence");

    doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL
    );

    doc.sendKeys(
      protractor.Key.COMMAND,
      'b'
    );

    doc.sendKeys(
      protractor.Key.COMMAND,
      'b'
    );

    expect(doc.all(by.css('p')).get(0).getAttribute('innerHTML')).toEqual('test sentence');
    expect(element.all(by.css('.medium-editor-highlight-menu button')).get(0).getAttribute('class')).toEqual(null);
  });
});

describe('Cmd + b when selection spanning multiple blocks', function() {
  it('should apply bold to all the selected text', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("The quick");
    doc.sendKeys(protractor.Key.ENTER);
    doc.sendKeys("brown fox");
    doc.sendKeys(protractor.Key.ENTER);
    doc.sendKeys("jumped over");
    doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_UP,
      protractor.Key.ARROW_UP,
      protractor.Key.NULL
    );

    doc.sendKeys(
      protractor.Key.COMMAND,
      'b'
    );

    expect(doc.all(by.css('p')).count()).toEqual(3);
    expect(doc.all(by.css('p')).get(0).getAttribute('innerHTML')).toEqual('The qu<strong>ick</strong>');
    expect(doc.all(by.css('p')).get(1).getAttribute('innerHTML')).toEqual('<strong>brown fox</strong>');
    expect(doc.all(by.css('p')).get(2).getAttribute('innerHTML')).toEqual('<strong>jumpe</strong>d over');

    expect(element.all(by.css('.medium-editor-highlight-menu button')).get(0).getAttribute('class')).toEqual('medium-editor-highlight-menu-button-active');

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(6);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual('The qu');
    expect(selectionDOM.startOffset).toEqual(6);
  });
});

// TODO
// bold spanning multiple blocks including media, divider, quote or any other not permitted to bold
// bold on range entirely covering an existing bold
// bold on range entirely within an existing bold
// bold on range partially overlapping an existing bold
// bold on range including other markups like emphasis - test the order of applied markups
// highlight menu opening on existing bold
// highlight menu opening on existing bold then moving onto non bold
//  vice-versa - opening on existing normal then moving onto bold
// active state when selecting a range which includes bold, non-bold, starting at different spots etc.
// bold and emphasis in same range
