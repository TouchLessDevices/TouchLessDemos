# Touch — Less

License: Apache 2.0

The code uses HandPose (https://www.npmjs.com/package/@tensorflow-models/handpose) a Tensorflow model that returns 21 3D hand keypoints

Also included is part of FingerPose (https://github.com/andypotato/fingerpose)

Requires Node 12

## First step

**Create a DotEnvironment file:**
Create a "`.env`" file based on the template from "`.env.dist`" - copy it and rename to `.env`
For local dev you'll need to add: `BROWSERSYNC_PROXY=http://localhost:8888` to your env file. Change `http://localhost:8888` to whatever your local dev domain is.

## Building and running on localhost

First install dependencies:

```sh
npm install
```

To create a production build:

```sh
gulp
```

To create a development build:

```sh
gulp watch
```

To clear the `www/build`-folder run:

```sh
gulp clean
```

## Running

```sh
gulp watch
```

## ES 6 and polyfills

By default the TypeScript `tsconfig.js` is configured to allow ES6 language features.
The release `gulp build` process then compiles an ES6 `main.[hash].js` bundle, and also a polyfilled `main.legacy.[hash].js` bundle for older browsers.
Older browsers will get the legacy bundle using the `<script nomodule>` approach outlined here: https://philipwalton.com/articles/deploying-es2015-code-in-production-today/

Polyfilling happens automatically by using Babel 7 + `babel-preset-env` targeting the browsers configured in `webpack.config.js`.

By default `babel-preset-env` is configured to try and be smart and only load polyfills needed for features that are actually used in the projects codebase.
Docs: https://babeljs.io/docs/en/babel-preset-env#include

If the above approach fails, it's possible to add more specific polyfills:
The polyfill files: `app/polyfills.mordern.js` and `app/polyfills.legacy.js` can have project specific polyfills in them.
