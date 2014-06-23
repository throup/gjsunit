// This file is part of the gjsunit framework
// Please visit https://github.com/philipphoffmann/gjsunit for more information

imports.searchPath.push('.');
imports.searchPath.push('/usr/share/gnome-js');
imports.searchPath.push('/usr/share/gnome-shell/js');

var countTestsOverall = 0;
var countTestsFailed = 0;

window.describe = function(moduleName, callback) {
	logfile += '<testsuite name="' + moduleName + '">\n';
	callback();
	logfile += '</testsuite>\n';
};

window.it = function(expectation, callback) {
	logfile += '<testcase name="' + expectation + '">\n';
	try {
		callback();
	}
	catch(e) {
		logfile += '<failure/>';
	}
	logfile += '</testcase>\n';
}

window.expect = function(actualValue) {

	function MatcherFactory(actualValue, positive) {
		function triggerResult(success, msg) {
			if( (success && !positive) ||
				(!success && positive) ) {
				++countTestsFailed;
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

	++countTestsOverall;

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
			logfile += '<testsuite name="' + subNamespace + '">\n';
			runTests(namespace[subNamespace]);
			logfile += '</testsuite>\n';
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


var logfile = '';

logfile += '<?xml version="1.0"?>\n';
logfile += '<testsuites>\n';

// run tests from the test root
runTests(imports[testDir]);

logfile += '</testsuites>\n';


print(logfile);