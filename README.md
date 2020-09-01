# LbelDB.js

[![License: Unlicense](https://img.shields.io/badge/license-Unlicense-green.svg)](http://unlicense.org/)

[![NPM](https://nodei.co/npm/lbeldb.png)](https://nodei.co/npm/lbeldb/)

A text-based no-corruption database for Node.js. Easy to use. Made for beginners.

## Installation

```sh
$ npm install lbeldb
```

## Usage

```js
const ldb = require("lbeldb");

ldb.init();
ldb.create(["name", "email", "employed"]);

ldb.addR(["Jaime", "jairegra@gmail.com", false]);
ldb.addR(["Rithul", "untenseunjury@gmail.com", false]);

ldb.store();

ldb.retrieve();

ldb.view();
```

## Documentation

Check out the [repository's wiki](https://github.com/JaimermXD/LbelDB.js/wiki) for a detailed documentation of the package.

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you would like to change.

Please make sure to update tests appropriately.

## License

Released under the [Unlicense](https://choosealicense.com/licenses/unlicense/) license.
