module.exports = {
    'preprocessor:packs': ['factory', require('./preprocessor')],
    'reporter:packs-coverage': ['type', require('./coverage-reporter')]
};