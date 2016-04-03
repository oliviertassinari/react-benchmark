## Get the most of React in production with Babel

React is well know to provide [good performances](https://auth0.com/blog/2016/01/07/more-benchmarks-virtual-dom-vs-angular-12-vs-mithril-js-vs-the-rest/)
out of the box thanks to his **virtual DOM** implementation.

There are [many ways](http://jaero.space/blog/react-performance-1) to speed it up.
Just to state few:
- You can use `process.env.node_env = 'production'` to disable all the checks that React is doing in the development environment.
For instance, that's going to bypass the `propTypes` validation.
- You can prune the reconciliation tree with the `shouldComponentUpdate` lifecycle method. The depth of pruned node matters a lot. The lower the depth is, the better.
- You can smartly use the key property on a long list of elements.
The idea is to give useful information to React so he can identify each element and perform as few DOM mutations as possible.

Those three approaches are very efficient.
You will soon or later have to use them as your application grow and you want to give user the
best possible experience.
Sometimes, this speedup tips are **not enough** and you start to investigate ways to push the performances further.

## Babel, a powerful tool

You may already now Babel. It has gotten famous by allowing us to use ES6 code,
in production, with [browsers](https://kangax.github.io/compat-table/es6/) that are not yet implementing it.

It used to be called `6to5`, but with the version 6, Babel has become much more than that.
It's now a powerful tool to apply code transformation at the [AST level](https://youtu.be/OZGgVxFxSIs).
You can do such thing with other tools. But this one is pretty convenient.
People may not realize it, but they are already using a lot of AST AST transformation function
when they write ES6 and JSX code.
Those ES6 and JSX transformation functions are packaged under two presets:
- `babel-preset-es2015`
- `babel-preset-react`

Thing started to be really interesting when Facebook released the version `0.14.0` of React.
They have introduced two different compiler optimizations that you can enable in production.
I haven't heard anything about it on Twitter nor Medium. I have realized it by carefully reading
the [release note](
https://facebook.github.io/react/blog/2015/10/07/react-v0.14.html#compiler-optimizations
):

> React now supports two compiler optimizations that can be enabled in Babel 5.8.24 and newer. Both of these transforms should be **enabled only in production** (e.g., just before minifying your code) because although they improve runtime performance, they make warning messages more cryptic and skip important checks that happen in development mode, including propTypes.


## Constant hoisting for React elements

The first compiler optimization proposed by Facebook hoists the creation of elements,
that are **fully static**,
to the top level. A component is fully static or [referential transparent](https://www.wikiwand.com/en/Referential_transparency) when it can be replaced with it's value without changing the behavior.

It's a babel plugin called [**transform-react-constant-elements**](https://babeljs.io/docs/plugins/transform-react-constant-elements/).
Let's have a look at a simple example:

**In**
```js
const Hr = () => {
  return <hr className="hr" />;
}
```

**Out**
```js
const _ref = <hr className="hr" />;

const Hr = () => {
  return _ref;
};
```

This transformation has two advantages:
- It tells React that the subtree hasn’t changed so React can completely skip it when reconciling.
- It reduces calls to `React.createElement` and the resulting memory allocations.

However, there are some **limitations** that you should be aware of.
It has two [documented deoptimisations](https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-react-constant-elements/test/fixtures/constant-elements).
It won't work if you are using the `ref` property or if you are spreading properties.

## Inlining React elements

The second compiler optimization proposed by Facebook is replacing the [`React.createElement`](https://github.com/facebook/react/blob/14b19870fe0504cbfb43127983f9aee411334cd6/src/isomorphic/classic/element/ReactElement.js#L117)
function with a more optimized one for the production: [`babelHelpers.jsx`](https://github.com/babel/babel/blob/8fb6f878a3843c4cc7dbe20168e633b1551ba699/packages/babel-helpers/src/helpers.js#L14).

It's a babel plugin called [**transform-react-inline-elements**](https://babeljs.io/docs/plugins/transform-react-inline-elements/).
Let's have a look at a simple example:

**In**
```js
<Baz foo="bar" key="1" />;
```

**Out**
```js
babelHelpers.jsx(Baz, {
  foo: 'bar'
}, key: '1');

/**
 * Instead of
 *
 * React.createElement(Baz, {
 *   foo: 'bar',
 *   key: '1',
 * });
 */
```

The advantage of this transform is skipping a loop through props.
The `babelHelpers.jsx` method has a slightly different API than the `React.createElement`.
He diretly accept a `props` argument that skip this [specific loop](https://github.com/facebook/react/blob/14b19870fe0504cbfb43127983f9aee411334cd6/src/isomorphic/classic/element/ReactElement.js#L140-L146):
```js
// Remaining properties are added to a new props object
for (propName in config) {
  if (config.hasOwnProperty(propName) &&
      !RESERVED_PROPS.hasOwnProperty(propName)) {
    props[propName] = config[propName];
  }
}
```

However, there are some **limitations** that you should be aware of.
It has two [documented deoptimisations](https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-react-constant-elements/test/fixtures/constant-elements).
It won't work if you are using `ref` property or if you are spreading properties.

I have also noticed [one issue](https://github.com/erikras/react-redux-universal-hot-example/pull/1037#discussion-diff-56849536). You can't use the JSX syntax like this: `<Navbar.Header>`.

## Remove `propTypes`

Looking at the power of the previous transformations,
I have soon be wondering if we couldn't get ride of the `propTypes` in production.
As soon as you set `process.env.node_env = 'production'` all the `propTypes` definitions
are simply **dead code**.

I have found a great plugin writen by Nikita Gusakov for this specific use case.
Unfortunatly, at that time, it was only working with babel 5. I endend up forking it with
[**transform-react-remove-prop-types**](https://github.com/oliviertassinari/babel-plugin-transform-react-remove-prop-types).
Let's have a look at a simple example:

**In**
```js
const Baz = () => (
  <div />
);

Baz.propTypes = {
  foo: React.PropTypes.string
};
```

**Out**
```js
const Baz = () => (
  <div />
);
```

The advantage of this transform is saving bandwidth. I'm not aware of any limitation.

## Let's benchamark this!

Applying plugins to the production build without ways to measure the impact of them is
like shooting in the dark. You shouldn't do it.

Now, you may be wondering, how efficient are those optimisations?
At Doctolib, we were wondering the same thing.
We have built a **complex calendar** that can display thousand of appointments with a doctor
on a single view.
We want the interface to be as fast as possible so that doctors can focus on what matters.

---

*img*

---

Hopefully, some tools are available. We can use them to benchmarks those plugins.
I have used an addon built by Facebook: [react-addons-perf](https://facebook.github.io/react/docs/perf.html) and [banchemark.js](https://benchmarkjs.com/).



# To wrap up

Only in production

I was supprised and started spreading it
https://github.com/FormidableLabs/spectacle/pull/154
https://github.com/davezuko/react-redux-starter-kit/pull/561
https://github.com/erikras/react-redux-universal-hot-example/pull/1037
https://github.com/kriasoft/react-starter-kit/pull/440
