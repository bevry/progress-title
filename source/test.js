'use strict'

const { equal, deepEqual } = require('assert-helpers')
const joe = require('joe')
const Progress = require('../')

joe.suite('progress-title', function (suite, test) {
	test('instantation with config', function () {
		const progress = Progress.create({ interval: 0 })
		deepEqual(progress.config.interval, 0, 'interval was 0')
	})
	test('instantation with defaults', function () {
		const progress = Progress.create()
		deepEqual(progress.config.interval, 1000, 'interval was default')
	})
	test('workflow', function (complete) {
		const interval = 1000
		const progress = Progress.create({ log: true, interval: 0 })
		progress.start()
		setTimeout(function () {
			progress.update()
			equal(progress._format(), null)
		}, interval * 1.1)
		setTimeout(function () {
			progress.update('message A')
			equal(progress._format(), 'message A')
		}, interval * 1.2)
		setTimeout(function () {
			progress.update('message B', { total: 2, done: 1, executing: 1 })
			equal(progress._format(), 'message B [50% — 1 running]')
		}, interval * 1.3)
		setTimeout(function () {
			progress.update('message C', { total: 10, completed: 5, running: 5 })
			equal(progress._format(), 'message C [50% — 5 running]')
		}, interval * 1.4)
		setTimeout(function () {
			progress.stop()
			complete()
		}, interval * 2)
	})
})
