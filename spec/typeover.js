var TestPage = require('./pages/test.page.js');

describe('Highlighting a range then hitting another key', function() {
  it('should replace the range with the new char (typeover)', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys(
      "This is a test paragraph",
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL,
      "c"
    );

    expect(doc.all(by.css('p')).get(0).getText()).toEqual("This is a test paracph");

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(20);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual("This is a test paracph");
    expect(selectionDOM.startOffset).toEqual(20);
  });
});

describe('Highlighting over two blocks then hitting another key', function() {
  it('should replace the text with the new key and merge the blocks', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("The quick");
    doc.sendKeys(protractor.Key.ENTER);
    doc.sendKeys("brown fox");
    doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_UP,
      protractor.Key.NULL,
      'z'
    );

    expect(doc.all(by.css('p')).count()).toEqual(1);
    expect(doc.all(by.css('p')).get(0).getText()).toEqual("The quizox");

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(8);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual("The quizox");
    expect(selectionDOM.startOffset).toEqual(8);
  });
});

describe('Paragraph-highlighting then hitting a character', function() {
  it('should replace the contents of the paragraph', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("Test paragraph");
    doc.sendKeys(protractor.Key.ENTER);
    doc.sendKeys("Another test paragraph");
    doc.sendKeys(protractor.Key.ARROW_UP);
    for(var i = 0; i < 14; i++) {
      doc.sendKeys(protractor.Key.ARROW_LEFT);
    }
    doc.sendKeys(
      protractor.Key.SHIFT,
      protractor.Key.ARROW_DOWN,
      protractor.Key.NULL
    );
    doc.sendKeys('c');

    expect(doc.all(by.css('p')).count()).toEqual(2);
    expect(doc.all(by.css('p')).get(0).getText()).toEqual('c');
    expect(doc.all(by.css('p')).get(1).getText()).toEqual('Another test paragraph');

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(1);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual('c');
    expect(selectionDOM.startOffset).toEqual(1);
  });
});

describe('Highlighting over multiple list items and hitting a key', function() {
  it('should merge the first and last list item in the selection and insert the character', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("1. The quick");
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
    doc.sendKeys('x');

    expect(doc.all(by.css('li')).count()).toEqual(1);
    expect(doc.all(by.css('li')).get(0).getText()).toEqual('The quxd over');

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(0);
    expect(selectionModel.startOffset).toEqual(7);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual('The quxd over');
    expect(selectionDOM.startOffset).toEqual(7);
  });
});
