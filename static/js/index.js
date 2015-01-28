var underscore = require('ep_etherpad-lite/static/js/underscore');
var padeditor = require('ep_etherpad-lite/static/js/pad_editor').padeditor;
var padEditor;

exports.aceAttribsToClasses = function(name, context){
  if(context.key == 'img'){
    return ['img:' + context.value ];
  }
  if(context.key == 'imgSize'){
    return ['imgSize:' + context.value ];
  }
}

exports.aceInitialized = function(hook, context){
  var editorInfo = context.editorInfo;
  editorInfo.ace_setImageSize = underscore(image.setImageSize).bind(context);
  editorInfo.ace_removeImage = underscore(image.removeImage).bind(context);
}

// Handle click events
exports.postAceInit = function(hook,context){

  var oldLineNumber = 0;

  context.ace.callWithAce(function(ace){
    var doc = ace.ace_getDocument();

    // Hide the controls by default -- I'm nto sure why I don't do this with CSS
    $(doc).find("head").append("<style type='text/css'>.control{display:none;}</style>");      

    var $inner = $(doc).find('#innerdocbody');

    // Don't allow resize handles to be shown
    doc.execCommand("enableObjectResizing", false, false);

    // On control select do fuck all, I hate this..
    $inner.on("oncontrolselect", ".control", function(){
    })

    // On drag start of an image store the old line number (#hack potentially bad)
    $inner.on("dragstart", ".image", function(e){
      var id = e.currentTarget.id;
      var imageLine = $inner.find("#"+id).parent();
      oldLineNumber = imageLine.prevAll().length;
    })

    // On drag end remove the attribute on the line
    $inner.on("dragend", ".image", function(e){
      // Here I need to remove the lineAttribute from the source line
      context.ace.callWithAce(function(ace){
        ace.ace_removeImage(oldLineNumber);
      }, 'img', true);

    })

    
    // On click ensure all image controls are hidden
    $inner.on("click", "div", function(){
      // if it's an image
      var isImage = $(this).find(".image").length > 0;
      // Hide the controls
      if(!isImage){
        $(doc).find("head").append("<style>.control{display:none;}</style>");      
      }
    });

    // On clicking / hover of an image show the resize shiz
    $inner.on("click, mouseover", ".image", function(){
      var randomId = $(this)[0].id;
      // TODO Fix this so it's per image
      $(doc).find("head").append("<style>.control{display:block;}</style>");      
    });

    // On clicking / hover of an image show the resize shiz
    $inner.on("mouseout", ".image", function(){
      var randomId = $(this)[0].id;
      var isImage = $(this).context.className === "image";
      if(!isImage){
        $(doc).find("head").append("<style>.control{display:none;}</style>");
      }
    });

    // On click of a control (to resize image) perform some shit
    $inner.on("click", ".control", function(e){
      var newSize = e.currentTarget.id;
      var imageLine = $(this).parent().parent();;
      var lineNumber = imageLine.prevAll().length;
      context.ace.callWithAce(function(ace){
        ace.ace_setImageSize(newSize, lineNumber);
      }, 'img', true);
    });

  }, 'image', true);
}


var image = {
  setImageSize: function(size, lineNumber){
    var documentAttributeManager = this.documentAttributeManager;
    documentAttributeManager.setAttributeOnLine(lineNumber, 'imgSize', size); // make the line a task list
  },

  removeImage: function(lineNumber){
    var documentAttributeManager = this.documentAttributeManager;

    // This errors for some reason..
    documentAttributeManager.removeAttributeOnLine(lineNumber, 'img'); // make the line a task list
    documentAttributeManager.removeAttributeOnLine(lineNumber, 'imgSize'); // make the line a task list
  }
}

exports.aceEditorCSS = function(hook_name, cb){return ["/ep_copy_paste_images/static/css/ace.css"];} // inner pad CSS

// Rewrite the DOM contents when an IMG attribute is discovered
exports.aceDomLineProcessLineAttributes = function(name, context){
  var cls = context.cls;
  var exp = /(?:^| )img:([^>]*)/;
  var expSize = /(?:^| )imgSize:((\S+))/;
  var imgType = exp.exec(cls);
  var imgSize = expSize.exec(cls);
  if (!imgType) return [];
  var width = "width:25%";
  var height = "height:25%;%";
  if(imgSize){
    if(imgSize[1] == "small"){
      var width = "width:25%";
      var height = "height:25%;";
    }
    if(imgSize[1] == "medium"){
      var width = "width:50%";
      var height = "height:50%;";
    }
    if(imgSize[1] == "large"){
      var width = "width:100%";
      var height = "height:100%;";
    }
  }

  // var template = "";
  var randomId =  Math.floor((Math.random() * 100000) + 1); 
  var template = '<span id="'+randomId+'" class="image" style="'+width+'">';
  template += '<span class="control '+randomId+'" id="small" unselectable="on" contentEditable=false></span>';
  template += '<span class="control" id="medium" contentEditable=false></span>';
  template += '<span class="control" id="large" contentEditable=false></span>';
  if (imgType[1]){
    var preHtml = template + imgType[1]+' style="'+height+'width:100%;" contentEditable="false">'
    var postHtml = '</span>';
    console.log(preHtml, postHtml);

    var modifier = {
      preHtml: preHtml,
      postHtml: postHtml,
      processedMarker: true
    };
    return [modifier];
  }
  
  return [];
};

// When an image is detected give it a lineAttribute
// of Image with the URL to the iamge
// Images dragged / dropped from the Desktop will be Base64 encoded
exports.collectContentImage = function(name, context){
  var tname = context.tname;
  var state = context.state;
  var cc = context.cc;
  var lineAttributes = state.lineAttributes
  if(tname === "div" || tname === "p"){
    delete lineAttributes['img'];
  }
  if(tname == "img"){
    lineAttributes['img'] = context.node.outerHTML;
  }
}



// look for images -- not sure if this is needed
exports.aceGetFilterStack = function(name, context){
/*
  return [
    context.linestylefilter.getRegexpFilter(
      new RegExp("img", "g"), 'img')
  ];
*/
}


exports.collectContentLineText = function(name, context){
}

exports.collectContentPre = function(name, context){
}

exports.collectContentPost = function(name, context){
  var tname = context.tname;
  var state = context.state;
  var lineAttributes = state.lineAttributes
//  var tagIndex = _.indexOf(tags, tname);
  if(tname == "img"){
    delete lineAttributes['img'];
  }
// uncommenting breaks drag and drop in firefox
//  delete context.state.lineAttributes.img;
}

exports.aceCreateDomLine = function(name, args){
}

exports.acePostWriteDomLineHTML = function (name, context){
}
exports.ccRegisterBlockElements = function (name, context){
  return ['img'];
}
exports.aceRegisterBlockElements = function (name, context){
//  return ['img']; // doesn't seem to make any difference?
}

exports.aceAttribClasses = function(hook, attr){
}

