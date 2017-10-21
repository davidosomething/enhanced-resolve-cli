# enhanced-resolve-cli

Get a resolved module path. Reads resolve settings from your
`webpack.config.js` if found.

## Installation

```sh
npm install -g enhanced-resolve-cli
```

## Usage

```text
  Usage: enhancedresolve [options] <request>


  Options:

    -V, --version          output the version number
    -s, --suppress         Suppress error output
    -b, --basepath <path>  Path to resolve from </Users/davidosomething/projects/enhanced-resolve-cli>
    -h, --help             output usage information
```

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

