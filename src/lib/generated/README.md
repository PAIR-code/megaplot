
Source code files in this directory are generated by the script
`generate-code.ts` in the `util` directory and should not be edited manually.

To generate the code in this directory, you'll need to install the `ts-node`
npm package.  `ts-node` is not included in the dependencies listed in
`package.json` because it conflicts with running Karma in JavaScript mode. See
Karma issue [#3329](https://github.com/karma-runner/karma/issues/3329).

To install `ts-node`:

```sh
$ npm install ts-node
```

To run the code generator:

```sh
$ npm run generate
```

When finished, you can uninstall `ts-node`:

```sh
$ npm remove ts-node
```

The generated files should be checked like any other source code.
