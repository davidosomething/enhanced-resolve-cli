#!/usr/bin/env node

const VERSION = require('./package.json').version;

const fs = require('fs');
const path = require('path');

const program = require('commander');
const makeResolver = require('enhanced-resolve').create;

const WEBPACK_PATH = path.join('node_modules', 'webpack', 'lib', 'webpack.js');
const WEBPACK_CONFIGFILE = 'webpack.config.js'

/**
 * @return {string[]} array of paths from startdir upwards
 */
const getTree = (startdir) => {
  let current = startdir;
  const root = path.parse(startdir).root;
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
const findLocal = (startdir = process.cwd(), needle) => {
  const pathTree = getTree(startdir);
  const result = pathTree.findIndex((p) => fs.existsSync(path.join(p, needle)));
  if (result ===  -1) { return; }
  return path.join(pathTree[result], needle);
};

const formatter = (request, options) => (err, filepath) => {
  if (err) {
    if (!options.suppress) {
      console.error(`Could not resolve ${request} from ${options.basepath}`);
    }
    process.exit(1);
  }
  console.log(filepath);
};

const getWebpackOptions = (webpackConfigPath, webpackPath) => {
  let webpack;
  let webpackCompiler;

  let webpackConfig;
  try {
    webpackConfig = require(require.resolve(webpackConfigPath));
    webpackConfig = typeof webpackConfig === 'function'
      ? webpackConfig()
      : webpackConfig;

    webpack = require(require.resolve(webpackPath));
    webpackCompiler = webpack(webpackConfig);

    // @TODO support options.multiConfigIndex
    webpackCompiler = webpackCompiler.compilers
      ? webpackCompiler.compilers[0]
      : webpackCompiler;

    return webpackCompiler.options.resolve;
  } catch (e) { /**/ }
  return null;
};

const getResolverOptions = (request, options = {}) => {
  const localWebpackConfig = findLocal(options.basepath, options.webpackConfig);
  const localWebpackPath = findLocal(options.basepath, WEBPACK_PATH);
  const resolverOptions = localWebpackConfig && localWebpackPath
    ? getWebpackOptions(localWebpackConfig, localWebpackPath) || {}
    : {};

  return resolverOptions;
};

const outputResult = (request, options = {}) => {
  if (!request) { program.help(); }
  const resolverOptions = getResolverOptions(request, options);
  const resolver = makeResolver(resolverOptions);
  //console.log({}, options.basepath, request, formatter(request, options));
  resolver({}, options.basepath, request, formatter(request, options));
};

program
  .version(VERSION)
  .arguments('<request>', 'Thing to resolve using enhanced-resolve')
  .option('-s, --suppress', 'Suppress error output')
  .option('-b, --basepath <path>', `Path to resolve from <${process.cwd()}>`, process.cwd())
  .option('-w, --webpackConfig <webpackConfig>', `Path to a webpack.config.js file`, WEBPACK_CONFIGFILE)
  .action(outputResult)
  .parse(process.argv);
