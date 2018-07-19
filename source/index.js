/* eslint no-mixed-operators:0 class-methods-use-this:0 */
'use strict'

/**
@typedef {Object} State
@property {string} text
@property {Counts} counts
@private
*/

/**
@typedef {Object} Configuration
@property {boolean} [verbose=false] if false, will output % complete and amount of running tasks (if any), if true, will output each count
@property {boolean} [log=false] if true, titles are outputted to stdout
@property {number} [interval=1000] how often to update the title, if 0, then update the title for each update
@property {string} [open='\u001b]0;'] the characters used to start the title
@property {string} [close='\u0007'] the characters used to close the title
@public
*/

/**
@typedef {Object} Counts
@property {number} [remaining=0]
@property {number} [executing=0]
@property {number} [done=0]
@property {number} [total=0]
@public
*/

/**
@typedef {Counts} CountsInput
@property {number} [running=0] an alias for executing
@property {number} [completed=0] an alias for done, as completed is ambigious, does it include items that errored?
@public
*/

/**
Construct our Progress class
@param {Configuration} [opts]
@public
*/
class Progress {
	constructor (opts = {}) {
		this.title = null
		this.timer = null
		this.state = {
			text: null,
			counts: null
		}
		this.config = Object.assign({
			verbose: false,
			log: false,
			interval: 1000,
			open: '\u001b]0;', // ECMAScript equivalent for '\033]0;'
			close: '\u0007' // ECMAScript equivalent for '\007'
		}, opts)
	}

	/**
	Creates and returns a new instance of the current class
	@param {...*} args - the arguments to be forwarded along to the constructor
	@return {Progress} The new instance.
	@static
	@public
	*/
	static create (...args) {
		return new this(...args)
	}

	/**
	 * Trigger a title update if necessary
	 * @param {string} [title] if ommitted, it is the result from {@link Progress#format}
	 * @returns {this}
	 * @chainable
	 * @private
	 */
	_title (title) {
		if (title == null) {
			title = this._format()
		}
		if (title != null && this.title !== title) {
			this.title = title
			this._write()
		}
		return this
	}

	/**
	 * Apply the title update
	 * @returns {this}
	 * @chainable
	 * @private
	 */
	_write () {
		const title = this.title
		if (title == null) throw new Error('title was null, this should never happen')
		const { open, close, log } = this.config
		const output = (open + title + close) + (log && title ? `${title}\n` : '')
		process.stdout.write(output)
		return this
	}

	/**
	 * Generate the title
	 * @returns {string?}
	 * @private
	 */
	_format () {
		const { verbose } = this.config
		const { text, counts } = this.state
		const { remaining, executing, done, total } = counts
		if (total) {
			const completed = Math.round((done / total) * 100) + '%'
			const status = (text && `${text} ` || '') + (
				verbose
					? `[${remaining} remaining] [${executing} executing] [${done} completed] [${total} total]`
					: `[${completed}` + (executing && ` — ${executing} running]` || ']')
			)
			return status
		}
		else if (text) {
			return text
		}
		else {
			return null
		}
	}

	/**
	 * Clear the interval timer, using for pausing title updates
	 * Has no effect if interval is 0
	 * @returns {this}
	 * @chainable
	 * @public
	 */
	pause () {
		if (this.timer) {
			clearInterval(this.timer)
			this.timer = null
		}
		return this
	}

	/**
	 * Commence/resume the interval timer
	 * @param {number} [interval] if you wish to update the interval configuration, provide this
	 * @returns {this}
	 * @chainable
	 * @public
	 */
	resume (interval) {
		this.pause()
		if (interval != null) {
			this.config.interval = interval
		}
		if (this.config.interval) {
			this.timer = setInterval(this._title.bind(this), this.config.interval)
		}
		return this
	}

	/**
	 * Set the counts
	 * @param {CountsInput} [counts]
	 * @returns {Counts}
	 * @private
	 */
	_counts ({ remaining = 0, executing = 0, running = 0, done = 0, completed = 0, total = 0 } = {}) {
		return {
			remaining, total,
			executing: (executing || running),
			done: (done || completed)
		}
	}

	/**
	 * Update the progress, which queues a title update
	 * @param {string} [text] the text that will be at the start of the title
	 * @param {CountsInput} [counts] the numbers that represent the current progress
	 * @returns {this}
	 * @chainable
	 * @public
	 */
	update (text = '', counts = {}) {
		const { interval } = this.config
		this.state = { text, counts: this._counts(counts) }
		if (!interval) this._title()
		return this
	}

	/**
	 * Commence the progress updates to the terminal title
	 * @returns {this}
	 * @chainable
	 * @public
	 */
	start () {
		return this._title('').resume()
	}

	/**
	 * Close the progress updates to the terminal title
	 * @returns {this}
	 * @chainable
	 * @public
	 */
	stop () {
		return this.pause()._title('')
	}
}

module.exports = Progress
