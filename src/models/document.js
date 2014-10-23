// ---------------------------------------------
//  Document
// ---------------------------------------------
//  A document is made up of blocks (which may
//  be paragraphs, lists, images etc.)
// ---------------------------------------------

MediumEditor.DocumentModel = MediumEditor.Model.extend({
  init: function(attrs) {
    this._super(attrs);
    this.children = new MediumEditor.BlockCollection({ model: this });
    this.parse(attrs['html'] || '');

    // TODO - temporary
    var p = new MediumEditor.BlockModel({ text: "Medium Editor Demo", type: 'heading1' });
    this.children.add(p);
    p = new MediumEditor.BlockModel({ text: "One of the most significant scenes in journalist Erik Parker and director One9’s new documentary captures Nas’ younger brother Jungle, as he is shown a picture from the disc sleeve of Illmatic, his older sibling’s supremely perfect, undeniably classic 1994 hip-hop album. The photo features Nas surrounded by friends, posed in the Queensbridge Projects. Jungle proceeds to run down where everyone is today, reeling off what seems an impossible list of misfortunes." });
    this.children.add(p);
    p = new MediumEditor.BlockModel({ text: "“Some of them people gonna catch murders, some of them people gonna get beat up, some of them people gonna go to jail, but all them people gonna have a story,” Jungle says as he points out each person in the photo, some of them children when it was taken. “He’s doing 15 years. He’s fighting a murder. He’s doing life in prison. He just got locked up, no bail. He just did a shit load of time in North Carolina, bricks, crazy ass life. He do a bunch of fucking time, in and out of jail. This shit is real, this the projects.”" });
    this.children.add(p);
    p = new MediumEditor.BlockModel({ text: "The meaning begins to sink in: Nas is the only person who rose above the perils of these projects to become a legendary hip-hop figure. Nas is then shown in a more recent setting, watching film of Jungle listing the fate of each person in the photo. As the camera lingers on the stoic rapper for an uncomfortably long period, eventually his hard stare softens and he visibly struggles to muster, “that’s fucked up,” as Jungle concludes his story." });
    this.children.add(p);
    p = new MediumEditor.BlockModel({ text: "“Those emotions you see from Nas are very sincere,” said One9. “Those are his friends and peers that he grew up with. To hear it firsthand from his brother exactly how many years they were doing or where they are now was devastating for him to see. He allowed us that access to capture that unfiltered emotion.”" });
    this.children.add(p);
    p = new MediumEditor.BlockModel({ src: 'https://d262ilb51hltx0.cloudfront.net/max/2000/1*BtS_9bvMh9xlWnyQ3TO4xA.jpeg', caption: 'Nas at the Tribeca Film Festival, 2014', type: 'image' });
    this.children.add(p);
    p = new MediumEditor.BlockModel({ text: "In the eyes of many, Nasir Jones accomplished everything he had set out to do with his 1994 debut album. Now celebrating 20 years since its release, the set has become required listening for any individual that claims to be part of hip-hop culture. From its intriguing title to its meticulous sequencing, Illmatic is the yardstick that all rap albums are measured against. Nas’ inner-city version of Shakespearian lyricism was inspired by the poetry of Rakim, molded into a new language art. Illmatic has not only aged like fine wine, but it is the very grape that all wines are manufactured from." });
    this.children.add(p);
  },
  html: function() {
    return this.children.html();
  },

  //
  parse: function(html) {

  },

  markup: function(selection, markupKlass) {
    if (selection.type != 'range') return;
    for(var i = selection.startIx; i <= selection.endIx; i++) {
      var block = this.children.at(i);
      var start = i == selection.startIx ? selection.startOffset : 0;
      var end = i == selection.endIx ? selection.endOffset : block.text.length;
      block.markups.add(new markupKlass({ start: start, end: end }));
    }
  },
  insertParagraph: function(selection) {

    var remainderText = '';
    for (var i = selection.startIx; i <= selection.endIx; i++) {

      var block = this.children.at(selection.startIx);

      if (i == selection.endIx) {
        var postText = block.text.substring(selection.endOffset);
        if (i == selection.startIx) {
          remainderText = postText;
        } else {
          if (selection.endOffset > 0) {
            block.setText(postText);
          }
        }
      }

      if (i > selection.startIx && i < selection.endIx) {
        // TODO - kill it
      }

      if (i == selection.startIx) {
        if (selection.startOffset < block.text.length) {
          block.setText(block.text.substring(0, selection.startOffset));
        }
      }
    }

    var newParagraph = new MediumEditor.BlockModel({ text: remainderText });
    this.children.insertAt(newParagraph, selection.startIx + 1);



      // range, confined to a single block - insert a new p afterward and give it
      // all text after the end offset + remove the highlighted text from the
      // start block
      //   same for a li

      // range, spanning multiple blocks - kill everything after the offset in
      // the start block, all blocks in between and everything before the offset
      // in the end block, then insert an empty paragraph between them
      //   same for a li

      // caret - insert a new paragraph and fill it with whatever
      // text occurs in the current paragraph after the offset




    // what if it begins on a heading and ends on something else, like an image or a li?


    // TODO - if selection is a normal caret, create a new paragraph and
    // fill it with whatever text occurs after the caret offset in the
    // current paragraph, then give it focus
    // if it's a list, add the next item (but don't inherit any of the
    // markups of the current cursor position)
    // it it's an image, create a new p under it
    // if it's a range, kill that range and create a new p

    // enter on an empty list item
    //   in the middle of a list?
  },
  changeBlockType: function(selection, newType, attrs) {
    var block = this.children.at(selection.startIx);
    block.changeType(newType, attrs);
  }
});
