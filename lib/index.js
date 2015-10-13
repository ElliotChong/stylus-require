(function() {
  var DEFAULT_EXTENSIONS, deasync, fs, lastRegisteredExtensions, loadFile, options, originalExtensions, path, registerExtensions, stylus, transform;

  stylus = require("stylus");

  path = require("path");

  fs = require("fs");

  deasync = require("deasync");

  DEFAULT_EXTENSIONS = [".styl", ".stylus", ".css"];

  lastRegisteredExtensions = void 0;

  originalExtensions = {};

  options = {};

  transform = void 0;

  loadFile = function(p_module, p_filename) {
    var css, file, key, render, styl, value;
    file = fs.readFileSync(p_filename).toString();
    styl = stylus(file);
    styl.set("filename", p_filename);
    for (key in options) {
      value = options[key];
      styl.set(key, value);
    }
    render = deasync(styl.render);
    css = render.call(styl);
    if (transform != null) {
      css = transform(css);
    }
    return p_module.exports = css;
  };

  registerExtensions = function(p_extensions) {
    var Module, extension, findExtension, i, j, len, len1;
    if (!require.extensions) {
      console.warn("`require.extensions` is not present. Unable to attach handler for file extension.");
      return;
    }
    if ((lastRegisteredExtensions != null ? lastRegisteredExtensions.length : void 0) > 0) {
      for (i = 0, len = lastRegisteredExtensions.length; i < len; i++) {
        extension = lastRegisteredExtensions[i];
        require.extensions[extension] = originalExtensions[extension];
        delete originalExtensions[extension];
      }
    }
    for (j = 0, len1 = p_extensions.length; j < len1; j++) {
      extension = p_extensions[j];
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

  Object.defineProperty(module.exports, "options", {
    enumerable: true,
    get: function() {
      return options;
    },
    set: function(p_value) {
      return options = p_value;
    }
  });

}).call(this);
