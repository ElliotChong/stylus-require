stylus = require "stylus"
path = require "path"
fs = require "fs"
deasync = require "deasync"

DEFAULT_EXTENSIONS = [".styl", ".stylus", ".css"]

# Reset any previously registered extensions
lastRegisteredExtensions = undefined

# Save original extensions in case any are overwritten
originalExtensions = {}

# Expose Stylus options
options = {}

# Optional transform
transform = undefined

loadFile = (p_module, p_filename) ->
	file = fs.readFileSync(p_filename).toString()
	styl = stylus file

	styl.set "filename", p_filename

	for key, value of options
		styl.set key, value

	render = deasync styl.render
	css = render.call styl

	if transform?
		css = transform css

	p_module.exports = css

registerExtensions = (p_extensions) ->
	if not require.extensions
		console.warn "`require.extensions` is not present. Unable to attach handler for file extension."
		return

	if lastRegisteredExtensions?.length > 0
		# Remove the previously applied extensions
		for extension in lastRegisteredExtensions
			require.extensions[extension] = originalExtensions[extension]
			delete originalExtensions[extension]

	for extension in p_extensions
		originalExtensions[extension] = require.extensions[extension]
		require.extensions[extension] = loadFile

	lastRegisteredExtensions = p_extensions

	# Patch Node's module loader to be able to handle multi-dot extensions.
	# This is a horrible thing that should not be required.
	Module = require "module"

	findExtension = (filename) ->
		extensions = path.basename(filename).split "."

		# Remove the initial dot from dotfiles.
		extensions.shift() if extensions[0] is ""

		# Start with the longest possible extension and work our way shortwards.
		while extensions.shift()
			curExtension = "." + extensions.join "."
			return curExtension if Module._extensions[curExtension]

		return ".js"

	Module::load = (filename) ->
		@filename = filename
		@paths = Module._nodeModulePaths path.dirname filename
		extension = findExtension filename
		Module._extensions[extension] @, filename
		@loaded = true

registerExtensions DEFAULT_EXTENSIONS

module.exports = ->
	registerExtensions arguments...

module.exports.registerExtensions = registerExtensions

Object.defineProperty module.exports, "transform",
	enumerable: true
	get: ->
		transform
	set: (p_value) ->
		transform = p_value

Object.defineProperty module.exports, "options",
	enumerable: true
	get: ->
		options
	set: (p_value) ->
		options = p_value
