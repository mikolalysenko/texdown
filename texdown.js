var mathmode  = require("mathmode");
var through   = require("through");
var concat    = require("concat-stream")

function md_escape(expr) {
  return expr.replace(/\"/g, "\\\"");
}

module.exports = function(markdown, options) {
  if(!options) {
    options = {};
  }
  
  var result = through();
  
  //Fuck it.  I'll deal with streams properly once 0.10 is out.
  markdown.pipe(concat(function(err, data) {
    if(err) {
      result.emit("error", err);
      return;
    }
    
    var itoks     = data.toString().split("$")
      , otoks     = []
      , nspawned  = 0
      , failed    = false;
    function doTex(idx) {
      ++nspawned;
      mathmode(itoks[idx], options).pipe(concat(function(err, data) {
        if(failed) {
          return;
        }
        if(err) {
          failed = true;
          result.emit("error", err);
          return;
        }
        otoks[idx] = '![alt text](data:png;charset=US-ASCII;base64,'+data.toString("base64") + ' "' + md_escape(itoks[idx]) +'")';
        if(--nspawned === 0) {
          result.end(otoks.join(""));
        }
      }));
    }
    for(var i=0; i<itoks.length; ++i) {
      if(i % 2 === 0) {
        otoks.push(itoks[i]);
      } else if(itoks[i].length === 0) {
        otoks.push("$");
      } else {
        doTex(i);
      }
    }
    
    if(nspawned === 0) {
      result.end(data);
    }
  }));
  
  return result;
}