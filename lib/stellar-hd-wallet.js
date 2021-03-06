'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _has = require('lodash/has');

var _has2 = _interopRequireDefault(_has);

var _bip = require('bip39');

var _bip2 = _interopRequireDefault(_bip);

var _ed25519HdKeyRn = require('@hawkingnetwork/ed25519-hd-key-rn');

var _stellarBase = require('stellar-base');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ENTROPY_BITS = 256; // = 24 word mnemonic

var INVALID_SEED = 'Invalid seed (must be a Buffer or hex string)';
var INVALID_MNEMONIC = 'Invalid mnemonic (see bip39)';

/**
 * Class for SEP-0005 key derivation.
 * @see {@link https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0005.md|SEP-0005}
 */

var StellarHDWallet = function () {
  _createClass(StellarHDWallet, null, [{
    key: 'fromMnemonic',

    /**
     * Instance from a BIP39 mnemonic string.
     * @param {string} mnemonic A BIP39 mnemonic
     * @param {string} [password] Optional mnemonic password
     * @param {string} [language='english'] Optional language of mnemonic
     * @throws {Error} Invalid Mnemonic
     */
    value: function fromMnemonic(mnemonic) {
      var password = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
      var language = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'english';

      if (!StellarHDWallet.validateMnemonic(mnemonic, language)) {
        throw new Error(INVALID_MNEMONIC);
      }
      return new StellarHDWallet(_bip2.default.mnemonicToSeedHex(mnemonic, password));
    }

    /**
     * Instance from a seed
     * @param {(string|Buffer)} binary seed
     * @throws {TypeError} Invalid seed
     */

  }, {
    key: 'fromSeed',
    value: function fromSeed(seed) {
      var seedHex = void 0;

      if (Buffer.isBuffer(seed)) seedHex = seed.toString('hex');else if (typeof seed === 'string') seedHex = seed;else throw new TypeError(INVALID_SEED);

      return new StellarHDWallet(seedHex);
    }

    /**
     * Generate a mnemonic using BIP39
     * @param {Object} props Properties defining how to generate the mnemonic
     * @param {Number} [props.entropyBits=256] Entropy bits
     * @param {string} [props.language='english'] name of a language wordlist as
     *          defined in the 'bip39' npm module. See module.exports.wordlists:
     *          here https://github.com/bitcoinjs/bip39/blob/master/index.js
     * @param {function} [props.rng] RNG function (default is crypto.randomBytes)
     * @throws {TypeError} Langauge not supported by bip39 module
     * @throws {TypeError} Invalid entropy
     */

  }, {
    key: 'generateMnemonic',
    value: function generateMnemonic() {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref$entropyBits = _ref.entropyBits,
          entropyBits = _ref$entropyBits === undefined ? ENTROPY_BITS : _ref$entropyBits,
          _ref$language = _ref.language,
          language = _ref$language === undefined ? 'english' : _ref$language,
          _ref$rngFn = _ref.rngFn,
          rngFn = _ref$rngFn === undefined ? undefined : _ref$rngFn;

      if (language && !(0, _has2.default)(_bip2.default.wordlists, language)) throw new TypeError('Language ' + language + ' does not have a wordlist in the bip39 module');
      var wordlist = _bip2.default.wordlists[language];
      return _bip2.default.generateMnemonic(entropyBits, rngFn, wordlist);
    }

    /**
     * Validate a mnemonic using BIP39
     * @param {string} mnemonic A BIP39 mnemonic
     * @param {string} [language='english'] name of a language wordlist as
     *          defined in the 'bip39' npm module. See module.exports.wordlists:
     *          here https://github.com/bitcoinjs/bip39/blob/master/index.js
     * @throws {TypeError} Langauge not supported by bip39 module
     */

  }, {
    key: 'validateMnemonic',
    value: function validateMnemonic(mnemonic) {
      var language = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'english';

      if (language && !(0, _has2.default)(_bip2.default.wordlists, language)) throw new TypeError('Language ' + language + ' does not have a wordlist in the bip39 module');
      var wordlist = _bip2.default.wordlists[language];
      return _bip2.default.validateMnemonic(mnemonic, wordlist);
    }

    /**
     * New instance from seed hex string
     * @param {string} seedHex Hex string
     */

  }]);

  function StellarHDWallet(seedHex) {
    _classCallCheck(this, StellarHDWallet);

    this.seedHex = seedHex;
  }

  /**
   * Derive key given a full BIP44 path
   * @param {string} path BIP44 path string (eg. m/44'/148'/8')
   * @return {Buffer} Key binary as Buffer
   */


  _createClass(StellarHDWallet, [{
    key: 'derive',
    value: function derive(path) {
      var data = (0, _ed25519HdKeyRn.derivePath)(path, this.seedHex);
      return data.key;
    }

    /**
     * Get Stellar account keypair for child key at given index
     * @param {Number} index Account index into path m/44'/148'/{index}
     * @return {stellar-base.Keypair} Keypair instance for the account
     */

  }, {
    key: 'getKeypair',
    value: function getKeypair(index) {
      var key = this.derive('m/44\'/148\'/' + index + '\'');
      return _stellarBase.Keypair.fromRawEd25519Seed(key);
    }

    /**
     * Get public key for account at index
     * @param {Number} index Account index into path m/44'/148'/{index}
     * @return {string} Public key
     */

  }, {
    key: 'getPublicKey',
    value: function getPublicKey(index) {
      return this.getKeypair(index).publicKey();
    }

    /**
     * Get secret for account at index
     * @param {Number} index Account index into path m/44'/148'/{index}
     * @return {string} Secret
     */

  }, {
    key: 'getSecret',
    value: function getSecret(index) {
      return this.getKeypair(index).secret();
    }
  }]);

  return StellarHDWallet;
}();

exports.default = StellarHDWallet;
module.exports = exports['default'];