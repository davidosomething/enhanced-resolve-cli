# enhanced-resolve-cli

<https://github.com/davidosomething/enhanced-resolve-cli>

Get a resolved module path. Reads resolve settings from your
`webpack.config.js` if available, otherwise falls back to node resolution.

## Installation

```sh
npm install -g enhanced-resolve-cli
```

## Usage

```text
  Usage: enhancedresolve [options] <request>

  Provides `enhancedresolve` CLI tool to output a resolved path to a requested
  import/module with support for Node.js and webpack resolve options.


  Options:

    -V, --version                        output the version number
    -b, --basepath <basepath>            path to resolve from. Defaults to cwd
    -d, --debug                          output debugging info
    -s, --suppress                       suppress error output
    -w, --webpackConfig <webpackConfig>  path to a webpack.config.js file
    -h, --help                           output usage information
```

## Vim plugin

[vim-enhanced-resolver](https://github.com/davidosomething/vim-enhanced-resolver)
is a vim plugin using this cli tool. It provides a mappable `<Plug>` to jump
to the resolved file.

## Examples

Finds generic node_modules

```sh
$ enhancedresolve jspm
/Users/davidosomething/projects/davidosomething/16.davidosomething.com/node_modules/jspm/api.js
```

Webpack alias support

```sh
$ enhancedresolve lib/utils
/Full/Path/To/lib/utils.js
```

Resolves relative paths

```sh
$ enhancedresolve ../site.js
/Users/davidosomething/projects/davidosomething/16.davidosomething.com/lib/site.js
```

## License

MIT

