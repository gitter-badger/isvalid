var chai = require('chai'),
	expect = chai.expect,
	ValidationError = require('../lib/errors/validationError.js'),
	isvalid = require('../');

chai.use(function(_chai, utils) {
	var Assertion = chai.Assertion;
	utils.addProperty(Assertion.prototype, 'validationError', function() {
		var err = utils.flag(this, 'object');
		new Assertion(err).to.be.instanceof(Error);
		new Assertion(err).to.have.property('keyPath').to.be.an('Array');
		new Assertion(err).to.have.property('schema').to.be.an('Object');
		new Assertion(err).to.have.property('message').to.be.a('String');
	});
});

describe('Validate', function() {
	describe('function', function() {
		describe('[input]', function() {
			it ('should throw an error if schema is not provided', function() {
				expect(function() {
					isvalid({}, undefined, undefined);
				}).to.throw(Error);
			});
			it ('should throw an error if callback is not provided', function() {
				expect(function() {
					isvalid({}, {}, undefined);
				}).to.throw(Error);
			});
		});
		describe('[common validators]', function() {
			it ('should come back with error if object is required and object is not set.', function(done) {
				isvalid(undefined, { type: Object, required: true }, function(err, validObj) {
					expect(err).to.be.validationError;
					expect(err).to.have.property('validator').equal('required');
					done();
				});
			});
			it ('should call default if function with callback is provided.', function(done) {
				isvalid(undefined, { type: Object, default: function(cb) {
					cb({ empty: true });
				} }, function(err, validObj) {
					expect(err).to.be.null;
					expect(validObj).to.have.property('empty').equals(true);
					done();
				});
			});
			it ('should call default if function with no callback is provided', function(done) {
				isvalid(undefined, { type: Object, default: function() {
					return { empty: true }
				} }, function(err, validObj) {
					expect(err).to.be.null;
					expect(validObj).to.have.property('empty').equals(true);
					done();
				});
			});
			it ('should come back with error if object is required through options', function(done) {
				isvalid(undefined, { type: Object }, function(err, validObj) {
					expect(err).to.be.validationError;
					expect(err).to.have.property('validator').equals('required');
					done();
				}, { required: true });
			});
			it ('should come back with true when default value \'true\' is provided', function(done) {
				isvalid(undefined, { type: Object, default: { empty: true } }, function(err, validObj) {
					expect(err).to.be.null;
					expect(validObj).to.have.property('empty').equals(true);
					done();
				});
			});
			it ('should come back with error if null and null is not allowed', function(done) {
				isvalid(null, { type: String }, function(err, validObj) {
					expect(err).to.be.validationError;
					done();
				});
			});
			it ('should come back with no error if null and null is allowed', function(done) {
				isvalid(null, { type: String, allowNull: true, required: true }, function(err, validObj) {
					expect(err).to.be.null;
					expect(validObj).to.be.null;
					done();
				});
			});
		});
		describe('[Object validators]', function() {
			it ('should come back with error if input is not an object', function(done) {
				isvalid(123, {}, function(err, validObj) {
					expect(err).to.be.validationError;
					expect(err).to.have.property('validator').equal('type');
					done();
				});
			});
			it ('should come back with no error and validObj if object shortcut is empty.', function(done) {
				isvalid({}, {}, function(err, validObj) {
					expect(err).to.be.null;
					expect(validObj).to.be.a('Object');
					done();
				});
			});
			it ('should come out with same input as output if keys can validate.', function(done) {
				isvalid({
					awesome: true,
					why: 'It just is!'
				}, {
					awesome: { type: Boolean },
					why: { type: String }
				}, function(err, validObj) {
					expect(err).to.be.null;
					expect(validObj).to.have.property('awesome').equals(true);
					expect(validObj).to.have.property('why').equals('It just is!');
					done();
				});
			});
			it ('should come back with unknown keys intact if unknownKeys is \'allow\'.', function(done) {
				isvalid({
					awesome: true,
					why: 'It just is!'
				}, {
					type: Object,
					unknownKeys: 'allow',
					schema: {
						awesome: { type: Boolean }
					}
				}, function(err, validObj) {
					expect(err).to.be.null;
					expect(validObj).to.have.property('why').equals('It just is!');
					done();
				});
			});
			it ('should come back with unknown keys intact if unknownKeys is provided as \'allow\' in options', function(done) {
				isvalid({
					awesome: true,
					why: 'It just is!'
				}, {
					awesome: { type: Boolean }
				}, function(err, validObj) {
					expect(err).to.be.null;
					expect(validObj).to.have.property('why').equals('It just is!');
					done();
				}, { unknownKeys: 'allow' });
			});
			it ('should come back with error if there are unknown keys and unknownKeys is not set.', function(done) {
				isvalid({
					awesome: true,
					why: 'It just is!'
				}, {
					awesome: { type: Boolean }
				}, function(err, validObj) {
					expect(err).to.be.validationError;
					expect(err).to.have.property('validator').equal('unknownKeys');
					done();
				});
			});
			it ('should come back with error if there are unknown keys and unknownKeys is set to \'deny\'.', function(done) {
				isvalid({
					awesome: true,
					why: 'It just is!'
				}, {
					type: Object,
					unknownKeys: 'deny',
					schema: {
						awesome: { type: Boolean }
					}
				}, function(err, validObj) {
					expect(err).to.be.validationError;
					expect(err).to.have.property('validator').equal('unknownKeys');
					done();
				});
			});
			it ('should come back with keys removed if unknown keys and unknownKeys is set to \'remove\'', function(done) {
				isvalid({
					awesome: true,
					why: 'It just is!'
				}, {
					type: Object,
					unknownKeys: 'remove',
					schema: {
						awesome: { type: Boolean }
					}
				}, function(err, validObj) {
					expect(validObj).to.not.have.property('why');
					done();
				});
			});
			describe('allowUnknownKeys backwards compatibility', function() {
				it ('should come back with old validator name in error if allowUnknownKeys was converted to unknownKeys', function(done) {
					isvalid({
						awesome: true,
						why: 'It just is!'
					}, {
						type: Object,
						allowUnknownKeys: false,
						schema: {
							awesome: { type: Boolean }
						},
						errors: {
							'allowUnknownKeys': 'old value'
						}
					}, function(err, validObj) {
						expect(err).to.be.validationError;
						expect(err.validator).to.equal('allowUnknownKeys');
						expect(err.message).to.equal('old value');
						done();
					});
				});
			});
		});
		describe('[Array validators]', function() {
			it ('should come back with error if input is not an array', function(done) {
				isvalid(123, [{}], function(err, validObj) {
					expect(err).to.be.validationError;
					done();
				});
			});
			it ('should come back with no error and an empty array when supplying empty array', function(done) {
				isvalid([], [{}], function(err, validObj) {
					expect(err).to.be.null;
					expect(validObj).to.have.length(0);
					done();
				});
			});
			it ('should come back with error if array length is not within ranges of len', function(done) {
				isvalid([], {
					type: Array,
					len: '2-',
					schema: {}
				}, function(err, validObj) {
					expect(err).to.be.validationError;
					expect(err).to.have.property('validator').equal('len');
					done();
				});
			});
			it ('should come back with error if unique is specified and array is not unique', function(done) {
				isvalid([{
					awesome: true
				},{
					awesome: true
				}], {
					type: Array,
					unique: true,
					schema: { awesome: { type: Boolean } }
				}, function(err, validObj) {
					expect(err).to.be.validationError;
					expect(err).to.have.property('validator').equal('unique');
					done();
				});
			});
			it ('should come back with no error if unique is specified and array is unique', function(done) {
				isvalid([{
					awesome: true
				},{
					awesome: false
				}], {
					type: Array,
					unique: true,
					schema: { awesome: { type: Boolean } }
				}, function(err, validObj) {
					expect(err).to.be.null;
					expect(validObj).to.have.length(2);
					done();
				});
			});
			it ('should come back with error if string array is not unique', function(done) {
				isvalid(['This', 'is', 'an', 'array', 'array'], {
					type: Array,
					unique: true,
					schema: { type: String }
				}, function(err, validObj) {
					expect(err).to.be.validationError;
					expect(err).to.have.property('validator').equal('unique');
					done();
				});
			});
		});
		describe('[String validators]', function() {
			it ('should come back with error if string is not supplied.', function(done) {
				isvalid(123, { type: String }, function(err, validObj) {
					expect(err).to.be.validationError;
					expect(err).to.have.property('validator').equal('type');
					done();
				});
			});
			it ('should come back with trimmed string when trim is set to true', function(done) {
				isvalid('  123abc  ', { type: String, trim: true }, function(err, validObj) {
					expect(err).to.be.null;
					expect(validObj).to.equal('123abc');
					done();
				});
			});
			it ('should come back with trimmed string when trim option is true', function(done) {
				isvalid('  123abc  ', { type: String }, function(err, validObj) {
					expect(err).to.be.null;
					expect(validObj).to.equal('123abc');
					done();
				}, { trim: true });
			});
			it ('should come back with an error if string does not match RegExp', function(done) {
				isvalid('123', { type: String, match: /^[a-z]+$/ }, function(err, validObj) {
					expect(err).to.be.validationError;
					expect(err).to.have.property('validator').equal('match');
					done();
				});
			});
			it ('should come back with no error and validObj should match input string when match is specified and input matches', function(done) {
				isvalid('123', { type: String, match: /^[0-9]+$/ }, function(err, validObj) {
					expect(validObj).to.equal('123');
					done();
				});
			});
			it ('should come back with undefined and no error if input is not required and match is not defined', function(done) {
				isvalid(undefined, { type: String }, function(err, validObj) {
					expect(err).to.be.null;
					expect(validObj).to.be.undefined;
					done();
				});
			});
			it ('should come back with no error and output same as input if string is supplied', function(done) {
				isvalid('123', { type: String }, function(err, validObj) {
					expect(err).to.be.null;
					expect(validObj).to.equal('123');
					done();
				});
			});
			it ('should come back with an error if string is not in enum', function(done) {
				isvalid('123', { type: String, enum: ['this','is','a','test'] }, function(err, validObj) {
					expect(err).to.be.validationError;
					done();
				});
			});
		});
		describe('[Number validators]', function() {
			it ('should convert string values into numbers if string contains a number', function(done) {
				isvalid('123.123', { type: Number }, function(err, validObj) {
					expect(err).to.be.null;
					expect(validObj).to.equal(123.123);
					done();
				});
			});
			it ('should come back with error if input is not a number.', function(done) {
				isvalid('abc', { type: Number }, function(err, validObj) {
					expect(err).to.be.validationError;
					done();
				});
			});
			it ('should come back with no error and input same as output if number is supplied', function(done) {
				isvalid(123, { type: Number }, function(err, validObj) {
					expect(err).to.be.null;
					expect(validObj).to.equal(123);
					done();
				});
			});
			it ('should come back with error if string is supplied - but not a number', function(done) {
				isvalid('abc', { type: Number }, function(err, validObj) {
					expect(err).to.be.validationError;
					expect(err).to.have.property('validator').equal('type');
					done();
				});
			});
			it ('should come back with error if input is not within range', function(done) {
				isvalid(1, { type: Number, range: '2-4' }, function(err, validObj) {
					expect(err).to.be.validationError;
					expect(err).to.have.property('validator').equal('range');
					done();
				});
			});
			it ('should come back with no error and output same as input if within range', function(done) {
				isvalid(3, { type: Number, range: '2-4' }, function(err, validObj) {
					expect(err).to.be.null;
					expect(validObj).to.equal(3);
					done();
				});
			});
		});
		describe('[Boolean validators]', function() {
			it ('should come back with error if input is not a Boolean', function(done) {
				isvalid([], { type: Boolean }, function(err, validObj) {
					expect(err).to.be.validationError;
					expect(err).to.have.property('validator').equal('type');
					done();
				});
			});
			it ('should come back with no error and validObj set to true if input is string with \'True\'', function(done) {
				isvalid('True', { type: Boolean }, function(err, validObj) {
					expect(err).to.be.null;
					expect(validObj).to.equal(true);
					done();
				});
			});
			it ('should come back with no error and validObj set to false if input is string with \'False\'', function(done) {
				isvalid('False', { type: Boolean }, function(err, validObj) {
					expect(err).to.be.null;
					expect(validObj).to.equal(false);
					done();
				});
			});
		});
		describe('[Date validators]', function() {
			it ('should come back with error if input is not a Date', function(done) {
				isvalid([], { type: Date }, function(err, validObj) {
					expect(err).to.be.validationError;
					expect(err).to.have.property('validator').equal('type');
					done();
				});
			});
			it ('should come back with no error and validObj set to a Date if input is string with an ISO date', function(done) {
				isvalid('2014-10-19T02:24:42.395Z', { type: Date }, function(err, validObj) {
					expect(err).to.be.null;
					expect(validObj.getTime()).to.equal(new Date("2014-10-19T02:24:42.395Z").getTime());
					done();
				});
			});
		});
		describe('[custom validators]', function() {
			it ('should call function if custom is specified.', function(done) {
				isvalid('test', {
					custom: function(obj, schema, fn) {
						expect(obj).to.be.a('String').equals('test');
						fn(null, 'test2');
					}
				}, function(err, validObj) {
					expect(validObj).to.be.a('String').equals('test2');
					done();
				});
			});
			it ('should call function if synchronous custom is specified', function(done) {
				isvalid(undefined, {
					custom: function(obj, schema) {
						return 'test';
					}
				}, function(err, validObj) {
					expect(err).to.be.null;
					expect(validObj).to.be.a('String').equal('test');
					done();
				});
			});
			it ('should convert errors thrown in synchronous custom function', function(done) {
				isvalid('test', {
					custom: function(obj, schema) {
						throw new Error('an error');
					}
				}, function(err, validObj) {
					expect(err).to.be.validationError;
					expect(err).to.have.property('message').equal('an error');
					done();
				});
			});
			it ('should return original object if synchronous function doesn\'t return', function(done) {
				isvalid('test', {
					custom: function(obj, schema) {}
				}, function(err, validObj) {
					expect(err).to.be.null;
					expect(validObj).to.be.a('String').equal('test');
					done();
				});
			});
			it ('should reformat err if custom is specified and returns an error', function(done) {
				isvalid({}, {
					custom: function(obj, schema, fn) {
						fn(new Error('This is an error'));
					}
				}, function(err, validObj) {
					expect(err).to.be.validationError;
					done();
				});
			});
			it ('should pass on custom schema options if specified', function(done) {
				isvalid({}, {
					custom: function(obj, schema, fn) {
						expect(schema).to.have.property('options').to.be.equal('test');
						fn();
					},
					options: 'test'
				}, function(err, validObj) {
					done();
				});
			});
			it ('should first validate using validators and then custom', function(done) {
				isvalid({
					'low': 0
				}, {
					type: Object,
					schema: {
						'low': { type: Number },
						'high': { type: Number, default: 10 },
					},
					custom: function(obj, schema, fn) {
						expect(obj.high).to.equal(10);
						fn(obj);
					}
				}, function(err, validObj) {
					done();
				});
			});
		});
	});
});
