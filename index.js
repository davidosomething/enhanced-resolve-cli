#!/usr/bin/env node

/**
 * @typedef ProgramOptions
 * @property {object}   options
 * @property {string}   options.basepath=process.cwd()
 * @property {boolean}  options.debug=false
 * @property {boolean}  options.suppress=false
 * @property {string}   [options.webpackConfig]
 */

const package = require('./package.json');
const [ VERSION, DESCRIPTION ] = [ package.version, package.description ];

const fs = require('fs');
const path = require('path');

const program = require('commander');
const makeResolver = require('enhanced-resolve').create;

const WEBPACK_PATH = path.join('node_modules', 'webpack', 'lib', 'webpack.js');
const WEBPACK_CONFIG_FILENAME = 'webpack.config.js'

/**
 * @return {string[]} array of paths from startDir upwards
 */
const getTree = (startDir) => {
  let current = startDir;
  const root = path.parse(startDir).root;
  const paths = [];
  while (current !== root) {
    paths.push(current);
    current = path.dirname(current);
  }
  return paths;
};

/**
 * Find something relative to where this program is run
 */
const findLocal = (startDir = process.cwd(), needle) => {
  const pathTree = getTree(startDir);
  const result = pathTree.findIndex((p) => fs.existsSync(path.join(p, needle)));
  if (result ===  -1) { return; }
  return path.join(pathTree[result], needle);
};

/**
 * @param {string} request file
 * @param {ProgramOptions} options
 */
const formatter = (request, options) => (err, filepath) => {
  if (err) {
    if (!options.suppress) {
      console.info(`Could not resolve ${request} from ${options.basepath}`);
    }
    process.exit(1);
  }
  console.log(filepath);
};

/**
 * @param {string} webpackConfigFile full path to a webpack.config.js
 * @param {string} webpackModule full path to node_modules/webpack
 * @return {?object} webpack options object
 */
const getWebpackOptions = (webpackConfigFile, webpackModule) => {
  let webpack;
  let webpackCompiler;

  let webpackConfig;
  try {
    webpackConfig = require(require.resolve(webpackConfigPath));
    webpackConfig = typeof webpackConfig === 'function'
      ? webpackConfig()
      : webpackConfig;

    webpack = require(require.resolve(webpackModule));
    webpackCompiler = webpack(webpackConfig);

    // @TODO support options.multiConfigIndex
    webpackCompiler = webpackCompiler.compilers
      ? webpackCompiler.compilers[0]
      : webpackCompiler;

    return webpackCompiler.options.resolve;
  } catch (e) { /**/ }
  return null;
};

/**
 * @param {string} request file
 * @param {ProgramOptions} options
 * @return {object} webpack resolver options for use in enhanced-resolve
 */
const getResolverOptions = (request, options) => {
  const webpackConfigFile = options.webpackConfig
    || findLocal(options.basepath, WEBPACK_CONFIG_FILENAME);
  if (options.debug) { console.info('Webpack config file: ', webpackConfigFile); }

  const webpackModule = findLocal(options.basepath, WEBPACK_PATH);
  if (options.debug) { console.info('Webpack module: ', webpackModule); }

  const resolverOptions = webpackConfigFile && webpackModule
    ? getWebpackOptions(webpackConfigFile, webpackModule) || {}
    : {};

  return resolverOptions;
};

/**
 * @param {string} request file
 * @param {ProgramOptions} options
 */
const outputResult = (request, options) => {
  const startDir = path.resolve(options.basepath);
  if (options.debug) { console.info('Basepath: ', startDir); }

  const resolverOptions = getResolverOptions(request, options);
  const resolver = makeResolver(resolverOptions);
  resolver({}, startDir, request, formatter(request, options));
};

program
  .version(VERSION)
  .description(DESCRIPTION)
  .arguments('<request>', 'Thing to resolve using enhanced-resolve')
  .option('-b, --basepath <basepath>', `Path to resolve from <${process.cwd()}>`, process.cwd())
  .option('-d, --debug', 'Output debugging info', false)
  .option('-s, --suppress', 'Suppress error output', false)
  .option('-w, --webpackConfig <webpackConfig>', `Path to a webpack.config.js file`)
  .action(outputResult)
  .parse(process.argv);

if (!program.args.length) { program.help(); }
