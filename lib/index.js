(function() {
  var DEFAULT_EXTENSIONS, deasync, fs, lastRegisteredExtensions, loadFile, nib, originalExtensions, path, registerExtensions, stylus, stylusOperations, transform;

  stylus = require("stylus");

  path = require("path");

  fs = require("fs");

  deasync = require("deasync");

  try {
    nib = require("nib");
  } catch (_error) {}

  DEFAULT_EXTENSIONS = [".styl", ".stylus", ".css"];

  lastRegisteredExtensions = void 0;

  originalExtensions = {};

  stylusOperations = [];

  transform = void 0;

  loadFile = function(p_module, p_filename) {
    var css, file, render, styl;
    file = fs.readFileSync(p_filename).toString();
    styl = stylus(file).set("filename", p_filename);
    if ((nib != null ? nib.path : void 0) != null) {
      styl.include(nib.path);
    }
    render = deasync(styl.render);
    css = render.call(styl);
    if (transform != null) {
      css = transform(css);
    }
    return p_module.exports = css;
  };

  registerExtensions = function(p_extensions) {
    var Module, extension, findExtension, _i, _j, _len, _len1;
    if (!require.extensions) {
      console.warn("`require.extensions` is not present. Unable to attach handler for file extension.");
      return;
    }
    if ((lastRegisteredExtensions != null ? lastRegisteredExtensions.length : void 0) > 0) {
      for (_i = 0, _len = lastRegisteredExtensions.length; _i < _len; _i++) {
        extension = lastRegisteredExtensions[_i];
        require.extensions[extension] = originalExtensions[extension];
        delete originalExtensions[extension];
      }
    }
    for (_j = 0, _len1 = p_extensions.length; _j < _len1; _j++) {
      extension = p_extensions[_j];
      originalExtensions[extension] = require.extensions[extension];
      require.extensions[extension] = loadFile;
    }
    lastRegisteredExtensions = p_extensions;
    Module = require("module");
    findExtension = function(filename) {
      var curExtension, extensions;
      extensions = path.basename(filename).split(".");
      if (extensions[0] === "") {
        extensions.shift();
      }
      while (extensions.shift()) {
        curExtension = "." + extensions.join(".");
        if (Module._extensions[curExtension]) {
          return curExtension;
        }
      }
      return ".js";
    };
    return Module.prototype.load = function(filename) {
      this.filename = filename;
      this.paths = Module._nodeModulePaths(path.dirname(filename));
      extension = findExtension(filename);
      Module._extensions[extension](this, filename);
      return this.loaded = true;
    };
  };

  registerExtensions(DEFAULT_EXTENSIONS);

  module.exports = function() {
    return registerExtensions.apply(null, arguments);
  };

  module.exports.registerExtensions = registerExtensions;

  Object.defineProperty(module.exports, "transform", {
    enumerable: true,
    get: function() {
      return transform;
    },
    set: function(p_value) {
      return transform = p_value;
    }
  });

}).call(this);
