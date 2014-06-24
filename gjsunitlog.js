// This file is part of the gjsunit framework
// Please visit https://github.com/philipphoffmann/gjsunit for more information

imports.searchPath.push('.');
imports.searchPath.push('/usr/share/gnome-js');
imports.searchPath.push('/usr/share/gnome-shell/js');

var testSuites = [];

function Testsuite(name) {
	this._init(name);
}
Testsuite.prototype = {
	_init: function(name) {
		this.name = name;
		this.cases = [];
		this.countTestsOverall = 0;
		this.countTestsFailed = 0;
	},

	log: function() {
		let output = '<testsuite name="' + this.name + '" tests="' + this.countTestsOverall + '" failures="' + this.countTestsFailed + '">';
		for( let i in this.cases ) {
			let tc = this.cases[i];
			if( tc.log ) {
				output += tc.log();
			}
		}
		output += '</testsuite>';
		return output;
	}
}

function Testcase(name) {
	this._init(name);
}

Testcase.prototype = {
	_init: function(name) {
		this.name = name;
		this.error = '';
	},

	log: function() {
		let output = '<testcase name="' + this.name + '"';
		if( !this.error ) {
			output += '/>';
		} else {
			output += '><failure message="' + this.error + '"/></testcase>';
		}
		return output;
	},

	fail: function(message) {
		this.error = message;
	}
}

window.describe = function(moduleName, callback) {
	var inner = new Testsuite(moduleName);
	testSuites.push(inner);
	callback();
	testSuites.countTestsOverall += inner.countTestsOverall;
	testSuites.countTestsFailed += inner.countTestsFailed;
};

window.it = function(expectation, callback) {
	let test = new Testcase(expectation);
	try {
		callback();
	}
	catch(e) {
		test.fail(e.message);
	}
	let testSuite = testSuites.pop();
	testSuite.cases.push(test);
	testSuites.push(testSuite);
}

window.expect = function(actualValue) {

	function MatcherFactory(actualValue, positive) {
		function triggerResult(success, msg) {
			if( (success && !positive) ||
				(!success && positive) ) {
				throw new Error(msg);
			}
		}

		return {
			to: function(callback) {
				triggerResult(callback(actualValue),
					'      Expected callback to validate'
				);
			},
			toBe: function(expectedValue) {
				triggerResult(actualValue === expectedValue,
					'      Expected values to match using ===\n' +
					'      Expected: ' + expectedValue + '\n' +
					'      Actual: ' + actualValue
				);
			},
			toEqual: function(expectedValue) {
				triggerResult(actualValue == expectedValue,
					'      Expected values to match using ==\n' +
					'      Expected: ' + expectedValue + '\n' +
					'      Actual: ' + actualValue
				);
			},
			toMatch: function(expectedValue) {
				triggerResult(!!actualValue.match(expectedValue),
					'      Expected values to match using regular expression\n' +
					'      Expression: ' + expectedValue + '\n' +
					'      Actual: ' + actualValue
				);
			},
			toBeDefined: function() {
				triggerResult(typeof actualValue !== 'undefined',
					'      Expected value to be defined'
				);
			},
			toBeUndefined: function() {
				triggerResult(typeof actualValue === 'undefined',
					'      Expected value to be undefined'
				);
			},
			toBeNull: function() {
				triggerResult(actualValue === null,
					'      Expected value to be null'
				);
			},
			toBeTruthy: function() {
				triggerResult(actualValue,
					'      Expected value to be truthy'
				);
			},
			toBeFalsy: function() {
				triggerResult(!actualValue,
					'      Expected value to be falsy'
				);
			},
			toContain: function(needle) {
				triggerResult(actualValue instanceof Array && actualValue.indexOf(needle) !== -1,
					'      Expected ' + actualValue + ' to contain ' + needle
				);
			},
			toBeLessThan: function(greaterValue) {
				triggerResult(actualValue < greaterValue,
					'      Expected ' + actualValue + ' to be less than ' + greaterValue
				);
			},
			toBeGreaterThan: function(smallerValue) {
				triggerResult(actualValue > smallerValue,
					'      Expected ' + actualValue + ' to be greater than ' + smallerValue
				);
			},
			toBeCloseTo: function(expectedValue, precision) {
				var shiftHelper = Math.pow(10, precision);
				triggerResult(Math.round(actualValue * shiftHelper) / shiftHelper === Math.round(expectedValue * shiftHelper) / shiftHelper,
					'      Expected ' + actualValue + ' with precision ' + precision + ' to be close to ' + expectedValue
				);
			},
			toThrow: function() {
				var didThrow = false;
				try {
					actualValue();
					didThrow = false;
				}
				catch(e) {
					didThrow = true;
				}

				triggerResult(didThrow,
					'      Expected ' + actualValue.name + ' to throw an exception'
				);
			}
		};
	}

	let testSuite = testSuites.pop();
	++testSuite.countTestsOverall;
	testSuites.push(testSuite);

	var expecter = new MatcherFactory(actualValue, true);
	expecter.not = new MatcherFactory(actualValue, false);

	return expecter;
}

var runTests = function(namespace) {
	// recursively check the test directory for executable tests
	for( var subNamespace in namespace ) {

		// execute any test functions
		if( subNamespace === 'testSuite' && typeof namespace[subNamespace] === 'function' ) {
			namespace[subNamespace]();
		}
		// descend into subfolders and objects
		else if( typeof namespace[subNamespace] === 'object' ) {
			let outer = testSuites;
			let inner = new Testsuite(subNamespace);
			testSuites = inner.cases;
			testSuites.countTestsOverall = 0;
			testSuites.countTestsFailed = 0;
			runTests(namespace[subNamespace]);
			inner.countTestsOverall = inner.cases.countTestsOverall;
			inner.countTestsFailed = inner.cases.countTestsFailed;
			outer.push(inner);
			testSuites = outer;
		}
	}
}

// by default we run tests from the 'test' directory
var testDir = 'test';
var knownDirs = [];

// scan all modules we can import
for( var dir in imports ) {
	knownDirs.push(dir);
}

// if the provided argument is amongst the known modules, use that module as the test root
if( ARGV[0] && knownDirs.indexOf(ARGV[0]) !== -1 ) {
	testDir = ARGV[0];
}


// run tests from the test root
runTests(imports[testDir]);


let logfile = '<?xml version="1.0"?>\n';
logfile += '<testsuites>';
for( let i in testSuites ) {
	logfile += testSuites[i].log();
}
logfile += '</testsuites>';


print(logfile);
