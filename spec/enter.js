var TestPage = require('./pages/test.page.js');

describe('Hitting enter in the middle of a paragraph', function() {
  it('should split the paragraph in two and give focus to the second', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("This is a test paragraph");
    for(var i = 0; i < 5; i++) {
      doc.sendKeys(protractor.Key.ARROW_LEFT);
    }
    doc.sendKeys(protractor.Key.ENTER);
    var paragraphs = doc.all(by.css('p'));
    expect(paragraphs.count()).toEqual(2);
    expect(paragraphs.get(0).getText()).toEqual('This is a test para');
    expect(paragraphs.get(1).getText()).toEqual('graph');

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(1);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual('graph');
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Hitting enter at the end of a paragraph', function() {
  it('should create a new paragraph underneath and give it focus', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("This is a test paragraph");
    doc.sendKeys(protractor.Key.ENTER);
    var paragraphs = doc.all(by.css('p'));
    expect(paragraphs.count()).toEqual(2);
    expect(paragraphs.get(0).getText()).toEqual('This is a test paragraph');
    expect(paragraphs.get(1).getText()).toEqual('');

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(1);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual(null);
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Hitting enter at the start of a paragraph', function() {
  it('should create a new paragraph above and leave focus on the original', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    var testString = "This is a test paragraph";
    doc.sendKeys(testString);
    for(var i = 0; i < testString.length; i++) {
      doc.sendKeys(protractor.Key.ARROW_LEFT);
    }
    doc.sendKeys(protractor.Key.ENTER);
    var paragraphs = doc.all(by.css('p'));
    expect(paragraphs.count()).toEqual(2);
    expect(paragraphs.get(0).getText()).toEqual('');
    expect(paragraphs.get(1).getText()).toEqual(testString);

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(1);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual(testString);
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Highlighting over two blocks then hitting enter', function() {
  it('should remove the highlighted text from each block', function() {
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
      protractor.Key.ENTER
    );

    expect(doc.all(by.css('p')).count()).toEqual(2);
    expect(doc.all(by.css('p')).get(0).getText()).toEqual("The qui");
    expect(doc.all(by.css('p')).get(1).getText()).toEqual("ox");

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(1);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual("ox");
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Paragraph-highlighting then hitting enter', function() {
  it('should place another blank paragraph underneath', function() {
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
    doc.sendKeys(protractor.Key.ENTER);

    expect(doc.all(by.css('p')).count()).toEqual(3);
    expect(doc.all(by.css('p')).get(0).getText()).toEqual('');
    expect(doc.all(by.css('p')).get(1).getText()).toEqual('');
    expect(doc.all(by.css('p')).get(2).getText()).toEqual('Another test paragraph');

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(1);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual(null);
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Highlighting over multiple list items and hitting enter', function() {
  it('should split the list items', function() {
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
    doc.sendKeys(protractor.Key.ENTER);

    expect(doc.all(by.css('li')).count()).toEqual(2);
    expect(doc.all(by.css('li')).get(0).getText()).toEqual('The qu');
    expect(doc.all(by.css('li')).get(1).getText()).toEqual('d over');

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(1);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual('d over');
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Range selecting within a block then hitting enter', function() {
  it('should remove the highlighted text and split the block', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("Hello");
    doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL
    );
    doc.sendKeys(protractor.Key.ENTER);

    expect(doc.all(by.css('p')).count()).toEqual(2);
    expect(doc.all(by.css('p')).get(0).getText()).toEqual('He');
    expect(doc.all(by.css('p')).get(1).getText()).toEqual('o');

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(1);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual('o');
    expect(selectionDOM.startOffset).toEqual(0);
  });
});

describe('Setting selection on a single block starting at offset zero, then hitting enter', function() {
  it('should remove the highlighted text and insert the remaining text on a new block below', function() {
    var page = new TestPage();
    page.get();
    var doc = $('.medium-editor-document');
    doc.sendKeys("Hello");
    doc.sendKeys(
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.SHIFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.ARROW_LEFT,
      protractor.Key.NULL
    );
    doc.sendKeys(protractor.Key.ENTER);

    expect(doc.all(by.css('p')).count()).toEqual(2);
    expect(doc.all(by.css('p')).get(0).getText()).toEqual('');
    expect(doc.all(by.css('p')).get(1).getText()).toEqual('lo');

    var selectionModel = page.selectionModel();
    expect(selectionModel.startIx).toEqual(1);
    expect(selectionModel.startOffset).toEqual(0);

    var selectionDOM = page.selectionDOM();
    expect(selectionDOM.startNodeValue).toEqual('lo');
    expect(selectionDOM.startOffset).toEqual(0);
  });
});
