var mongoose = require('mongoose')
    , consts = require('./consts')
    , node_utils = require('../util/node_utils')
    , caches = require('./caches')
    , redis = require('redis');

var peerChannels = exports.peerChannels = {};

