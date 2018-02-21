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
    if (!options.suppress) { console.error(`[ERROR] Could not resolve ${request} from ${options.basepath}`); }
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
    webpackConfig = require(require.resolve(webpackConfigFile));
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
  } catch (e) {
    console.info(e)
  }
  return null;
};

/**
 * @param {string} request file
 * @param {ProgramOptions} options
 * @return {object} webpack resolver options for use in enhanced-resolve
 */
const getResolverOptions = (request, options) => {
  const webpackConfigFile = findLocal(options.basepath, options.webpackConfig)
    || findLocal(options.basepath, WEBPACK_CONFIG_FILENAME);
  if (options.debug) { console.info('[DEBUG] Webpack config file: ', webpackConfigFile); }

  const webpackModule = findLocal(options.basepath, WEBPACK_PATH);
  if (options.debug) { console.info('[DEBUG] Webpack module: ', webpackModule); }

  if (webpackConfigFile && !webpackModule) {
    if( !options.suppress) { console.error('[ERROR] Found a webpack config file but could not find local webpack module'); }
    process.exit(1);
  }

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
  if (options.debug) { console.info('[DEBUG] Basepath: ', startDir); }

  const resolverOptions = getResolverOptions(request, options);
  const resolver = makeResolver(resolverOptions);
  resolver({}, startDir, request, formatter(request, options));
};

program
  .version(VERSION)
  .description(DESCRIPTION)
  .arguments('<request>', 'thing to resolve using enhanced-resolve')
  .option('-b, --basepath <basepath>', `path to resolve from. Defaults to cwd`, process.cwd())
  .option('-d, --debug', 'output debugging info', false)
  .option('-s, --suppress', 'suppress error output', false)
  .option('-w, --webpackConfig <webpackConfig>', `path to a webpack.config.js file`)
  .action(outputResult)
  .parse(process.argv);

if (!program.args.length) { program.help(); }
